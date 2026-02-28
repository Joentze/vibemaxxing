import { openai } from "@ai-sdk/openai";
import { generateImage } from "ai";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../convex/_generated/dataModel";

type UntypedConvexHttpClient = {
    mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

function imageToBytes(image: unknown): Uint8Array {
    if (image instanceof Uint8Array) {
        return image;
    }
    if (image instanceof ArrayBuffer) {
        return new Uint8Array(image);
    }
    if (typeof image === "string") {
        const base64 = image.startsWith("data:") ? image.split(",")[1] ?? "" : image;
        return Buffer.from(base64, "base64");
    }
    if (
        typeof image === "object" &&
        image !== null &&
        "uint8Array" in image &&
        (image as { uint8Array?: unknown }).uint8Array instanceof Uint8Array
    ) {
        return (image as { uint8Array: Uint8Array }).uint8Array;
    }
    throw new Error("Unsupported image format returned by generateImage");
}

export async function createProjectImage({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    "use step";
    globalThis.fetch = fetch;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }

    const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
    const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: `
    create a project image for the following title and description
    do it in a studio ghibli style:
    title: ${title}
    description: ${description}
    `,
    });

    const uploadUrl = await convex.mutation("files:generateUploadUrl", {});
    if (typeof uploadUrl !== "string") {
        throw new Error("Failed to create Convex upload URL");
    }

    const imageBytes = imageToBytes(image);
    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: new Blob([Buffer.from(imageBytes)], { type: "image/png" }),
    });

    if (!uploadResponse.ok) {
        throw new Error(`Image upload failed with status ${uploadResponse.status}`);
    }

    const uploadResult = (await uploadResponse.json()) as { storageId?: Id<"_storage"> };
    if (!uploadResult.storageId) {
        throw new Error("Convex upload did not return storageId");
    }

    const imageUrl = await convex.query("files:getImageUrl", {
        storageId: uploadResult.storageId,
    });
    if (typeof imageUrl !== "string") {
        throw new Error("Convex did not return a valid image URL");
    }

    return imageUrl;
}