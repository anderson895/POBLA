import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Tab = "login" | "register";


function PasswordInput({
  id, value, onChange, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={id === "password" ? "current-password" : "new-password"}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TextInput({
  id, icon, value, onChange, placeholder, type = "text", autoComplete,
}: {
  id: string; icon: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all"
      />
    </div>
  );
}

function FirebaseErrorMsg(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found":       "Hindi nahanap ang account. Mag-sign up muna.",
    "auth/wrong-password":       "Mali ang password. Subukan ulit.",
    "auth/invalid-credential":   "Mali ang email o password.",
    "auth/email-already-in-use": "May account na ang email na ito. Mag-login na lang.",
    "auth/weak-password":        "Password ay masyadong mahina. Gumamit ng 6+ characters.",
    "auth/invalid-email":        "Hindi valid ang email address.",
    "auth/too-many-requests":    "Maraming beses na sinubukan. Maghintay muna.",
  };
  return map[code] ?? "May nangyaring error. Subukan ulit.";
}

export default function AuthPage() {
  const { login, register, continueAsGuest } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Punan ang lahat ng fields.");
    setLoading(true); setError(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(FirebaseErrorMsg(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) return setError("Punan ang lahat ng fields.");
    if (password !== confirm) return setError("Hindi magkapareho ang passwords.");
    if (password.length < 6) return setError("Password ay dapat 6 characters o higit pa.");
    setLoading(true); setError(null);
    try {
      await register(name.trim(), email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(FirebaseErrorMsg(code));
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: Tab) {
    setTab(t); setError(null);
    setName(""); setEmail(""); setPassword(""); setConfirm("");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "#3b3130" }}
    >
      {/* Decorative blobs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
           style={{ background: "#bc5d5d" }} />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
           style={{ background: "#bc5d5d" }} />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Brand header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden"
               style={{ border: "1.5px solid rgba(188,93,93,0.4)" }}>
            <img src="/logo.png" alt="Pobla logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">POBLA</h1>
          <p className="text-xs font-bold tracking-widest mt-0.5" style={{ color: "#bc5d5d" }}>
            ORDER HUB
          </p>
          <p className="text-xs text-white/40 mt-2">Authentic Filipino cuisine • Pares Atbp.</p>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-6 rounded-xl p-1" style={{ background: "rgba(0,0,0,0.2)" }}>
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                tab === t
                  ? "text-white shadow-md"
                  : "text-white/40 hover:text-white/60"
              )}
              style={tab === t ? { background: "#bc5d5d" } : {}}
            >
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={tab === "login" ? handleLogin : handleRegister}
          className="px-6 pb-6 space-y-3"
        >
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                 style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <ExclamationCircleIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Name — register only */}
          {tab === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Full Name</label>
              <TextInput
                id="name"
                icon={<UserIcon className="w-4 h-4" />}
                value={name}
                onChange={setName}
                placeholder="Juan dela Cruz"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email</label>
            <TextInput
              id="email"
              icon={<EnvelopeIcon className="w-4 h-4" />}
              value={email}
              onChange={setEmail}
              placeholder="juan@email.com"
              type="email"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
            <PasswordInput id="password" value={password} onChange={setPassword} placeholder="••••••••" />
          </div>

          {/* Confirm password — register only */}
          {tab === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Confirm Password</label>
              <PasswordInput id="confirm" value={confirm} onChange={setConfirm} placeholder="••••••••" />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 mt-4"
            style={{ background: "#bc5d5d" }}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>
                {tab === "login" ? "Login" : "Create Account"}
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 pb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-white/30">o</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Continue as guest */}
        <div className="px-6 pb-8">
          <button
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <UserGroupIcon className="w-4 h-4" />
            Continue as Guest
            <span className="text-[10px] text-white/30">(browse only)</span>
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-white/20">© 2025 Poblacion Pares Atbp.</p>
    </div>
  );
}
