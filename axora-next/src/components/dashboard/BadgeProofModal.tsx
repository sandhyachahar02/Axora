"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { Badge, TIER_COLORS, TIER_LABELS } from "@/lib/badges";

type Props = {
  badge: Badge;
  onClose: () => void;
  onSubmitted: () => void;
  existingProof?: {
    status: string;
    project_url?: string;
    github_url?: string;
    linkedin_url?: string;
    description?: string;
    certificate_url?: string;
  } | null;
};

export function BadgeProofModal({ badge, onClose, onSubmitted, existingProof }: Props) {
  const [projectUrl, setProjectUrl] = useState(existingProof?.project_url ?? "");
  const [githubUrl, setGithubUrl] = useState(existingProof?.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(existingProof?.linkedin_url ?? "");
  const [description, setDescription] = useState(existingProof?.description ?? "");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!description && !projectUrl && !githubUrl && !linkedinUrl && !certFile) {
      setError("Please provide at least one form of proof.");
      return;
    }

    setUploading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not logged in."); setUploading(false); return; }

    let certificateUrl = existingProof?.certificate_url ?? "";

    // Upload certificate if provided
    if (certFile) {
      const ext = certFile.name.split(".").pop();
      const filename = `${session.user.id}/${badge.type}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filename, certFile, { upsert: true });

      if (uploadError) {
        setError("Certificate upload failed: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filename);

      certificateUrl = urlData.publicUrl;
    }

    // Upsert proof record
    const { error: dbError } = await supabase
      .from("badge_proofs")
      .upsert({
        user_id: session.user.id,
        badge_type: badge.type,
        project_url: projectUrl || null,
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        description: description || null,
        certificate_url: certificateUrl || null,
        status: "unverified",
        submitted_at: new Date().toISOString(),
      }, { onConflict: "user_id,badge_type" });

    if (dbError) { setError(dbError.message); setUploading(false); return; }

    // Award the badge automatically
    await supabase.from("badges").upsert({
      user_id: session.user.id,
      badge_type: badge.type,
    }, { onConflict: "user_id,badge_type" });

    setUploading(false);
    onSubmitted();
    onClose();
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "#f0f0f0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    fontFamily: "var(--font-dm-sans)",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 500 as const,
    color: "rgba(230,230,230,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "6px",
    display: "block" as const,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 101,
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#0d0d12",
        border: `1px solid ${badge.glow.replace("0.4", "0.3")}`,
        borderRadius: "20px",
        padding: "32px",
        boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 40px ${badge.glow.replace("0.4", "0.15")}`,
      }}>
        {/* Top gradient bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: badge.gradient, borderRadius: "20px 20px 0 0",
        }} />

        {/* Badge header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: badge.glow.replace("0.4", "0.12"),
            border: `1px solid ${badge.glow.replace("0.4", "0.3")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px",
            boxShadow: `0 0 20px ${badge.glow}`,
            flexShrink: 0,
          }}>
            {badge.symbol}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>
                {badge.label}
              </h2>
              <span style={{
                fontSize: "9px", fontWeight: 800,
                color: TIER_COLORS[badge.tier],
                background: `${TIER_COLORS[badge.tier]}18`,
                border: `1px solid ${TIER_COLORS[badge.tier]}40`,
                borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em",
              }}>
                {TIER_LABELS[badge.tier]}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.4)", margin: 0, fontStyle: "italic" }}>
              {badge.tagline}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", color: "rgba(230,230,230,0.5)",
              fontSize: "16px", cursor: "pointer", padding: "4px 10px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Status banner if already submitted */}
        {existingProof && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px", marginBottom: "20px",
            background: existingProof.status === "verified"
              ? "rgba(34,197,94,0.1)" : existingProof.status === "rejected"
              ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${existingProof.status === "verified"
              ? "rgba(34,197,94,0.3)" : existingProof.status === "rejected"
              ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
            fontSize: "12.5px",
            color: existingProof.status === "verified" ? "#22c55e"
              : existingProof.status === "rejected" ? "#ef4444" : "#f59e0b",
          }}>
            {existingProof.status === "verified" && "✓ Your proof has been verified!"}
            {existingProof.status === "rejected" && "✗ Proof was rejected. Please resubmit with stronger evidence."}
            {existingProof.status === "unverified" && "⏳ Proof submitted — pending review. Badge awarded provisionally."}
          </div>
        )}

        {/* What we need */}
        <div style={{
          padding: "12px 14px", borderRadius: "10px", marginBottom: "20px",
          background: "rgba(99,91,255,0.06)", border: "1px solid rgba(99,91,255,0.15)",
        }}>
          <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.5)", margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: "#a89fff", fontWeight: 600 }}>How to earn this: </span>
            {badge.motivation}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Certificate upload */}
          <div>
            <label style={labelStyle}>Upload Certificate or Screenshot (PDF / Image)</label>
            <div style={{
              border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: "10px", padding: "16px",
              textAlign: "center", cursor: "pointer",
              background: certFile ? "rgba(99,91,255,0.08)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
              onClick={() => document.getElementById("cert-upload")?.click()}
            >
              <input
                id="cert-upload"
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={e => setCertFile(e.target.files?.[0] ?? null)}
              />
              {certFile ? (
                <p style={{ fontSize: "13px", color: "#a89fff", margin: 0 }}>
                  ✓ {certFile.name}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.3)", margin: 0 }}>
                    Click to upload certificate, screenshot, or diploma
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(230,230,230,0.2)", margin: "4px 0 0" }}>
                    PNG, JPG, PDF — max 5MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Project URL */}
          <div>
            <label style={labelStyle}>Project / Portfolio URL</label>
            <input
              type="url"
              placeholder="https://github.com/you/your-project"
              value={projectUrl}
              onChange={e => setProjectUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* GitHub */}
          <div>
            <label style={labelStyle}>GitHub Profile URL</label>
            <input
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label style={labelStyle}>LinkedIn Profile URL</label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description of Proof</label>
            <textarea
              placeholder={`Briefly explain your evidence. e.g. "Completed Coursera ML Specialization by Andrew Ng, certificate uploaded above. Also built a sentiment analysis project linked above."`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{
              fontSize: "12.5px", color: "#ef4444",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px", margin: 0,
            }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              width: "100%", padding: "13px",
              background: badge.gradient,
              border: "none", borderRadius: "11px",
              color: "#fff", fontSize: "14px", fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.65 : 1,
              fontFamily: "var(--font-dm-sans)",
              boxShadow: `0 4px 20px ${badge.glow}`,
              transition: "all 0.18s",
            }}
          >
            {uploading ? "Submitting..." : existingProof ? "Resubmit Proof →" : "Submit Proof & Earn Badge →"}
          </button>

          <p style={{
            fontSize: "11.5px", color: "rgba(230,230,230,0.25)",
            textAlign: "center", margin: 0, lineHeight: 1.6,
          }}>
            Badge is awarded immediately. Proof is reviewed by the Axora team within 48 hours.
            Unverified badges show a ⏳ indicator until confirmed.
          </p>
        </div>
      </div>
    </>
  );
}
