import { useNavigate } from "react-router-dom";
import { LogInIcon } from "lucide-react";

export function SignInButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/login")}
      className="w-full flex items-center justify-center gap-2 bg-[#f43f5e] hover:bg-[#e11d48] text-white py-4 px-4 rounded-xl text-lg font-semibold transition-colors shadow-lg"
    >
      <LogInIcon className="w-5 h-5" />
      Sign In
    </button>
  );
}

// Keep a default export just in case the Home page imports it that way!
export default SignInButton;