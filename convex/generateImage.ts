import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const generateProjectImage = internalAction({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a project thumbnail image in a studio ghibli style for: ${args.title} - ${args.description}`,
          n: 1,
          size: "1024x1024",
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      data: Array<{ url: string }>;
    };
    const imageUrl = data.data[0].url;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    const imageBlob = await imageResponse.blob();

    const storageId = await ctx.storage.store(imageBlob);

    await ctx.runMutation(internal.projects.saveImage, {
      projectId: args.projectId,
      storageId,
    });
  },
});
