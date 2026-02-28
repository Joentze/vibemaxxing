
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
    }).index("by_sandboxId", ["sandboxId"]),

    projects: defineTable({
        title: v.string(),
        description: v.string(),
        sandboxId: v.id("sandboxes"),
    }).index("by_sandboxId", ["sandboxId"]),
});
