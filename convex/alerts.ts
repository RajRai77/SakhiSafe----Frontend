import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMapLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

async function getUserByIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserByIdentity(ctx);
    if (!user) return [];
    return ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

/** Returns the most recent "sending" alert for the authenticated user. */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserByIdentity(ctx);
    if (!user) return null;
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
    return alerts.find((a) => a.status === "sending") ?? null;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Test SOS triggered from within the app (uses browser geolocation).
 * Creates an alert with status "sending".
 */
export const triggerFromApp = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Collect contact names for the alert record
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const contactNames = contacts.map((c) => c.name);

    return ctx.db.insert("alerts", {
      userId: user._id,
      latitude: args.latitude,
      longitude: args.longitude,
      mapLink: makeMapLink(args.latitude, args.longitude),
      status: "sending",
      contactsNotified: contactNames,
      note: args.note ?? "Triggered from app (test)",
    });
  },
});

/** Cancel an active "sending" alert. */
export const cancel = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new ConvexError({ message: "Alert not found", code: "NOT_FOUND" });
    }
    await ctx.db.patch(args.alertId, { status: "cancelled" });
  },
});

export const updateStatus = mutation({
  args: {
    alertId: v.id("alerts"),
    status: v.union(
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.patch(args.alertId, { status: args.status });
  },
});

// ─── Internal Mutations (called by HTTP action) ───────────────────────────────

/**
 * Creates an SOS alert triggered by the GSM hardware device via the HTTP webhook.
 * Looks up the device, finds the owner, and inserts the alert.
 */
export const createFromDevice = internalMutation({
  args: {
    deviceId: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Look up the registered device
    const device = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .unique();
    if (!device) {
      throw new ConvexError({ message: "Device not registered", code: "NOT_FOUND" });
    }

    // Update device lastSeen
    await ctx.db.patch(device._id, { lastSeen: new Date().toISOString() });

    // Get the device owner's contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", device.userId))
      .collect();
    const contactNames = contacts.map((c) => c.name);

    const lat = args.latitude;
    const lng = args.longitude;

    return ctx.db.insert("alerts", {
      userId: device.userId,
      deviceId: args.deviceId,
      latitude: lat,
      longitude: lng,
      mapLink: lat !== undefined && lng !== undefined ? makeMapLink(lat, lng) : undefined,
      status: "sending",
      contactsNotified: contactNames,
    });
  },
});
