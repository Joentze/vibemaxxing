import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chats").order("desc").collect();
  },
});

export const listBySandbox = query({
  args: { sandboxId: v.id("sandboxes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_sandboxId", (q) => q.eq("sandboxId", args.sandboxId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { name: v.string(), sandboxId: v.id("sandboxes") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("chats", {
      name: args.name,
      sandboxId: args.sandboxId,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("chats"), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Chat not found");
    }
    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Chat not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.id))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(args.id);
  },
});
