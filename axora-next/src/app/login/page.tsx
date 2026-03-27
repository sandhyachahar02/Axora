"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {
    if (!email) { alert("Email is required."); return; }
    if (!password) { alert("Password is required."); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { alert(error.message); return; }

    if (data.session) {
      const isVerified = data.session.user.user_metadata?.email_verified;
      if (!isVerified) {
        await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      alert("Login successful 🚀");
      router.push("/dashboard");
    }
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #050505; font-family: 'DM Sans', sans-serif; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .blob { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; }
        .blob-1 { width: 520px; height: 520px; background: radial-gradient(circle, rgba(99,91,255,0.10) 0%, transparent 70%); top: -120px; left: -80px; }
        .blob-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%); bottom: -80px; right: -60px; }
        .blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,91,255,0.06) 0%, transparent 70%); bottom: 40%; left: 30%; }

        .grid-overlay {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none;
        }

        .card-wrapper {
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1);
          position: relative; z-index: 10; width: 100%; max-width: 420px;
        }
        .card-wrapper.visible { opacity: 1; transform: translateY(0); }

        .card {
          background: rgba(255,255,255,0.032);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 44px 40px 40px;
          box-shadow: 0 0 0 1px rgba(99,91,255,0.04), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,91,255,0.5), transparent);
        }

        .logo-area { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .logo-mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #635BFF 0%, #3B82F6 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(99,91,255,0.4); flex-shrink: 0; }
        .logo-mark svg { width: 18px; height: 18px; }
        .logo-name { font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: -0.3px; }

        .heading-group { margin-bottom: 36px; }
        .heading { font-size: 26px; font-weight: 600; color: #ffffff; letter-spacing: -0.6px; line-height: 1.2; margin-bottom: 6px; }
        .subheading { font-size: 14px; font-weight: 400; color: rgba(230,230,230,0.45); letter-spacing: 0.01em; }

        .form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 7px; }

        .label { font-size: 12px; font-weight: 500; color: rgba(230,230,230,0.5); letter-spacing: 0.04em; text-transform: uppercase; font-family: 'DM Mono', monospace; }
        .input-wrap { position: relative; }
        .input {
          width: 100%; background: #0F0F10; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 13px 16px; font-size: 14.5px; color: #E6E6E6;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          -webkit-appearance: none; appearance: none; caret-color: #635BFF;
        }
        .input::placeholder { color: rgba(230,230,230,0.2); }
        .input:focus { border-color: rgba(99,91,255,0.55); background: #111113; box-shadow: 0 0 0 3px rgba(99,91,255,0.12), 0 1px 3px rgba(0,0,0,0.4); }

        .btn {
          margin-top: 8px; width: 100%; padding: 14px 20px; border: none; border-radius: 11px;
          font-size: 14.5px; font-weight: 600; color: #ffffff; font-family: 'DM Sans', sans-serif;
          cursor: pointer; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #635BFF 0%, #3B82F6 100%);
          box-shadow: 0 4px 20px rgba(99,91,255,0.35), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease, filter 0.18s ease;
        }
        .btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); pointer-events: none; }
        .btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none !important; filter: none !important; }
        .btn:hover:not(:disabled) { transform: translateY(-1.5px) scale(1.015); box-shadow: 0 8px 30px rgba(99,91,255,0.45), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18); filter: brightness(1.08); }
        .btn:active:not(:disabled) { transform: translateY(0.5px) scale(0.995); filter: brightness(0.96); }

        .footer { margin-top: 28px; text-align: center; }
        .footer-text { font-size: 13.5px; color: rgba(230,230,230,0.38); }
        .footer-link { color: rgba(99,91,255,0.85); text-decoration: none; font-weight: 500; transition: color 0.15s ease; }
        .footer-link:hover { color: #a5a0ff; }

        .forgot { text-align: right; margin-top: -4px; }
        .forgot-link { font-size: 12.5px; color: rgba(230,230,230,0.3); text-decoration: none; transition: color 0.15s ease; }
        .forgot-link:hover { color: rgba(230,230,230,0.65); }

        @media (max-width: 480px) {
          .card { padding: 36px 28px 32px; }
          .heading { font-size: 23px; }
        }

        /* ── Light Mode ── */
        .light .login-root { background: #f4f4f8; }
        .light .card { background: rgba(255,255,255,0.95); border-color: rgba(0,0,0,0.08); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .light .heading { color: #0f0f14; }
        .light .subheading { color: rgba(15,15,20,0.5); }
        .light .logo-name { color: #0f0f14; }
        .light .label { color: rgba(15,15,20,0.5); }
        .light .input { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.12); color: #0f0f14; }
        .light .input::placeholder { color: rgba(15,15,20,0.3); }
        .light .input:focus { background: #ffffff; border-color: rgba(99,91,255,0.5); }
        .light .footer-text { color: rgba(15,15,20,0.5); }
        .light .forgot-link { color: rgba(15,15,20,0.4); }
        .light .grid-overlay { background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); }
/* Dark theme (default): white text is visible as-is */
.axora-text-logo {
  filter: none;
}

/* Light theme: invert white → dark so it's readable */
.light .axora-text-logo {
  filter: brightness(0) saturate(100%);
}
      `}</style>

      <div className="login-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="grid-overlay" />

        <div className={`card-wrapper ${mounted ? "visible" : ""}`}>
          <div className="card">
   {/* Logo: icon always keeps color, text turns dark on light theme */}
<Link href="/">
  <img
    src="/axora-logo-final.png"
    alt="Axora"
    className="axora-logo"
    style={{ height: "32px", width: "auto", objectFit: "contain" }}
  />
</Link>
            <div className="heading-group">
              <h1 className="heading">Welcome back</h1>
              <p className="subheading">Sign in to continue to your workspace</p>
            </div>

            <div className="form">
              <div className="field">
                <label className="label" htmlFor="email">Email</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    className="input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    className="input"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="forgot">
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button
                className="btn"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleLogin}
                disabled={loading}
                type="button"
              >
                {loading ? "Processing..." : "Sign in"}
              </button>
            </div>

            <div className="footer">
              <span className="footer-text">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="footer-link">Sign up</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
