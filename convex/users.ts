import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Get current user profile (or fetch Google data if new user)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Ye line Clerk se directly aapka Google/Email data uthati hai
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null; // User logged in nahi hai
    }

    // Database mein check karo ki kya ye user pehle se saved hai?
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user) {
      return user; // Agar saved hai, toh DB wala data bhej do
    }

    // Agar user FIRST TIME login kar raha hai, toh Google ka naam/email bhej do!
    return {
      name: identity.name ?? identity.nickname ?? identity.givenName ?? "",
      email: identity.email ?? "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      profileComplete: false,
    };
  },
});


// 2. Update or Create Profile in Database
export const updateProfile = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Unauthenticated call to updateProfile");
    }

    // Check if user has completely filled the form
    const isProfileComplete = Boolean(args.name && args.phone && args.address && args.city);

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user !== null) {
      // User exists, just UPDATE their details
      await ctx.db.patch(user._id, {
        name: args.name,
        phone: args.phone,
        email: args.email,
        address: args.address,
        city: args.city,
        state: args.state,
        pincode: args.pincode,
        profileComplete: isProfileComplete,
      });
    } else {
      // BRAND NEW User, INSERT them into the database
      await ctx.db.insert("users", {
        tokenIdentifier: identity.subject, // Ye Clerk ka unique ID hai
        name: args.name,
        phone: args.phone,
        email: args.email,
        address: args.address,
        city: args.city,
        state: args.state,
        pincode: args.pincode,
        profileComplete: isProfileComplete,
      });
    }
  },
});