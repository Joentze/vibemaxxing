
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
});
