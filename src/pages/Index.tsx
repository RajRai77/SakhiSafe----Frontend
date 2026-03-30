import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  MapPinIcon,
  XIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useState, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type StepStatus = "complete" | "incomplete" | "optional";

type SetupStep = {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  href: string;
};

function SetupStepRow({ step, index }: { step: SetupStep; index: number }) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => navigate(step.href)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        step.status === "complete"
          ? "bg-green-100 dark:bg-green-950/40"
          : step.status === "incomplete"
          ? "bg-primary/10"
          : "bg-muted"
      }`}>
        {step.status === "complete" ? (
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <AlertCircleIcon className={`w-5 h-5 ${step.status === "incomplete" ? "text-primary" : "text-muted-foreground"}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{step.label}</span>
          {step.status === "optional" && (
            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Optional</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
}

/** Shows elapsed time since the alert started. */
function Elapsed({ since }: { since: number }) {
  const [seconds, setSeconds] = useState(Math.floor((Date.now() - since) / 1000));
  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(id);
  }, [since]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span>{m > 0 ? `${m}m ` : ""}{s}s ago</span>;
}

/** Pulsing SOS alert banner shown at the top of the dashboard. */
function ActiveAlertBanner({
  alert,
}: {
  alert: {
    _id: Id<"alerts">;
    _creationTime: number;
    latitude?: number;
    longitude?: number;
    mapLink?: string;
    contactsNotified: string[];
    note?: string;
  };
}) {
  const cancelAlert = useMutation(api.alerts.cancel);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAlert({ alertId: alert._id });
      toast.success("Alert cancelled");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to cancel alert");
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl overflow-hidden border-2 border-red-500 bg-red-50 dark:bg-red-950/40"
    >
      {/* Pulsing top bar */}
      <div className="relative bg-red-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Pulsing dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span className="text-white font-bold text-sm tracking-wide uppercase">SOS Active</span>
        </div>
        <span className="text-white/80 text-xs">
          <Elapsed since={alert._creationTime} />
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300 font-medium leading-snug">
            Emergency alert is being sent to your contacts.
          </p>
        </div>

        {/* Location */}
        {alert.latitude !== undefined && alert.longitude !== undefined && (
          <div className="flex items-center gap-2 bg-white/60 dark:bg-white/10 rounded-xl px-3 py-2">
            <MapPinIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-300 font-mono flex-1 truncate">
              {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
            </span>
            {alert.mapLink && (
              <a
                href={alert.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-red-700 dark:text-red-300 underline flex-shrink-0"
              >
                View Map
              </a>
            )}
          </div>
        )}

        {/* Contacts being notified */}
        {alert.contactsNotified.length > 0 && (
          <p className="text-xs text-red-700 dark:text-red-400">
            <span className="font-semibold">Notifying:</span>{" "}
            {alert.contactsNotified.join(", ")}
          </p>
        )}

        {alert.note && (
          <p className="text-xs text-red-600/70 dark:text-red-400/70 italic">{alert.note}</p>
        )}

        {/* Cancel */}
        <Button
          onClick={handleCancel}
          disabled={cancelling}
          size="sm"
          className="w-full bg-white hover:bg-white/90 text-red-600 border border-red-300 gap-2"
        >
          <XIcon className="w-4 h-4" />
          {cancelling ? "Cancelling..." : "Cancel Alert"}
        </Button>
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const user = useQuery(api.users.getCurrentUser, {});
  const contacts = useQuery(api.contacts.list, {});
  const devices = useQuery(api.devices.list, {});
  const activeAlert = useQuery(api.alerts.getActive, {});

  const isLoading =
    user === undefined ||
    contacts === undefined ||
    devices === undefined ||
    activeAlert === undefined;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const profileDone = !!(user?.name && user?.phone && user?.address && user?.city);
  const contactsDone = (contacts?.length ?? 0) >= 1;
  const deviceDone = (devices?.length ?? 0) >= 1;

  const completedSteps = [profileDone, contactsDone, deviceDone].filter(Boolean).length;
  const totalSteps = 3;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const steps: SetupStep[] = [
    {
      id: "profile",
      label: "Personal Details",
      description: profileDone
        ? `${user?.name} · ${user?.city}`
        : "Add your name, phone, and home address",
      status: profileDone ? "complete" : "incomplete",
      href: "/profile",
    },
    {
      id: "contacts",
      label: "Emergency Contacts",
      description: contactsDone
        ? `${contacts.length} contact${contacts.length > 1 ? "s" : ""} added`
        : "Add trusted people who'll get SMS alerts",
      status: contactsDone ? "complete" : "incomplete",
      href: "/contacts",
    },
    {
      id: "device",
      label: "Register Device",
      description: deviceDone
        ? `${devices[0].deviceName} registered`
        : "Link your SakhiSafe hardware device",
      status: deviceDone ? "complete" : "incomplete",
      href: "/device",
    },
  ];

  return (
    <div className="p-4 space-y-5">

      {/* Active SOS alert banner */}
      <AnimatePresence>
        {activeAlert && (
          <ActiveAlertBanner key={activeAlert._id} alert={activeAlert} />
        )}
      </AnimatePresence>

      {/* Hero status card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 ${
          progressPct === 100
            ? "bg-green-500"
            : "bg-gradient-to-br from-primary to-primary/80"
        } text-primary-foreground`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium opacity-80">
              {progressPct === 100 ? "You're all set!" : "Setup in progress"}
            </p>
            <h2 className="text-2xl font-bold mt-0.5">
              {user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Welcome"}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <ShieldIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="opacity-80">Setup progress</span>
            <span>{completedSteps}/{totalSteps} steps</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-white h-2 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      {progressPct === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-muted/60 rounded-xl p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
          <div className="space-y-1.5">
            {[
              "Fill in your personal details & address",
              "Add emergency contacts (who gets the SMS)",
              "Register your hardware SOS device",
              "When device button is pressed → contacts get SMS with location",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Setup steps */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          {progressPct === 100 ? "Your Setup" : "Complete Your Setup"}
        </p>
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {steps.map((step, i) => (
            <SetupStepRow key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* Device active status */}
      {deviceDone && devices[0] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-card border border-border rounded-xl p-4"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{devices[0].deviceName}</p>
            <p className="text-xs text-muted-foreground">ID: {devices[0].deviceId}</p>
          </div>
          <span className="text-[10px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold px-2 py-1 rounded-full">
            Registered
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <>
      <AuthLoading>
        <div className="p-4 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
              <ShieldIcon className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">SakhiSafe</h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto leading-relaxed">
              Setup companion for your SakhiSafe hardware device. Configure your profile and emergency contacts so your device is ready when it matters most.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-xs space-y-4"
          >
            <SignInButton />
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["Profile", "Personal details"], ["Contacts", "Emergency SMS"], ["Device", "Hardware link"]].map(([title, sub]) => (
                <div key={title} className="bg-muted rounded-xl p-2.5">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}
