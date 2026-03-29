import React, { useState } from "react";
import { submitRiderRegistration } from "@/lib/riderService";
import {
  EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, TruckIcon,
  EyeIcon, EyeSlashIcon, ExclamationCircleIcon, ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

function firebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Email already in use.",
    "auth/weak-password":        "Password is too weak. Use at least 6 characters.",
    "auth/invalid-email":        "Invalid email address.",
    "auth/too-many-requests":    "Too many attempts. Please wait a moment.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

interface RiderRegistrationPageProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
}

export default function RiderRegistrationPage({ onNavigateLogin, onNavigateSignup }: RiderRegistrationPageProps) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [vehicle, setVehicle]   = useState<"motorcycle" | "bicycle" | "car">("motorcycle");
  const [plate, setPlate]       = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !phone || !plate) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError(null);
    try {
      await submitRiderRegistration({ name, email, password, phone, vehicleType: vehicle, plateNumber: plate });
      setSuccess(true);
    }
    catch (err: unknown) { setError(firebaseError((err as { code?: string }).code ?? "")); }
    finally { setLoading(false); }
  }

  const inputBase =
    "w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all bg-white border border-[#e8dedd] text-[#3b3130] placeholder:text-[#b8a8a7]";

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#bc5d5d"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(188,93,93,0.1)"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#e8dedd"; e.currentTarget.style.boxShadow = "none"; },
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#f5efee" }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e8dedd] text-center">
          <div className="h-1 w-full" style={{ background: "#bc5d5d" }} />
          <div className="px-8 py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-50 border-2 border-green-200">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="font-display font-black text-2xl mb-3" style={{ color: "#3b3130" }}>Application Submitted!</h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "#9a8180" }}>
              Your rider registration is under review. The admin will notify you once your application is approved.
            </p>
            <button onClick={onNavigateLogin}
              className="w-full py-3 rounded-lg font-bold text-sm text-white"
              style={{ background: "#bc5d5d" }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <h2 className="text-xl font-bold" style={{ color: "#3b3130" }}>Rider Registration</h2>
              <p className="text-xs mt-1" style={{ color: "#9a8180" }}>Apply to become a delivery rider</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pt-5 pb-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-red-50 border border-red-200">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-600">{error}</span>
                </div>
              )}

              {/* Notice */}
              <div className="p-3 rounded-lg text-xs leading-relaxed bg-[#faf7f7] border border-[#e8dedd]" style={{ color: "#9a8180" }}>
                Your registration will be reviewed by the admin. You'll receive access once approved.
              </div>

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

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="09XX XXX XXXX"
                    className={inputBase} {...focusHandlers} />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Vehicle Type</label>
                <div className="flex gap-2">
                  {(["motorcycle", "bicycle", "car"] as const).map(v => (
                    <button key={v} type="button" onClick={() => setVehicle(v)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all border"
                      style={vehicle === v
                        ? { background: "#bc5d5d", color: "#ffffff", borderColor: "#bc5d5d" }
                        : { background: "#ffffff", color: "#7a6160", borderColor: "#e8dedd" }
                      }>
                      {v === "motorcycle" ? "Motorcycle" : v === "bicycle" ? "Bicycle" : "Car"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plate Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a8180" }}>Plate Number</label>
                <div className="relative">
                  <TruckIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#bc5d5d" }} />
                  <input id="plate" type="text" value={plate} onChange={e => setPlate(e.target.value)}
                    placeholder="ABC 1234"
                    className={inputBase} {...focusHandlers} />
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
                ) : (<>Submit Application <ArrowRightIcon className="w-4 h-4" /></>)}
              </button>
            </form>

            {/* Footer nav */}
            <div className="px-8 py-4 flex flex-col items-center gap-2 border-t border-[#e8dedd] bg-[#faf7f7]">
              <p className="text-xs" style={{ color: "#9a8180" }}>
                Already have an account?{" "}
                <button onClick={onNavigateLogin} className="font-bold hover:underline" style={{ color: "#bc5d5d" }}>Log In</button>
              </p>
              <p className="text-xs" style={{ color: "#9a8180" }}>
                Customer sign up?{" "}
                <button onClick={onNavigateSignup} className="font-bold hover:underline" style={{ color: "#bc5d5d" }}>Register here</button>
              </p>
            </div>
          </div>

          <p className="mt-5 text-[11px] lg:hidden" style={{ color: "#b8a8a7" }}>© 2025 Poblacion Pares Atbp.</p>
        </div>
      </div>
    </div>
  );
}