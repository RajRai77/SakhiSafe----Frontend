import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    profileComplete: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  // Trusted emergency contacts
  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
    priority: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_priority", ["userId", "priority"]),

  // Registered hardware devices
  devices: defineTable({
    userId: v.id("users"),
    deviceId: v.string(),       // unique ID printed on hardware
    deviceName: v.string(),
    isActive: v.boolean(),
    lastSeen: v.optional(v.string()),       // ISO timestamp
    batteryLevel: v.optional(v.number()),   // 0–100
    signalStrength: v.optional(v.string()), // "strong" | "medium" | "weak" | "none"
  })
    .index("by_user", ["userId"])
    .index("by_device_id", ["deviceId"]),

  // Alert history (triggered by hardware)
  alerts: defineTable({
    userId: v.id("users"),
    deviceId: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mapLink: v.optional(v.string()),
    status: v.union(
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    contactsNotified: v.array(v.string()),
    note: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
