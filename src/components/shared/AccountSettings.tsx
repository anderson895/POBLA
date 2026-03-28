import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Section = "profile" | "email" | "password";

function SectionTab({ id, label, icon, active, onClick }: {
  id: Section; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
        active
          ? "text-white"
          : "text-white/50 hover:text-white/80 hover:bg-white/5"
      )}
      style={active ? { background: "#bc5d5d" } : {}}
    >
      {icon}
      {label}
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border",
      ok
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-red-50 text-red-700 border-red-200"
    )}>
      {ok
        ? <CheckCircleIcon className="w-4 h-4 shrink-0" />
        : <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
      }
      {msg}
    </div>
  );
}

function PasswordField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="rounded-xl pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user } = useAuth();
  const [name, setName]   = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    if (!name.trim()) return showToast("Name cannot be empty.", false);
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      await updateDoc(doc(db, "users", user.uid), { name: name.trim() });
      showToast("Display name updated successfully.");
    } catch (err) {
      showToast((err as Error).message || "Failed to update name.", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Profile</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Update your display name.</p>
      </div>
      {toast && <Toast {...toast} />}
      <div className="space-y-1.5">
        <Label htmlFor="acct-name">Display Name</Label>
        <Input
          id="acct-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1 pt-1">
        <Label className="text-muted-foreground">Email</Label>
        <p className="text-sm text-foreground px-3 py-2 bg-muted/50 rounded-xl">{user?.email}</p>
        <p className="text-[11px] text-muted-foreground">To change your email, go to the Email tab.</p>
      </div>
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-white"
        style={{ background: "#bc5d5d" }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

// ─── Email Section ────────────────────────────────────────────────────────────
function EmailSection() {
  const { user } = useAuth();
  const [newEmail,  setNewEmail]  = useState("");
  const [password,  setPassword]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    if (!newEmail.trim()) return showToast("Please enter a new email.", false);
    if (!password)        return showToast("Please enter your current password.", false);
    if (!user?.email)     return;
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail.trim());
      await updateDoc(doc(db, "users", user.uid), { email: newEmail.trim() });
      showToast("Email updated successfully.");
      setNewEmail(""); setPassword("");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      const map: Record<string, string> = {
        "auth/wrong-password":      "Incorrect current password.",
        "auth/invalid-email":       "Invalid email address.",
        "auth/email-already-in-use":"Email already in use.",
        "auth/requires-recent-login":"Please log out and log back in first.",
      };
      showToast(map[code] || (err as Error).message || "Failed to update email.", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Change Email</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Current: <strong>{user?.email}</strong>
        </p>
      </div>
      {toast && <Toast {...toast} />}
      <div className="space-y-1.5">
        <Label htmlFor="acct-newemail">New Email Address</Label>
        <Input
          id="acct-newemail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@email.com"
          className="rounded-xl"
        />
      </div>
      <PasswordField
        id="acct-email-pass"
        label="Current Password (to confirm)"
        value={password}
        onChange={setPassword}
      />
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-white"
        style={{ background: "#bc5d5d" }}
      >
        {saving ? "Updating…" : "Update Email"}
      </Button>
    </div>
  );
}

// ─── Password Section ─────────────────────────────────────────────────────────
function PasswordSection() {
  const { user } = useAuth();
  const [current,  setCurrent]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    if (!current)              return showToast("Please enter your current password.", false);
    if (!newPass)              return showToast("Please enter a new password.", false);
    if (newPass.length < 6)    return showToast("Password must be at least 6 characters.", false);
    if (newPass !== confirm)   return showToast("Passwords do not match.", false);
    if (!user?.email)          return;
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      showToast("Password changed successfully.");
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      const map: Record<string, string> = {
        "auth/wrong-password":       "Incorrect current password.",
        "auth/weak-password":        "New password is too weak.",
        "auth/requires-recent-login":"Please log out and log back in first.",
      };
      showToast(map[code] || (err as Error).message || "Failed to update password.", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Change Password</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Use at least 6 characters.</p>
      </div>
      {toast && <Toast {...toast} />}
      <PasswordField id="acct-curr"    label="Current Password" value={current} onChange={setCurrent} />
      <PasswordField id="acct-new"     label="New Password"     value={newPass}  onChange={setNewPass} />
      <PasswordField id="acct-confirm" label="Confirm Password" value={confirm}  onChange={setConfirm} />
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-white"
        style={{ background: "#bc5d5d" }}
      >
        {saving ? "Updating…" : "Change Password"}
      </Button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AccountSettings({ open, onClose }: Props) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("profile");

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row h-full">

          {/* Sidebar */}
          <div
            className="sm:w-48 shrink-0 p-4 space-y-1"
            style={{ background: "#2e2726" }}
          >
            <DialogHeader className="mb-4">
              <DialogTitle className="sr-only">Account Settings</DialogTitle>
            </DialogHeader>

            {/* Avatar */}
            <div className="flex flex-col items-center py-3 mb-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white mb-2"
                style={{ background: "#bc5d5d" }}
              >
                {initials}
              </div>
              <p className="text-sm font-bold text-white truncate max-w-full">{displayName}</p>
              <p className="text-[11px] text-white/40 truncate max-w-full">{user?.email}</p>
            </div>

            <SectionTab
              id="profile"  label="Profile"
              icon={<UserIcon className="w-4 h-4" />}
              active={section === "profile"}
              onClick={() => setSection("profile")}
            />
            <SectionTab
              id="email"    label="Email"
              icon={<EnvelopeIcon className="w-4 h-4" />}
              active={section === "email"}
              onClick={() => setSection("email")}
            />
            <SectionTab
              id="password" label="Password"
              icon={<LockClosedIcon className="w-4 h-4" />}
              active={section === "password"}
              onClick={() => setSection("password")}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {section === "profile"  && <ProfileSection />}
            {section === "email"    && <EmailSection />}
            {section === "password" && <PasswordSection />}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
