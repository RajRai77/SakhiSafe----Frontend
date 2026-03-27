import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      {/* Isko wapas Callback pe bhej do taki user DB me save ho jaye */}
      <SignIn forceRedirectUrl="/" />
    </div>
  );
}