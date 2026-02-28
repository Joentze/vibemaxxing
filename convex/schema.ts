
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    chats: defineTable({
        name: v.string(),
        updatedAt: v.number(),
    }),

    messages: defineTable({
        chatId: v.id("chats"),
        role: v.string(),
        parts: v.any(),
        attachments: v.any(),
        metadata: v.any(),
        updatedAt: v.number(),
    }).index("by_chatId", ["chatId"]),

    sandboxes: defineTable({
        sandboxId: v.string(),
        url: v.string(),
        expiryDate: v.optional(v.number()),
        agentCoding: v.union(
            v.literal("started"),
            v.literal("coding"),
            v.literal("finished"),
        ),
    })
        .index("by_sandboxId", ["sandboxId"])
        .index("by_agentCoding", ["agentCoding"]),

    projects: defineTable({
        title: v.string(),
        description: v.string(),
        sandboxId: v.id("sandboxes"),
        image: v.optional(v.id("_storage")),
    }).index("by_sandboxId", ["sandboxId"]),
});
