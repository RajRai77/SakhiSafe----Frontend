import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { PlusIcon, TrashIcon, UsersIcon, StarIcon, PhoneIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const RELATIONSHIPS = ["Mother", "Father", "Sister", "Brother", "Partner", "Friend", "Guardian", "Other"];

type ContactFormData = {
  name: string;
  phone: string;
  relationship: string;
};

function ContactCard({ contact, onDelete }: {
  contact: { _id: Id<"contacts">; name: string; phone: string; relationship: string; priority: number };
  onDelete: (id: Id<"contacts">) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{contact.name[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{contact.name}</span>
          {contact.priority === 1 && (
            <StarIcon className="w-3 h-3 text-amber-500 flex-shrink-0 fill-amber-500" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">{contact.relationship}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <PhoneIcon className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{contact.phone}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          #{contact.priority}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(contact._id)}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function ContactsList() {
  const contacts = useQuery(api.contacts.list, {});
  const addContact = useMutation(api.contacts.add);
  const removeContact = useMutation(api.contacts.remove);

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<ContactFormData>({ name: "", phone: "", relationship: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.relationship) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setSaving(true);
    try {
      const priority = (contacts?.length ?? 0) + 1;
      await addContact({ ...form, phone: form.phone.trim(), name: form.name.trim(), priority });
      toast.success(`${form.name} added to your emergency contacts`);
      setShowDialog(false);
      setForm({ name: "", phone: "", relationship: "" });
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to add contact");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"contacts">) => {
    try {
      await removeContact({ contactId: id });
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  if (contacts === undefined) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Emergency Contacts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{contacts.length}/5 contacts added</p>
        </div>
        {contacts.length < 5 && (
          <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1.5">
            <PlusIcon className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(contacts.length / 5) * 100}%` }}
        />
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><UsersIcon /></EmptyMedia>
            <EmptyTitle>No contacts yet</EmptyTitle>
            <EmptyDescription>Add trusted people who will receive your emergency alerts</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1.5">
              <PlusIcon className="w-4 h-4" />
              Add First Contact
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {contacts.map((contact) => (
              <ContactCard key={contact._id} contact={contact} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Info box */}
      {contacts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Priority #1</span> contact gets alerted first. Add contacts in order of importance.
          </p>
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Full Name</Label>
              <Input
                id="contact-name"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-4 text-center">
          <p className="text-muted-foreground">Sign in to manage your emergency contacts</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <ContactsList />
      </Authenticated>
    </>
  );
}
