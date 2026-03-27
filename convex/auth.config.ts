import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://uncommon-gar-47.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;