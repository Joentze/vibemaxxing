import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.string(),
    parts: v.any(),
    attachments: v.any(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      parts: args.parts,
      attachments: args.attachments,
      metadata: args.metadata,
      updatedAt: now,
    });
    await ctx.db.patch(args.chatId, { updatedAt: now });
    return messageId;
  },
});

export const update = mutation({
  args: {
    id: v.id("messages"),
    role: v.optional(v.string()),
    parts: v.optional(v.any()),
    attachments: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Message not found");
    }
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch(id, updates);
    await ctx.db.patch(existing.chatId, { updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Message not found");
    }
    await ctx.db.delete(args.id);
    await ctx.db.patch(existing.chatId, { updatedAt: Date.now() });
  },
});
