import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    // FIX: Changed identity.tokenIdentifier to identity.subject
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
      
    if (!user) return [];
    return await ctx.db
      .query("contacts")
      .withIndex("by_user_priority", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    
    // FIX: Changed identity.tokenIdentifier to identity.subject
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
      
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Check max 5 contacts
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (existing.length >= 5) {
      throw new ConvexError({ message: "Maximum 5 contacts allowed", code: "BAD_REQUEST" });
    }

    return await ctx.db.insert("contacts", {
      userId: user._id,
      name: args.name,
      phone: args.phone,
      relationship: args.relationship,
      priority: args.priority,
    });
  },
});

export const remove = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    
    // FIX: Changed identity.tokenIdentifier to identity.subject
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
      
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new ConvexError({ message: "Contact not found", code: "NOT_FOUND" });
    }
    await ctx.db.delete(args.contactId);
  },
});

export const update = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    relationship: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    
    // FIX: Changed identity.tokenIdentifier to identity.subject
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
      
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new ConvexError({ message: "Contact not found", code: "NOT_FOUND" });
    }

    const { contactId, ...fields } = args;
    await ctx.db.patch(contactId, fields);
  },
});