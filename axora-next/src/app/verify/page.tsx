"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

 const hasSentOtp = useRef(false);

useEffect(() => {
  setMounted(true);
  if (emailFromParams && !hasSentOtp.current) {
    hasSentOtp.current = true;
    // Don't auto-send — OTP was already sent during signup
  }
}, []);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResending(true);
    setError("");

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });

    const data = await res.json();
    setResending(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send OTP");
      return;
    }

    setSuccess(`Verification code sent to ${targetEmail}`);
    startCountdown();
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(d => d !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const code = otpValue ?? otp.join("");
    if (code.length !== 6) { setError("Please enter the full 6-digit code."); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      setLoading(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    // Update user metadata to mark email as verified
    await supabase.auth.updateUser({ data: { email_verified: true } });

    setSuccess("Email verified! Redirecting...");
    setTimeout(() => {
      router.push("/onboarding");
    }, 1500);
  };

  const handleChangeEmail = async () => {
    if (!newEmail) { setError("Enter a new email."); return; }
    setEmail(newEmail);
    setShowChangeEmail(false);
    setOtp(["", "", "", "", "", ""]);
    setNewEmail("");
    await sendOtp(newEmail);
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}>
        {/* Blobs */}
        <div style={{
          position: "absolute", width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(99,91,255,0.1) 0%, transparent 70%)",
          top: "-100px", left: "-80px", borderRadius: "50%", filter: "blur(100px)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          bottom: "-80px", right: "-60px", borderRadius: "50%", filter: "blur(100px)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: "100%", maxWidth: "420px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.032)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "40px 36px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Top glow line */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.5), transparent)",
            }} />

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "9px",
                background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", boxShadow: "0 4px 14px rgba(99,91,255,0.4)",
              }}>✦</div>
              <span style={{ fontSize: "18px", fontWeight: 600, color: "#fff", letterSpacing: "-0.3px" }}>
                Axora
              </span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", marginBottom: "6px" }}>
                Verify your email
              </h1>
              <p style={{ fontSize: "13.5px", color: "rgba(230,230,230,0.4)", lineHeight: 1.6 }}>
                We sent a 6-digit code to{" "}
                <span style={{ color: "#a89fff", fontWeight: 500 }}>{email}</span>
              </p>
            </div>

            {/* Success message */}
            {success && (
              <div style={{
                padding: "10px 14px", borderRadius: "10px", marginBottom: "16px",
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                fontSize: "13px", color: "#22c55e",
              }}>
                ✓ {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "10px", marginBottom: "16px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                fontSize: "13px", color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            {/* OTP Input boxes */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: "48px", height: "56px",
                    textAlign: "center",
                    fontSize: "22px", fontWeight: 700,
                    color: digit ? "#fff" : "rgba(230,230,230,0.3)",
                    background: digit ? "rgba(99,91,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: digit
                      ? "1px solid rgba(99,91,255,0.5)"
                      : "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "12px",
                    outline: "none",
                    caretColor: "#635BFF",
                    transition: "all 0.15s",
                    fontFamily: "'DM Mono', monospace",
                    boxShadow: digit ? "0 0 12px rgba(99,91,255,0.2)" : "none",
                  }}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={() => handleVerify()}
              disabled={loading || otp.join("").length !== 6}
              style={{
                width: "100%", padding: "13px",
                background: "linear-gradient(135deg, #635BFF 0%, #3B82F6 100%)",
                border: "none", borderRadius: "11px",
                color: "#fff", fontSize: "14.5px", fontWeight: 600,
                cursor: loading || otp.join("").length !== 6 ? "not-allowed" : "pointer",
                opacity: loading || otp.join("").length !== 6 ? 0.6 : 1,
                fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(99,91,255,0.35)",
                transition: "all 0.18s",
                marginBottom: "16px",
              }}
            >
              {loading ? "Verifying..." : "Verify Email →"}
            </button>

            {/* Resend + Change email */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => sendOtp(email)}
                disabled={resending || countdown > 0}
                style={{
                  background: "none", border: "none",
                  color: countdown > 0 ? "rgba(230,230,230,0.3)" : "rgba(99,91,255,0.8)",
                  fontSize: "13px", cursor: countdown > 0 ? "not-allowed" : "pointer",
                  fontFamily: "inherit", padding: 0,
                }}
              >
                {resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>

              <button
                onClick={() => setShowChangeEmail(v => !v)}
                style={{
                  background: "none", border: "none",
                  color: "rgba(230,230,230,0.35)", fontSize: "13px",
                  cursor: "pointer", fontFamily: "inherit", padding: 0,
                }}
              >
                Change email
              </button>
            </div>

            {/* Change email form */}
            {showChangeEmail && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "10px", padding: "11px 14px",
                    color: "#f0f0f0", fontSize: "14px", outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleChangeEmail}
                  style={{
                    padding: "10px",
                    background: "rgba(99,91,255,0.12)",
                    border: "1px solid rgba(99,91,255,0.25)",
                    borderRadius: "10px", color: "#a89fff",
                    fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Send code to new email →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
