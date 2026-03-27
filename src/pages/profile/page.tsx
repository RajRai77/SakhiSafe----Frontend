import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { UserIcon, MapPinIcon, PhoneIcon, MailIcon, CheckCircleIcon, SaveIcon } from "lucide-react";
import { motion } from "motion/react";

type ProfileForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

function SectionTitle({ icon: Icon, title }: { icon: typeof UserIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-sm font-bold">{title}</span>
    </div>
  );
}

function ProfileForm() {
  const user = useQuery(api.users.getCurrentUser, {});
  const updateProfile = useMutation(api.users.updateProfile);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        address: user.address ?? "",
        city: user.city ?? "",
        state: user.state ?? "",
        pincode: user.pincode ?? "",
      });
    }
  }, [user]);

  const set = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone number is required"); return; }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      toast.error("Please fill in your complete address");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profile saved successfully");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const isComplete = !!(user?.name && user?.phone && user?.address && user?.city);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Personal Details</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            This info is used when your device sends an SOS alert
          </p>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs font-semibold">Complete</span>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
        When your hardware device triggers an SOS, this information helps emergency contacts find you quickly.
      </div>

      {/* Personal info section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 space-y-4"
      >
        <SectionTitle icon={UserIcon} title="Personal Information" />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile Number <span className="text-destructive">*</span></Label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={form.email}
                onChange={set("email")}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Address section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4 space-y-4"
      >
        <SectionTitle icon={MapPinIcon} title="Home Address" />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="address">Street / Flat Address <span className="text-destructive">*</span></Label>
            <Input
              id="address"
              placeholder="e.g. Flat 4B, Sunrise Apartments, MG Road"
              value={form.address}
              onChange={set("address")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input
                id="city"
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={set("city")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
              <Input
                id="pincode"
                placeholder="400001"
                value={form.pincode}
                onChange={set("pincode")}
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Input
              id="state"
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={set("state")}
            />
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2"
        size="lg"
      >
        {saved ? (
          <><CheckCircleIcon className="w-4 h-4" /> Saved!</>
        ) : saving ? (
          "Saving..."
        ) : (
          <><SaveIcon className="w-4 h-4" /> Save Profile</>
        )}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-4 text-center">
          <p className="text-muted-foreground">Sign in to set up your profile</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <ProfileForm />
      </Authenticated>
    </>
  );
}
