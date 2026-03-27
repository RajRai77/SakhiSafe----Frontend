import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { ShieldIcon, UserIcon, BellIcon, SmartphoneIcon, InfoIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

function SettingRow({ icon: Icon, label, description, action }: {
  icon: typeof ShieldIcon;
  label: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      {action}
    </div>
  );
}

function SettingsContent() {
  const user = useQuery(api.users.getCurrentUser, {});
  const { removeUser } = useAuth();

  const handleSignOut = async () => {
    await removeUser();
    toast.success("Signed out successfully");
  };

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your safety preferences</p>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{user?.name ?? "User"}</div>
          <div className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</div>
        </div>
      </motion.div>

      {/* Settings sections */}
      <div className="bg-card border border-border rounded-xl px-4">
        <SettingRow
          icon={UserIcon}
          label="Profile"
          description="Name, blood group, and personal info"
          action={<span className="text-xs text-muted-foreground">Coming soon</span>}
        />
        <SettingRow
          icon={BellIcon}
          label="Notifications"
          description="Alert preferences and test messages"
          action={<span className="text-xs text-muted-foreground">Coming soon</span>}
        />
        <SettingRow
          icon={SmartphoneIcon}
          label="Device Pairing"
          description="Connect SakhiSafe pendant hardware"
          action={<span className="text-xs text-primary font-medium">Future</span>}
        />
        <SettingRow
          icon={ShieldIcon}
          label="Permissions"
          description="Location, notifications, and contacts"
          action={
            <button
              className="text-xs text-primary font-medium"
              onClick={() => {
                navigator.permissions.query({ name: "geolocation" }).then((result) => {
                  toast.info(`Location access: ${result.state}`);
                });
              }}
            >
              Check
            </button>
          }
        />
      </div>

      {/* App info */}
      <div className="bg-card border border-border rounded-xl px-4">
        <SettingRow
          icon={InfoIcon}
          label="SakhiSafe"
          description="Version 1.0 — Women Safety App"
        />
      </div>

      {/* Coming soon hardware section */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <SmartphoneIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Hardware Coming Soon</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The SakhiSafe smart pendant will connect via Bluetooth. It will add fingerprint SOS trigger, standalone GPS, and offline alerts.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full text-center py-3 text-sm text-destructive font-medium border border-destructive/30 rounded-xl hover:bg-destructive/5 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-4 text-center">
          <p className="text-muted-foreground">Sign in to access settings</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <SettingsContent />
      </Authenticated>
    </>
  );
}
