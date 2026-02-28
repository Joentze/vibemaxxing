import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sandboxes").order("desc").collect();
  },
});

export const listStarted = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sandboxes")
      .withIndex("by_agentCoding", (q) => q.eq("agentCoding", "started"))
      .order("desc")
      .collect();
  },
});

export const listCoding = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sandboxes")
      .withIndex("by_agentCoding", (q) => q.eq("agentCoding", "coding"))
      .order("desc")
      .collect();
  },
});

export const listFinished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sandboxes")
      .withIndex("by_agentCoding", (q) => q.eq("agentCoding", "finished"))
      .order("desc")
      .collect();
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
    expiryDate: v.number(),
    agentCoding: v.union(
      v.literal("started"),
      v.literal("coding"),
      v.literal("finished"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sandboxes", {
      sandboxId: args.sandboxId,
      url: args.url,
      expiryDate: args.expiryDate,
      agentCoding: args.agentCoding,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sandboxes"),
    sandboxId: v.optional(v.string()),
    url: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    agentCoding: v.optional(
      v.union(
        v.literal("started"),
        v.literal("coding"),
        v.literal("finished"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Sandbox not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.url !== undefined) updates.url = args.url;
    if (args.expiryDate !== undefined) updates.expiryDate = args.expiryDate;
    if (args.agentCoding !== undefined) updates.agentCoding = args.agentCoding;

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
