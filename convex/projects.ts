import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").collect();
    return Promise.all(
      projects.map(async (project) => ({
        ...project,
        ...(project.image
          ? { imageUrl: await ctx.storage.getUrl(project.image) }
          : {}),
      })),
    );
  },
});

export const listBySandbox = query({
  args: { sandboxId: v.id("sandboxes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_sandboxId", (q) => q.eq("sandboxId", args.sandboxId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    return {
      ...project,
      ...(project.image
        ? { imageUrl: await ctx.storage.getUrl(project.image) }
        : {}),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    sandboxId: v.id("sandboxes"),
  },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.sandboxId);
    if (!sandbox) {
      throw new Error("Sandbox not found");
    }

    return await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      sandboxId: args.sandboxId,
    });
  },
});

export const createWithSandbox = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    sandboxExternalId: v.string(),
    sandboxUrl: v.string(),
    sandboxExpiryDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sandboxDocId = await ctx.db.insert("sandboxes", {
      sandboxId: args.sandboxExternalId,
      url: args.sandboxUrl,
      expiryDate: args.sandboxExpiryDate,
      agentCoding: "started",
    });

    const projectDocId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      sandboxId: sandboxDocId,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.generateImage.generateProjectImage,
      {
        projectId: projectDocId,
        title: args.title,
        description: args.description,
      },
    );

    return {
      sandboxId: sandboxDocId,
      projectId: projectDocId,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sandboxId: v.optional(v.id("sandboxes")),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (args.sandboxId !== undefined) {
      const sandbox = await ctx.db.get(args.sandboxId);
      if (!sandbox) {
        throw new Error("Sandbox not found");
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.image !== undefined) updates.image = args.image;

    await ctx.db.patch(args.id, updates);
  },
});

export const saveImage = internalMutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { image: args.storageId });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    await ctx.db.delete(args.id);
  },
});


export const createProjectWithSandbox = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    sandboxExternalId: v.string(),
    sandboxUrl: v.string(),
    sandboxExpiryDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sandboxDocId = await ctx.db.insert("sandboxes", {
      sandboxId: args.sandboxExternalId,
      url: args.sandboxUrl,
      expiryDate: args.sandboxExpiryDate,
      agentCoding: "started",
    });
    const projectDocId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      sandboxId: sandboxDocId,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.generateImage.generateProjectImage,
      {
        projectId: projectDocId,
        title: args.title,
        description: args.description,
      },
    );

    return {
      sandboxId: sandboxDocId,
      projectId: projectDocId,
    };
  },
});