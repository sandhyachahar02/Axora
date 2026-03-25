"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.push("/dashboard"); }
    };
    checkSession();
  }, [router]);

  const handleSignup = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (!email) { alert("Email is required."); setSubmitting(false); return; }
    if (!password) { alert("Password is required."); setSubmitting(false); return; }
    if (password.length < 6) { alert("Password must be at least 6 characters."); setSubmitting(false); return; }
    if (password !== confirm) { alert("Passwords do not match."); setSubmitting(false); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setSubmitting(false);

    if (error) { alert(error.message); return; }

    if (data.session) {
      await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } else {
      alert("Account created! Please sign in.");
      router.push("/login");
    }
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #050505; overflow-x: hidden; }

        .root { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

        .left { position: relative; overflow: hidden; background: #06060a; display: flex; flex-direction: column; justify-content: space-between; padding: 44px 52px; }

        .left-blob { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; animation: floatBlob 10s ease-in-out infinite alternate; }
        .lb1 { width: 480px; height: 480px; background: radial-gradient(circle, rgba(99,91,255,0.22) 0%, transparent 68%); top: -100px; left: -80px; animation-duration: 11s; }
        .lb2 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 68%); bottom: 40px; right: -60px; animation-duration: 13s; animation-direction: alternate-reverse; }
        .lb3 { width: 260px; height: 260px; background: radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%); top: 45%; left: 38%; animation-duration: 9s; }

        @keyframes floatBlob {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(18px,-22px) scale(1.04); }
          66% { transform: translate(-14px,16px) scale(0.97); }
          100% { transform: translate(10px,12px) scale(1.02); }
        }

        .left-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px); background-size: 52px 52px; pointer-events: none; }
        .left-noise { position: absolute; inset: 0; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px 200px; pointer-events: none; }

        .left-content { position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
        .logo-row { display: flex; align-items: center; gap: 10px; position: absolute; top: 0; left: 0; }
        .logo-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #635BFF 0%, #3B82F6 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(99,91,255,0.45); flex-shrink: 0; }
        .logo-name { font-size: 19px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
        .left-tagline-area { margin-top: 16px; }
        .left-eyebrow { font-size: 11.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(99,91,255,0.75); font-family: 'DM Mono', monospace; margin-bottom: 20px; }
        .left-heading { font-size: clamp(30px,3.2vw,42px); font-weight: 700; line-height: 1.15; letter-spacing: -1.2px; color: #fff; margin-bottom: 20px; }
        .left-heading .grad { background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 60%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .left-sub { font-size: 15px; line-height: 1.65; color: rgba(230,230,230,0.38); max-width: 360px; font-weight: 400; }

        .features { display: flex; flex-direction: column; gap: 14px; margin-top: 44px; }
        .feature-item { display: flex; align-items: center; gap: 13px; }
        .feature-dot { width: 28px; height: 28px; border-radius: 8px; background: rgba(99,91,255,0.12); border: 1px solid rgba(99,91,255,0.22); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .feature-dot svg { width: 13px; height: 13px; }
        .feature-text { font-size: 13.5px; color: rgba(230,230,230,0.45); font-weight: 400; }

        .left-footer { position: relative; z-index: 10; }
        .quote-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px 20px; max-width: 380px; }
        .quote-text { font-size: 13px; color: rgba(230,230,230,0.4); line-height: 1.6; font-style: italic; margin-bottom: 12px; }
        .quote-author { display: flex; align-items: center; gap: 10px; }
        .avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #635BFF, #3B82F6); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; flex-shrink: 0; }
        .author-info { display: flex; flex-direction: column; gap: 1px; }
        .author-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); }
        .author-role { font-size: 11px; color: rgba(255,255,255,0.28); }

        .right { background: #050505; display: flex; align-items: center; justify-content: center; padding: 48px 24px; }
        .card-wrap { width: 100%; max-width: 400px; opacity: 0; transform: translateY(18px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .card-wrap.visible { opacity: 1; transform: translateY(0); }
        .card { background: #0d0d12; border: 1px solid rgba(255,255,255,0.065); border-radius: 20px; padding: 38px 36px 34px; box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35); }

        .card-header { margin-bottom: 28px; }
        .card-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(99,91,255,0.65); font-family: 'DM Mono', monospace; margin-bottom: 10px; }
        .card-title { font-size: 24px; font-weight: 700; letter-spacing: -0.6px; color: #fff; margin-bottom: 6px; }
        .card-sub { font-size: 13.5px; color: rgba(230,230,230,0.32); }

        .form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .label { font-size: 12.5px; font-weight: 500; color: rgba(230,230,230,0.5); letter-spacing: 0.01em; }
        .input { width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; color: #f0f0f0; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .input::placeholder { color: rgba(255,255,255,0.2); }
        .input:focus { border-color: rgba(99,91,255,0.5); box-shadow: 0 0 0 3px rgba(99,91,255,0.1); }

        .strength-wrap { display: flex; gap: 5px; margin-top: 6px; }
        .strength-seg { flex: 1; height: 3px; border-radius: 99px; background: rgba(255,255,255,0.07); transition: background 0.3s; }

        .btn { width: 100%; padding: 12.5px; margin-top: 4px; border: none; border-radius: 11px; background: linear-gradient(135deg, #635BFF 0%, #3B82F6 100%); color: #fff; font-size: 14.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; box-shadow: 0 4px 18px rgba(99,91,255,0.38), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.14); }
        .btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none !important; filter: none !important; }
        .btn:hover:not(:disabled) { transform: translateY(-1.5px) scale(1.015); box-shadow: 0 8px 32px rgba(99,91,255,0.5), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18); filter: brightness(1.07); }
        .btn:active:not(:disabled) { transform: translateY(0.5px) scale(0.996); filter: brightness(0.95); }

        .terms { font-size: 11.5px; color: rgba(230,230,230,0.25); text-align: center; line-height: 1.6; margin-top: 4px; }
        .terms a { color: rgba(99,91,255,0.7); text-decoration: none; transition: color 0.15s; }
        .terms a:hover { color: #a5a0ff; }

        .card-footer { margin-top: 26px; text-align: center; font-size: 13.5px; color: rgba(230,230,230,0.35); }
        .card-footer a { color: rgba(99,91,255,0.85); text-decoration: none; font-weight: 500; transition: color 0.15s; }
        .card-footer a:hover { color: #c4c0ff; }

        @media (max-width: 860px) {
          .root { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 36px 20px; min-height: 100vh; }
          .card { padding: 34px 26px 30px; }
          .card-wrap { max-width: 440px; }
        }

        /* ── Light Mode ── */
        .light .root { background: #f4f4f8; }
        .light .left { background: #eeeef5; }
        .light .right { background: #f4f4f8; }
        .light .card { background: #ffffff; border-color: rgba(0,0,0,0.08); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .light .card-title { color: #0f0f14; }
        .light .card-sub { color: rgba(15,15,20,0.45); }
        .light .card-eyebrow { color: rgba(99,91,255,0.7); }
        .light .label { color: rgba(15,15,20,0.5); }
        .light .input { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.12); color: #0f0f14; }
        .light .input::placeholder { color: rgba(15,15,20,0.3); }
        .light .input:focus { background: #ffffff; border-color: rgba(99,91,255,0.5); }
        .light .left-heading { color: #0f0f14; }
        .light .left-sub { color: rgba(15,15,20,0.5); }
        .light .left-eyebrow { color: rgba(99,91,255,0.7); }
        .light .logo-name { color: #0f0f14; }
        .light .feature-text { color: rgba(15,15,20,0.5); }
        .light .quote-card { background: rgba(255,255,255,0.8); border-color: rgba(0,0,0,0.08); }
        .light .quote-text { color: rgba(15,15,20,0.5); }
        .light .author-name { color: rgba(15,15,20,0.7); }
        .light .author-role { color: rgba(15,15,20,0.4); }
        .light .card-footer { color: rgba(15,15,20,0.45); }
        .light .terms { color: rgba(15,15,20,0.35); }
        .light .strength-seg { background: rgba(0,0,0,0.08); }
        .light .left-grid { background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); }
      `}</style>

      <div className="root">
        <div className="left">
          <div className="lb1 left-blob" />
          <div className="lb2 left-blob" />
          <div className="lb3 left-blob" />
          <div className="left-grid" />
          <div className="left-noise" />

          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="logo-row">
              <div className="logo-mark">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 19, height: 19 }}>
                  <path d="M9 2L15.5 14H2.5L9 2Z" fill="white" fillOpacity="0.92" />
                  <path d="M9 7L12 13H6L9 7Z" fill="white" fillOpacity="0.32" />
                </svg>
              </div>
              <span className="logo-name">Axora</span>
            </div>
          </div>

          <div className="left-content">
            <div className="left-tagline-area">
              <p className="left-eyebrow">Now in open beta</p>
              <h2 className="left-heading">
                Build, collaborate,<br />
                and grow with <span className="grad">AI</span>.
              </h2>
              <p className="left-sub">
                The all-in-one workspace that turns your ideas into products — faster than ever before.
              </p>
              <div className="features">
                {[
                  { text: "AI-powered workflow automation" },
                  { text: "Real-time team collaboration" },
                  { text: "Enterprise-grade security & compliance" },
                ].map((f, i) => (
                  <div className="feature-item" key={i}>
                    <div className="feature-dot">
                      <svg viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5L5 9.5L11 3.5" stroke="rgba(99,91,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="feature-text">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="left-footer">
            <div className="quote-card">
              <p className="quote-text">
                &ldquo;Axora cut our time-to-launch in half. It&apos;s the first tool our whole team actually loves.&rdquo;
              </p>
              <div className="quote-author">
                <div className="avatar">SL</div>
                <div className="author-info">
                  <span className="author-name">Sarah Lin</span>
                  <span className="author-role">CTO at Frameshift</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className={`card-wrap ${mounted ? "visible" : ""}`}>
            <div className="card">
              <div className="card-header">
                <p className="card-eyebrow">Get started free</p>
                <h1 className="card-title">Create your account</h1>
                <p className="card-sub">No credit card required. Up in 60 seconds.</p>
              </div>

              <div className="form">
                <div className="field">
                  <label className="label" htmlFor="email">Work email</label>
                  <input id="email" className="input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>

                <div className="field">
                  <label className="label" htmlFor="password">Password</label>
                  <input id="password" className="input" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <div className="strength-wrap">
                    {[0, 1, 2, 3].map((i) => {
                      const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
                      const colors = ["rgba(255,255,255,0.07)", "#ef4444", "#f59e0b", "#22c55e", "#635BFF"];
                      return <div key={i} className="strength-seg" style={{ background: i < strength ? colors[strength] : undefined }} />;
                    })}
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm" className="input" type="password" placeholder="Repeat your password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
                    style={
                      confirm.length > 0 && confirm !== password
                        ? { borderColor: "rgba(239,68,68,0.5)", boxShadow: "0 0 0 3px rgba(239,68,68,0.09)" }
                        : confirm.length > 0 && confirm === password
                        ? { borderColor: "rgba(34,197,94,0.45)", boxShadow: "0 0 0 3px rgba(34,197,94,0.08)" }
                        : {}
                    }
                  />
                </div>

                <button className="btn" type="button" onClick={handleSignup} disabled={loading}>
                  {loading ? "Processing..." : "Create account →"}
                </button>

                <p className="terms">
                  By signing up you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>
              </div>

              <div className="card-footer">
                Already have an account?{" "}
                <Link href="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
