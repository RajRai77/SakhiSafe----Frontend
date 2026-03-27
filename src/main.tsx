import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// import "./index.css"; // Make sure your global CSS is imported if you have one!

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

// 1. Initialize the Convex client with your backend URL
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// 2. Fetch the Clerk Publishable Key from your .env.local
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// 3. Safety check to ensure the key is loaded
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please check your .env.local file.");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
);