import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react"; // Added Clerk's direct check
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated: isConvexAuth, isLoading: isConvexLoading } = useConvexAuth();
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useClerkAuth();
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // 1. Wait until BOTH Clerk and Convex finish loading
    if (isConvexLoading || !isClerkLoaded) return;

    // 2. Route the user
    if (isConvexAuth) {
      // Success! Both systems agree you are logged in.
      navigate("/", { replace: true });
    } else if (!isClerkSignedIn) {
      // Genuinely not logged in anywhere
      navigate("/login", { replace: true });
    } else {
      // THE LOOP BREAKER: Clerk says YES, Convex says NO.
      setAuthFailed(true);
    }
  }, [isConvexAuth, isConvexLoading, isClerkLoaded, isClerkSignedIn, navigate]);

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center h-svh gap-4 bg-background px-4 text-center">
        <h2 className="text-xl font-bold text-destructive">Database Auth Failed</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Clerk successfully logged you in, but your Convex database rejected the token. 
          Please check your Convex Dashboard Authentication settings.
        </p>
        <Button onClick={() => window.location.href = "/"} variant="outline" className="mt-4">
          Force Go To Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4 bg-background">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Verifying secure session...</p>
    </div>
  );
}