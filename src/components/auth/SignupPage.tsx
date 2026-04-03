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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .auth-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(20, 12, 10, 0.82);
          backdrop-filter: blur(6px);
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .auth-card {
          display: flex;
          width: 100%; max-width: 860px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
          animation: slideUp 0.25s cubic-bezier(.22,.68,0,1.2);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }

        /* ── Left panel ── */
        .auth-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 300px; flex-shrink: 0;
          padding: 40px 32px;
          background: #1a0f0d;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 640px) { .auth-left { display: flex; } }

        .auth-left-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(188,93,93,0.18) 0%, transparent 65%),
                      radial-gradient(ellipse at 80% 10%, rgba(188,93,93,0.10) 0%, transparent 50%);
          pointer-events: none;
        }
        .auth-left-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(188,93,93,0.15) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        .auth-logo-wrap {
          position: relative;
          width: 56px; height: 56px;
          border-radius: 16px; overflow: hidden;
          border: 2px solid rgba(188,93,93,0.5);
          box-shadow: 0 0 0 4px rgba(188,93,93,0.08);
        }
        .auth-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }

        .auth-brand-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 28px;
          color: #fff; letter-spacing: -0.5px;
          line-height: 1;
          margin-top: 20px;
        }
        .auth-brand-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600;
          letter-spacing: 3px;
          color: #bc5d5d;
          margin-top: 4px;
        }
        .auth-brand-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.35);
          line-height: 1.7; margin-top: 14px;
        }

        .auth-nav {
          display: flex; flex-direction: column; gap: 6px;
          position: relative;
        }
        .auth-nav-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          padding: 10px 14px; border-radius: 10px;
          cursor: pointer; transition: all 0.15s;
          border: none; text-align: left;
        }
        .auth-nav-item.active {
          background: #bc5d5d; color: #fff;
        }
        .auth-nav-item:not(.active) {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
        }
        .auth-nav-item:not(.active):hover {
          background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
        }

        .auth-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; color: rgba(255,255,255,0.18);
          position: relative;
        }

        /* ── Right panel ── */
        .auth-right {
          flex: 1;
          background: #fdfaf9;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }

        /* mobile header strip */
        .auth-mobile-header {
          display: flex; align-items: center;
          gap: 10px; padding: 20px 24px 0;
        }
        @media (min-width: 640px) { .auth-mobile-header { display: none; } }

        .auth-mobile-logo {
          width: 36px; height: 36px; border-radius: 10px; overflow: hidden;
          border: 2px solid #bc5d5d;
          flex-shrink: 0;
        }
        .auth-mobile-logo img { width: 100%; height: 100%; object-fit: cover; }
        .auth-mobile-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #2a1715; letter-spacing: -0.3px;
        }

        /* mobile tabs */
        .auth-mobile-tabs {
          display: flex; gap: 4px;
          margin: 16px 24px 0;
          padding: 4px; border-radius: 12px;
          background: #ede7e6;
        }
        @media (min-width: 640px) { .auth-mobile-tabs { display: none; } }
        .auth-tab {
          flex: 1; padding: 8px 4px;
          border-radius: 9px; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .auth-tab.active { background: #bc5d5d; color: #fff; }
        .auth-tab:not(.active) { background: transparent; color: #9a8180; }

        /* form area */
        .auth-form-area {
          flex: 1;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 32px 32px 28px;
          max-width: 400px; width: 100%;
          margin: 0 auto;
        }

        .auth-heading {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 26px;
          color: #1e100e; letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .auth-subheading {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #9a8180;
          margin-top: 5px;
        }

        .auth-error {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 12px; border-radius: 10px;
          background: #fff1f1; border: 1px solid #fca5a5;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: #dc2626;
          margin-top: 18px;
        }

        .auth-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #b09f9e;
          display: block; margin-bottom: 6px;
        }

        .auth-field {
          position: relative; margin-top: 14px;
        }
        .auth-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px 11px 40px;
          border-radius: 12px;
          border: 1.5px solid #e5dcdb;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #1e100e;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-input::placeholder { color: #c8b8b6; }
        .auth-input:focus {
          border-color: #bc5d5d;
          box-shadow: 0 0 0 3px rgba(188,93,93,0.12);
        }
        .auth-input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #bc5d5d;
        }
        .auth-input-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #c8b8b6; padding: 0; display: flex;
        }
        .auth-input-btn:hover { color: #9a8180; }

        .auth-submit {
          width: 100%; margin-top: 20px;
          padding: 13px;
          border-radius: 12px; border: none;
          background: #bc5d5d; color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .auth-submit:active:not(:disabled) { transform: translateY(0); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-footer-links {
          margin-top: 22px; padding-top: 18px;
          border-top: 1px solid #ede7e6;
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
        }
        .auth-footer-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #9a8180;
        }
        .auth-link {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #bc5d5d; padding: 0;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-overlay">
        <div className="auth-card">

          {/* ── Left panel ── */}
          <div className="auth-left">
            <div className="auth-left-bg" />
            <div className="auth-left-dots" />

            <div style={{ position: "relative" }}>
              <div className="auth-logo-wrap">
                <img src="/logo.png" alt="Pobla" />
              </div>
              <div className="auth-brand-title">POBLA</div>
              <div className="auth-brand-sub">ORDER HUB</div>
              <p className="auth-brand-desc">Authentic Filipino Cuisine.<br />Order fresh, delivered fast.</p>
            </div>

            <nav className="auth-nav">
              <button className="auth-nav-item" onClick={onNavigateLogin}>Log In</button>
              <div className="auth-nav-item active">Sign Up</div>
              <button className="auth-nav-item" onClick={onNavigateRider}>Rider Registration</button>
            </nav>

            <span className="auth-copy">© 2025 Poblacion Pares Atbp.</span>
          </div>

          {/* ── Right panel ── */}
          <div className="auth-right">

            {/* Mobile header */}
            <div className="auth-mobile-header">
              <div className="auth-mobile-logo"><img src="/logo.png" alt="Pobla" /></div>
              <span className="auth-mobile-title">POBLA ORDER HUB</span>
            </div>

            {/* Mobile tabs */}
            <div className="auth-mobile-tabs">
              <button className="auth-tab" onClick={onNavigateLogin}>Log In</button>
              <button className="auth-tab active">Sign Up</button>
              <button className="auth-tab" onClick={onNavigateRider}>Rider</button>
            </div>

            <div className="auth-form-area">
              <div>
                <h2 className="auth-heading">Create an account</h2>
                <p className="auth-subheading">Join us and start ordering</p>
              </div>

              {error && (
                <div className="auth-error">
                  <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ marginTop: error ? 0 : 20 }}>

                {/* Full Name */}
                <div className="auth-field" style={{ marginTop: error ? 14 : 0 }}>
                  <label className="auth-label">Full Name</label>
                  <div style={{ position: "relative" }}>
                    <UserIcon className="auth-input-icon" />
                    <input
                      type="text" value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Juan dela Cruz" autoComplete="name"
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div style={{ position: "relative" }}>
                    <EnvelopeIcon className="auth-input-icon" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="juan@email.com" autoComplete="email"
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div style={{ position: "relative" }}>
                    <LockClosedIcon className="auth-input-icon" />
                    <input
                      type={showPw ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password"
                      className="auth-input" style={{ paddingRight: 40 }}
                    />
                    <button type="button" className="auth-input-btn" onClick={() => setShowPw(s => !s)}>
                      {showPw
                        ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                        : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <LockClosedIcon className="auth-input-icon" />
                    <input
                      type={showCf ? "text" : "password"} value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password"
                      className="auth-input" style={{ paddingRight: 40 }}
                    />
                    <button type="button" className="auth-input-btn" onClick={() => setShowCf(s => !s)}>
                      {showCf
                        ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                        : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="auth-submit">
                  {loading
                    ? <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    : <><span>Create Account</span><ArrowRightIcon style={{ width: 16, height: 16 }} /></>
                  }
                </button>
              </form>

              <div className="auth-footer-links">
                <p className="auth-footer-text">
                  Already have an account?{" "}
                  <button className="auth-link" onClick={onNavigateLogin}>Log In</button>
                </p>
                <p className="auth-footer-text">
                  Applying as a rider?{" "}
                  <button className="auth-link" onClick={onNavigateRider}>Register here</button>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}