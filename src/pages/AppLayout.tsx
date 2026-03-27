import { Outlet, NavLink, useLocation } from "react-router-dom";
import { HomeIcon, UserIcon, UsersIcon, CpuIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/contacts", label: "Contacts", icon: UsersIcon },
  { to: "/device", label: "Device", icon: CpuIcon },
  { to: "/history", label: "History", icon: ClockIcon },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">SakhiSafe</span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] text-green-700 dark:text-green-400 font-semibold">Setup App</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-background border-t border-border px-1 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
