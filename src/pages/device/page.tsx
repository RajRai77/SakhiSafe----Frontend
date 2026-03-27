import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  CpuIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  WifiIcon,
  BatteryIcon,
  ZapIcon,
  AlertTriangleIcon,
  CopyIcon,
  LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type DeviceDoc = {
  _id: Id<"devices">;
  deviceId: string;
  deviceName: string;
  isActive: boolean;
  batteryLevel?: number;
  signalStrength?: string;
  lastSeen?: string;
};

function SignalBadge({ signal }: { signal?: string }) {
  const config = {
    strong: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30", label: "Strong signal" },
    medium: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Medium signal" },
    weak: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", label: "Weak signal" },
    none: { color: "text-muted-foreground", bg: "bg-muted", label: "No signal" },
  } as const;
  const key = (signal ?? "none") as keyof typeof config;
  const cfg = config[key] ?? config.none;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function DeviceCard({ device, onRemove }: { device: DeviceDoc; onRemove: (id: Id<"devices">) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CpuIcon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm">{device.deviceName}</span>
            {device.isActive && (
              <span className="text-[10px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">ID: {device.deviceId}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={() => onRemove(device._id)}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        {device.batteryLevel !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BatteryIcon className="w-3.5 h-3.5" />
            <span>{device.batteryLevel}%</span>
          </div>
        )}
        {device.signalStrength && (
          <div className="flex items-center gap-1">
            <WifiIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <SignalBadge signal={device.signalStrength} />
          </div>
        )}
        {device.lastSeen && (
          <div className="text-xs text-muted-foreground ml-auto">
            Last seen: {new Date(device.lastSeen).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Webhook URL section shown when a device is registered. */
function WebhookInfo({ deviceId }: { deviceId: string }) {
  // Derive the HTTP Actions URL from the Convex URL
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string ?? "";
  const httpActionsUrl = convexUrl.replace("https://", "https://").replace(".cloud", ".site");
  const webhookUrl = `${httpActionsUrl}/sos`;

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"${deviceId}","latitude":19.076,"longitude":72.877}'`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => toast.success("URL copied!"));
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlExample).then(() => toast.success("Example copied!"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Webhook URL</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold ml-auto">For Hardware</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Configure your GSM device to POST to this URL when the SOS button is pressed.
      </p>

      {/* URL */}
      <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
        <span className="text-xs font-mono text-foreground flex-1 truncate">{webhookUrl}</span>
        <button onClick={copyUrl} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <CopyIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Curl example */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Example request</span>
          <button onClick={copyCurl} className="text-[10px] text-primary font-medium flex items-center gap-1">
            <CopyIcon className="w-3 h-3" />Copy
          </button>
        </div>
        <pre className="bg-muted rounded-lg p-3 text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">{curlExample}</pre>
      </div>
    </motion.div>
  );
}

/** Test SOS button — fires a real alert using browser GPS. */
function TestSOSButton() {
  const triggerSOS = useMutation(api.alerts.triggerFromApp);
  const [testing, setTesting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTestSOS = async () => {
    setShowConfirm(false);
    setTesting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocation is not supported on this device"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await triggerSOS({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        note: "Triggered from app (test)",
      });

      toast.success("Test SOS alert created — check the Home tab");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else if (err instanceof GeolocationPositionError) {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          toast.error("Location permission denied. Enable it in your browser settings.");
        } else {
          toast.error("Could not get your location. Try again.");
        }
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to trigger test SOS");
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Test SOS Alert</span>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Simulate an SOS trigger using your phone's GPS. This creates a real alert record — useful for testing before your hardware arrives.
        </p>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={testing}
          size="sm"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2"
        >
          <AlertTriangleIcon className="w-4 h-4" />
          {testing ? "Getting location..." : "Trigger Test SOS"}
        </Button>
      </motion.div>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trigger Test SOS?</DialogTitle>
            <DialogDescription>
              This will create a test SOS alert using your current location. The alert will appear on your dashboard and can be cancelled immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleTestSOS} className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2">
              <ZapIcon className="w-4 h-4" />
              Yes, trigger test SOS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeviceContent() {
  const devices = useQuery(api.devices.list, {});
  const registerDevice = useMutation(api.devices.register);
  const removeDevice = useMutation(api.devices.remove);

  const [showDialog, setShowDialog] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRegister = async () => {
    if (!deviceId.trim()) { toast.error("Please enter the device ID"); return; }
    if (!deviceName.trim()) { toast.error("Please give your device a name"); return; }
    if (deviceId.trim().length < 4) {
      toast.error("Device ID must be at least 4 characters");
      return;
    }
    setSaving(true);
    try {
      await registerDevice({ deviceId: deviceId.trim().toUpperCase(), deviceName: deviceName.trim() });
      toast.success(`${deviceName} registered successfully`);
      setShowDialog(false);
      setDeviceId("");
      setDeviceName("");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to register device");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: Id<"devices">) => {
    try {
      await removeDevice({ deviceId: id });
      toast.success("Device removed");
    } catch {
      toast.error("Failed to remove device");
    }
  };

  if (devices === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-3/4 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Your Device</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Link your SakhiSafe hardware to this account</p>
        </div>
        {devices.length === 0 && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowDialog(true)}>
            <PlusIcon className="w-4 h-4" />
            Register
          </Button>
        )}
      </div>

      {/* Info banner — shown only when no device yet */}
      {devices.length === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-semibold text-primary">Where do I find my Device ID?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Device ID is printed on a sticker on the back of your SakhiSafe hardware button. It looks like <span className="font-mono font-semibold">SG-XXXX</span> or similar.
          </p>
        </div>
      )}

      {/* Device list */}
      {devices.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><CpuIcon /></EmptyMedia>
            <EmptyTitle>No device registered</EmptyTitle>
            <EmptyDescription>Link your SakhiSafe hardware button to start sending SOS alerts</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" className="gap-1.5" onClick={() => setShowDialog(true)}>
              <PlusIcon className="w-4 h-4" />
              Register Device
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {devices.map((device) => (
              <DeviceCard key={device._id} device={device} onRemove={handleRemove} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Ready banner */}
      {devices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4"
        >
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Device ready</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 leading-relaxed">
              When you press the button on your SakhiSafe device, an SOS alert with your location will be sent to all your emergency contacts via SMS.
            </p>
          </div>
        </motion.div>
      )}

      {/* Webhook URL — shown once a device is registered */}
      {devices.length > 0 && <WebhookInfo deviceId={devices[0].deviceId} />}

      {/* Test SOS — always visible */}
      <TestSOSButton />

      {/* Register Device Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register SakhiSafe Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="device-id">Device ID <span className="text-destructive">*</span></Label>
              <Input
                id="device-id"
                placeholder="e.g. SG-A1B2"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                className="font-mono"
                maxLength={20}
              />
              <p className="text-[11px] text-muted-foreground">
                Found on the sticker on the back of your device
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-name">Device Name <span className="text-destructive">*</span></Label>
              <Input
                id="device-name"
                placeholder='e.g. "My SakhiSafe Button"'
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                maxLength={40}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={saving} className="gap-1.5">
              {saving ? "Registering..." : <><CheckCircleIcon className="w-4 h-4" /> Register</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DevicePage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-4 text-center">
          <p className="text-muted-foreground">Sign in to register your device</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DeviceContent />
      </Authenticated>
    </>
  );
}
