import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sandboxes").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("sandboxes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    sandboxId: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sandboxes", {
      sandboxId: args.sandboxId,
      url: args.url,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sandboxes"),
    sandboxId: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Sandbox not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.url !== undefined) updates.url = args.url;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("sandboxes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Sandbox not found");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_sandboxId", (q) => q.eq("sandboxId", args.id))
      .collect();

    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    await ctx.db.delete(args.id);
  },
});
