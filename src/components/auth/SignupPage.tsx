import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  EnvelopeIcon, LockClosedIcon, UserIcon,
  EyeIcon, EyeSlashIcon, ExclamationCircleIcon, ArrowRightIcon,
} from "@heroicons/react/24/outline";

function firebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Email already in use. Please log in instead.",
    "auth/weak-password":        "Password is too weak. Use at least 6 characters.",
    "auth/invalid-email":        "Invalid email address.",
    "auth/too-many-requests":    "Too many attempts. Please wait a moment.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

interface SignupPageProps {
  onNavigateLogin: () => void;
  onNavigateRider: () => void;
}

export default function SignupPage({ onNavigateLogin, onNavigateRider }: SignupPageProps) {
  const { register } = useAuth();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) return setError("Please fill in all fields.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError(null);
    try { await register(name.trim(), email, password); }
    catch (err: unknown) { setError(firebaseError((err as { code?: string }).code ?? "")); }
    finally { setLoading(false); }
  }

  const inputBase =
    "w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all bg-white border border-[#e8dedd] text-[#3b3130] placeholder:text-[#b8a8a7]";

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#bc5d5d"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(188,93,93,0.1)"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#e8dedd"; e.currentTarget.style.boxShadow = "none"; },
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "#f5efee" }}>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-80 flex-shrink-0 px-10 gap-6"
        style={{ background: "#3b3130" }}
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: "3px solid #bc5d5d" }}>
          <img src="/logo.png" alt="Pobla" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="font-display font-black text-3xl text-white tracking-tight">POBLA</h1>
          <p className="text-xs font-bold tracking-widest mt-1" style={{ color: "#bc5d5d" }}>ORDER HUB</p>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "#8a7170" }}>
            Authentic Filipino Cuisine.<br />Order fresh, delivered fast.
          </p>
        </div>
        <div className="w-12 h-0.5 rounded-full" style={{ background: "#bc5d5d" }} />
        <p className="text-[11px] text-center" style={{ color: "#6a5554" }}>© 2025 Poblacion Pares Atbp.</p>
      </div>

      {/* Right form area */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: "2px solid #bc5d5d" }}>
              <img src="/logo.png" alt="Pobla" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-black text-base text-[#3b3130] tracking-tight leading-none">POBLA</p>
              <p className="text-[10px] font-bold tracking-widest" style={{ color: "#bc5d5d" }}>ORDER HUB</p>
            </div>
          </div>

          {/* Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e8dedd]">

            <div className="h-1 w-full" style={{ background: "#bc5d5d" }} />

            <div className="px-8 pt-7 pb-2">
              <h2 className="text-xl font-bold" style={{ color: "#3b3130" }}>Create an account</h2>
              <p className="text-xs mt-1" style={{ color: "#9a8180" }}>Join us and start ordering</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pt-5 pb-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-red-50 border border-red-200">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-600">{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Juan dela Cruz" autoComplete="name"
                    className={inputBase} {...focusHandlers} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Email</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="juan@email.com" autoComplete="email"
                    className={inputBase} {...focusHandlers} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="password" type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    className={inputBase + " pr-10"} {...focusHandlers} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#b8a8a7" }}>
                    {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Confirm Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="confirm" type={showCf ? "text" : "password"} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    className={inputBase + " pr-10"} {...focusHandlers} />
                  <button type="button" onClick={() => setShowCf(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#b8a8a7" }}>
                    {showCf ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white transition-opacity disabled:opacity-50 mt-1"
                style={{ background: "#bc5d5d" }}>
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (<>Create Account <ArrowRightIcon className="w-4 h-4" /></>)}
              </button>
            </form>

            {/* Footer nav */}
            <div className="px-8 py-4 flex flex-col items-center gap-2 border-t border-[#e8dedd] bg-[#faf7f7]">
              <p className="text-xs" style={{ color: "#9a8180" }}>
                Already have an account?{" "}
                <button onClick={onNavigateLogin} className="font-bold hover:underline" style={{ color: "#bc5d5d" }}>Log In</button>
              </p>
              <p className="text-xs" style={{ color: "#9a8180" }}>
                Applying as a rider?{" "}
                <button onClick={onNavigateRider} className="font-bold hover:underline" style={{ color: "#bc5d5d" }}>Register here</button>
              </p>
            </div>
          </div>

          <p className="mt-5 text-[11px] lg:hidden" style={{ color: "#b8a8a7" }}>© 2025 Poblacion Pares Atbp.</p>
        </div>
      </div>
    </div>
  );
}