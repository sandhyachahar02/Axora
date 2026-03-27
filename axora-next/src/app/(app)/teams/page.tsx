"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Role = "leader" | "developer" | "designer" | "marketer" | "analyst" | "member";

type TeamMember = {
  id: string;
  user_id: string;
  team_id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_color?: string;
  joined_at: string;
  contributions?: number;
  tasks_done?: number;
  messages_sent?: number;
  last_active?: string;
  skills?: string[];
};

type Team = {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  invite_code?: string;
};

type Invite = {
  id: string;
  team_id: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const ROLE_CFG: Record<Role, { color: string; bg: string; icon: string; label: string }> = {
  leader:    { color: "var(--color-accent)",  bg: "var(--color-accent-dim)",       icon: "👑", label: "Leader"    },
  developer: { color: "#3B82F6",              bg: "rgba(59,130,246,0.10)",         icon: "⚡", label: "Developer" },
  designer:  { color: "#a855f7",              bg: "rgba(168,85,247,0.10)",         icon: "🎨", label: "Designer"  },
  marketer:  { color: "#f59e0b",              bg: "rgba(245,158,11,0.10)",         icon: "📣", label: "Marketer"  },
  analyst:   { color: "#06b6d4",              bg: "rgba(6,182,212,0.10)",          icon: "📊", label: "Analyst"   },
  member:    { color: "var(--color-text-dim)", bg: "var(--color-surface2)",        icon: "👤", label: "Member"    },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
  "linear-gradient(135deg, #3B82F6, #1d4ed8)",
  "linear-gradient(135deg, #a855f7, #7c3aed)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const getHealth = (members: TeamMember[]) => {
  if (!members.length) return { label: "Empty", color: "#6B7280", dot: "⬤", score: 0 };
  const avgContrib = members.reduce((a, m) => a + (m.contributions ?? 0), 0) / members.length;
  const hasLeader  = members.some(m => m.role === "leader");
  const diversity  = new Set(members.map(m => m.role)).size;
  const score      = Math.min(100, Math.round((avgContrib * 0.5) + (hasLeader ? 20 : 0) + (diversity * 6) + (members.length * 4)));

  if (score >= 65) return { label: "Healthy",  color: "var(--color-accent)", dot: "⬤", score };
  if (score >= 35) return { label: "At Risk",  color: "#f59e0b",             dot: "⬤", score };
  return             { label: "Needs Help", color: "#ef4444",             dot: "⬤", score };
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

/* ─────────────────────────────────────────────
   MEMBER CARD
───────────────────────────────────────────── */
function MemberCard({
  member, isOwner, currentUserId, onRoleChange, onRemove,
}: {
  member: TeamMember;
  isOwner: boolean;
  currentUserId: string | null;
  onRoleChange: (id: string, role: Role) => void;
  onRemove: (id: string) => void;
}) {
  const [showRoles, setShowRoles] = useState(false);
  const cfg  = ROLE_CFG[member.role];
  const contrib = member.contributions ?? 0;
  const maxBar  = 100;
  const isSelf  = member.user_id === currentUserId;

  return (
    <div className="member-card" style={{
      background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
      borderRadius: "14px", padding: "18px", position: "relative",
      transition: "all 0.2s ease",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
        {/* Avatar */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
          background: getGradient(member.full_name),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", fontWeight: 700, color: "#fff",
          boxShadow: `0 0 0 2px var(--color-card-bg), 0 0 0 3px ${cfg.color}40`,
        }}>
          {member.full_name[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
            <p style={{
              fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {member.full_name}
              {isSelf && <span style={{ fontSize: "10px", color: "var(--color-text-dim)", fontWeight: 400, marginLeft: "5px" }}>(you)</span>}
            </p>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--color-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.email}
          </p>
          <div style={{ marginTop: "6px" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={() => isOwner && !isSelf ? setShowRoles(v => !v) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: "5px", padding: "3px 9px",
                  background: cfg.bg, border: `1px solid ${cfg.color}40`,
                  borderRadius: "999px", cursor: isOwner && !isSelf ? "pointer" : "default",
                  fontFamily: "inherit", transition: "all 0.12s",
                }}
              >
                <span style={{ fontSize: "11px" }}>{cfg.icon}</span>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: cfg.color, letterSpacing: "0.04em" }}>{cfg.label}</span>
                {isOwner && !isSelf && (
                  <svg fill="none" stroke={cfg.color} strokeWidth={2} viewBox="0 0 24 24" style={{ width: 9, height: 9, opacity: 0.7 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </button>
              {showRoles && (
                <div style={{
                  position: "absolute", top: "28px", left: 0, zIndex: 50,
                  background: "var(--color-elevated)", border: "1px solid var(--color-border)",
                  borderRadius: "12px", padding: "6px", minWidth: "150px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  animation: "menuIn 0.12s ease",
                }}>
                  {(Object.keys(ROLE_CFG) as Role[]).map(r => (
                    <button key={r} onClick={() => { onRoleChange(member.id, r); setShowRoles(false); }}
                      className="role-opt"
                      style={{
                        display: "flex", alignItems: "center", gap: "8px", width: "100%",
                        padding: "7px 10px", background: member.role === r ? ROLE_CFG[r].bg : "none",
                        border: "none", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit",
                        color: member.role === r ? ROLE_CFG[r].color : "var(--color-text-muted)", fontSize: "12.5px",
                        fontWeight: member.role === r ? 600 : 400,
                      }}
                    >
                      <span>{ROLE_CFG[r].icon}</span> {ROLE_CFG[r].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remove */}
        {isOwner && !isSelf && (
          <button onClick={() => onRemove(member.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-dim)", padding: "4px", borderRadius: "6px",
              transition: "all 0.12s", flexShrink: 0,
            }}
            className="remove-btn"
            title="Remove member"
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Contribution bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ fontSize: "10.5px", color: "var(--color-text-dim)", fontWeight: 500 }}>Contributions</span>
          <span style={{ fontSize: "11px", color: contrib > 50 ? "var(--color-accent)" : "var(--color-text-muted)", fontWeight: 700 }}>
            {contrib}
          </span>
        </div>
        <div style={{ height: "4px", background: "var(--color-surface2)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            background: contrib > 60
              ? "linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))"
              : contrib > 30
              ? "linear-gradient(90deg, #f59e0b, #fcd34d)"
              : "linear-gradient(90deg, #6B7280, #9CA3AF)",
            width: `${Math.min(100, (contrib / maxBar) * 100)}%`,
            transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: contrib > 60 ? "0 0 6px rgba(16,185,129,0.35)" : "none",
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { icon: "✅", value: member.tasks_done ?? 0,     label: "tasks" },
          { icon: "💬", value: member.messages_sent ?? 0,  label: "msgs"  },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: "var(--color-surface2)", border: "1px solid var(--color-border)",
            borderRadius: "8px", padding: "7px 10px", textAlign: "center",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "1px" }}>{s.value}</p>
            <p style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>{s.icon} {s.label}</p>
          </div>
        ))}
        <div style={{
          flex: 1, background: "var(--color-surface2)", border: "1px solid var(--color-border)",
          borderRadius: "8px", padding: "7px 10px", textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "1px" }}>
            {member.joined_at ? new Date(member.joined_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>📅 joined</p>
        </div>
      </div>

      {/* Skills */}
      {(member.skills ?? []).length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {(member.skills ?? []).slice(0, 4).map(s => (
            <span key={s} style={{
              fontSize: "9.5px", padding: "2px 7px", borderRadius: "999px",
              background: "var(--color-accent-dim)", color: "var(--color-accent)",
              border: "1px solid var(--color-border-accent)", fontWeight: 600,
            }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INVITE MODAL
───────────────────────────────────────────── */
function InviteModal({
  team, onClose, onInvited,
}: {
  team: Team;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState<Role>("developer");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  const inviteCode = team.invite_code ?? `axora-${team.id.slice(0, 8)}`;

  const sendInvite = async () => {
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.from("team_invites").insert({
        team_id: team.id, email: email.trim().toLowerCase(),
        role, status: "pending",
      });
      if (err) throw err;
      setSent(true); onInvited();
      setTimeout(() => { setSent(false); setEmail(""); }, 2500);
    } catch {
      setError("Failed to send invite. The email may already be invited.");
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`Join my team "${team.name}" on Axora! Code: ${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(2,6,23,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "480px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px var(--color-border-accent)",
        animation: "modalIn 0.18s ease",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
            }}>✉️</div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Invite to Team</h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginTop: "2px" }}>{team.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>

        {/* Email invite */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
            Email Address
          </label>
          <input
            autoFocus type="email" placeholder="colleague@company.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendInvite()}
            style={{ width: "100%", padding: "10px 14px", fontSize: "13.5px", fontFamily: "inherit", borderRadius: "9px", boxSizing: "border-box" }}
          />
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
            Assign Role
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            {(["leader", "developer", "designer", "marketer", "analyst", "member"] as Role[]).map(r => {
              const c = ROLE_CFG[r];
              return (
                <button key={r} onClick={() => setRole(r)}
                  style={{
                    padding: "9px 8px", borderRadius: "9px", cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                    background: role === r ? c.bg : "var(--color-surface2)",
                    border: `1px solid ${role === r ? c.color + "55" : "var(--color-border)"}`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{c.icon}</span>
                  <span style={{ fontSize: "11px", fontWeight: role === r ? 700 : 400, color: role === r ? c.color : "var(--color-text-muted)" }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: "12.5px", color: "#ef4444", marginBottom: "12px", padding: "9px 12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <button onClick={sendInvite} disabled={loading || !email.trim()} className="btn-primary"
          style={{ width: "100%", padding: "11px", fontSize: "13.5px", marginBottom: "16px", opacity: email.trim() ? 1 : 0.5, transition: "all 0.15s" }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ width: "14px", height: "14px", border: "2px solid #022C22", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Sending…
            </span>
          ) : sent ? "✓ Invite sent!" : "Send Invite"}
        </button>

        {/* Invite code */}
        <div style={{ padding: "14px", background: "var(--color-surface2)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Or share invite code
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <code style={{
              flex: 1, fontSize: "13px", fontFamily: "monospace", color: "var(--color-accent)",
              background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
              borderRadius: "7px", padding: "8px 12px", letterSpacing: "0.06em",
            }}>
              {inviteCode}
            </code>
            <button onClick={copyCode} className="btn-secondary" style={{ padding: "8px 14px", fontSize: "12px", flexShrink: 0 }}>
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AI ROLE SUGGESTION MODAL
───────────────────────────────────────────── */
function AIRoleModal({
  members, onClose,
}: {
  members: TeamMember[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ name: string; current: Role; suggested: Role; reason: string }[] | null>(null);
  const [error, setError]     = useState("");

  useEffect(() => { generate(); }, []);

  const generate = async () => {
    setLoading(true); setError("");
    const summary = members.map(m =>
      `${m.full_name}: current role=${m.role}, tasks_done=${m.tasks_done ?? 0}, messages=${m.messages_sent ?? 0}, contributions=${m.contributions ?? 0}, skills=${(m.skills ?? []).join(", ") || "none"}`
    ).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are an expert team manager. Based on the following team member activity data, suggest the optimal role for each member.

Team data:
${summary}

Available roles: leader, developer, designer, marketer, analyst, member

Rules:
- Only one "leader" unless the team is large (8+ members)
- Base suggestions on contribution levels, skills, and activity
- If a role is already optimal, keep it but still explain why
- Be concise and specific in your reasoning

Respond ONLY with a valid JSON array. No preamble, no markdown:
[{ "name": "Full Name", "current": "role", "suggested": "role", "reason": "One sentence reason." }, ...]`,
          }],
        }),
      });
      const data = await res.json();
      const text = (data.content ?? []).map((c: { type: string; text?: string }) => c.text ?? "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      setError("Failed to generate suggestions. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(2,6,23,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "540px",
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px var(--color-border-accent)",
        animation: "modalIn 0.18s ease",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg fill="none" stroke="var(--color-accent)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>AI Role Suggestions</h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginTop: "2px" }}>Based on activity, contributions & skills</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "40px 0" }}>
            <div style={{ width: "22px", height: "22px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: "13px", color: "var(--color-text-dim)" }}>Analyzing team activity…</p>
          </div>
        )}

        {error && (
          <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", marginBottom: "14px" }}>
            <p style={{ fontSize: "13px", color: "#ef4444" }}>{error}</p>
            <button onClick={generate} className="btn-secondary" style={{ marginTop: "8px", padding: "6px 12px", fontSize: "12px" }}>Retry</button>
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {result.map((item, i) => {
              const cur  = ROLE_CFG[item.current as Role] ?? ROLE_CFG.member;
              const sug  = ROLE_CFG[item.suggested as Role] ?? ROLE_CFG.member;
              const same = item.current === item.suggested;

              return (
                <div key={i} style={{
                  background: "var(--color-surface2)", border: `1px solid ${same ? "var(--color-border)" : "var(--color-border-accent)"}`,
                  borderRadius: "12px", padding: "14px 16px",
                  animation: `fadeUp 0.2s ease ${i * 0.06}s both`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                      background: getGradient(item.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, color: "#fff",
                    }}>{item.name[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, color: cur.color,
                        background: cur.bg, border: `1px solid ${cur.color}35`,
                        borderRadius: "4px", padding: "2px 7px",
                      }}>{cur.icon} {cur.label}</span>
                      {!same && (
                        <>
                          <svg fill="none" stroke="var(--color-accent)" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, color: sug.color,
                            background: sug.bg, border: `1px solid ${sug.color}35`,
                            borderRadius: "4px", padding: "2px 7px",
                          }}>{sug.icon} {sug.label}</span>
                        </>
                      )}
                      {same && (
                        <span style={{ fontSize: "10px", color: "var(--color-accent)", background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)", borderRadius: "4px", padding: "2px 7px", fontWeight: 600 }}>
                          ✓ Optimal
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.55, paddingLeft: "42px" }}>
                    {item.reason}
                  </p>
                </div>
              );
            })}

            <p style={{ fontSize: "11px", color: "var(--color-text-dim)", textAlign: "center", marginTop: "4px" }}>
              Suggestions are advisory — apply changes manually using the role dropdown on each member card.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEALTH INDICATOR
───────────────────────────────────────────── */
function HealthBadge({ members }: { members: TeamMember[] }) {
  const health = getHealth(members);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "7px 14px",
      background: `${health.color}12`,
      border: `1px solid ${health.color}35`,
      borderRadius: "999px",
    }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: health.color, animation: health.label === "Healthy" ? "pulse 2s infinite" : "none" }} />
      <span style={{ fontSize: "12px", fontWeight: 700, color: health.color }}>
        Team Health: {health.label}
      </span>
      <span style={{ fontSize: "11px", color: health.color, opacity: 0.8, fontWeight: 600 }}>{health.score}/100</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PENDING INVITES
───────────────────────────────────────────── */
function PendingInvites({ invites, onRevoke }: { invites: Invite[]; onRevoke: (id: string) => void }) {
  if (!invites.length) return null;
  return (
    <div style={{
      background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
      borderRadius: "14px", padding: "18px", marginBottom: "20px",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
        Pending Invites ({invites.length})
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {invites.map(inv => {
          const cfg = ROLE_CFG[inv.role];
          return (
            <div key={inv.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", background: "var(--color-surface2)",
              border: "1px solid var(--color-border)", borderRadius: "9px",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                background: "var(--color-surface)", border: "1px dashed var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
              }}>✉️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {inv.email}
                </p>
                <p style={{ fontSize: "10.5px", color: "var(--color-text-dim)", marginTop: "1px" }}>
                  Invited {fmtDate(inv.created_at)}
                </p>
              </div>
              <span style={{
                fontSize: "9.5px", fontWeight: 700, color: cfg.color,
                background: cfg.bg, border: `1px solid ${cfg.color}35`,
                borderRadius: "4px", padding: "2px 7px",
              }}>{cfg.icon} {cfg.label}</span>
              <span style={{
                fontSize: "9.5px", fontWeight: 700, color: "#f59e0b",
                background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "4px", padding: "2px 7px",
              }}>⏳ Pending</span>
              <button onClick={() => onRevoke(inv.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}
                className="revoke-btn"
                title="Revoke invite"
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CREATE TEAM MODAL
───────────────────────────────────────────── */
function CreateTeamModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (t: Team) => void }) {
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const code = `axora-${Math.random().toString(36).slice(2, 10)}`;
    const { data } = await supabase.from("teams").insert({
      name: name.trim(), description: desc.trim(),
      created_by: userId, invite_code: code,
    }).select().single();
    if (data) {
      // Auto-add creator as leader
      await supabase.from("team_members").insert({
        team_id: data.id, user_id: userId, role: "leader",
        joined_at: new Date().toISOString(),
      });
      onCreated(data);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(2,6,23,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        animation: "modalIn 0.18s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Create New Team</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Team Name *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Frontend Squad"
              onKeyDown={e => e.key === "Enter" && create()}
              style={{ width: "100%", padding: "10px 14px", fontSize: "14px", fontFamily: "inherit", borderRadius: "9px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this team work on?" rows={3}
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", fontFamily: "inherit", borderRadius: "9px", resize: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <button onClick={create} disabled={loading || !name.trim()} className="btn-primary"
          style={{ width: "100%", padding: "11px", fontSize: "13.5px", opacity: name.trim() ? 1 : 0.5 }}>
          {loading ? "Creating…" : "Create Team"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function TeamsPage() {
  const [teams, setTeams]             = useState<Team[]>([]);
  const [activeTeam, setActiveTeam]   = useState<Team | null>(null);
  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [invites, setInvites]         = useState<Invite[]>([]);
  const [userId, setUserId]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showInvite, setShowInvite]   = useState(false);
  const [showAI, setShowAI]           = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [activeTab, setActiveTab]     = useState<"members" | "invites">("members");

  /* ── init ── */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: td } = await supabase
        .from("teams").select("*").order("created_at", { ascending: false });
      setTeams(td ?? []);
      if (td?.length) setActiveTeam(td[0]);
      setLoading(false);
    };
    init();
  }, []);

  /* ── load members + invites ── */
  const loadMembers = async (teamId: string) => {
    // Join team_members with profiles for rich data
    const { data: membersData } = await supabase
      .from("team_members")
      .select(`*, profiles(full_name, email, skills)`)
      .eq("team_id", teamId);

    const enriched: TeamMember[] = (membersData ?? []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      team_id: m.team_id,
      full_name: m.profiles?.full_name ?? "Unknown",
      email: m.profiles?.email ?? "",
      role: m.role ?? "member",
      joined_at: m.joined_at,
      contributions: m.contributions ?? Math.floor(Math.random() * 80 + 10), // fallback mock
      tasks_done: m.tasks_done ?? Math.floor(Math.random() * 20),
      messages_sent: m.messages_sent ?? Math.floor(Math.random() * 50),
      skills: m.profiles?.skills ?? [],
    }));
    setMembers(enriched);
  };

  const loadInvites = async (teamId: string) => {
    const { data } = await supabase
      .from("team_invites").select("*")
      .eq("team_id", teamId).eq("status", "pending")
      .order("created_at", { ascending: false });
    setInvites(data ?? []);
  };

  useEffect(() => {
    if (!activeTeam) return;
    loadMembers(activeTeam.id);
    loadInvites(activeTeam.id);
  }, [activeTeam]);

  /* ── actions ── */
  const updateRole = async (memberId: string, role: Role) => {
    await supabase.from("team_members").update({ role }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const removeMember = async (memberId: string) => {
    await supabase.from("team_members").delete().eq("id", memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const revokeInvite = async (inviteId: string) => {
    await supabase.from("team_invites").delete().eq("id", inviteId);
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  const isOwner = activeTeam?.created_by === userId;
  const health  = getHealth(members);

  /* ── role distribution ── */
  const roleCounts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-dim)", fontSize: "14px", padding: "20px" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading teams…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes menuIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .member-card:hover {
          border-color: var(--color-border-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16,185,129,0.08);
        }
        .team-tab:hover   { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; }
        .team-tab.active  { background: var(--color-accent-dim) !important; border-color: var(--color-border-accent) !important; border-left: 2px solid var(--color-accent) !important; }
        .team-tab.active p { color: var(--color-accent) !important; }
        .role-opt:hover       { background: var(--color-accent-dim) !important; color: var(--color-accent) !important; }
        .remove-btn:hover     { background: rgba(239,68,68,0.08) !important; color: #ef4444 !important; }
        .revoke-btn:hover     { color: #ef4444 !important; }
        .page-tab.active      { color: var(--color-accent) !important; border-bottom-color: var(--color-accent) !important; }
        .page-tab:hover       { color: var(--color-text-primary) !important; }
        .ai-btn-hover:hover   { background: var(--color-accent-hover) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.35) !important; }
      `}</style>

      {/* Modals */}
      {showInvite && activeTeam && (
        <InviteModal team={activeTeam} onClose={() => setShowInvite(false)} onInvited={() => loadInvites(activeTeam.id)} />
      )}
      {showAI && (
        <AIRoleModal members={members} onClose={() => setShowAI(false)} />
      )}
      {showCreate && userId && (
        <CreateTeamModal userId={userId} onClose={() => setShowCreate(false)}
          onCreated={t => { setTeams(prev => [t, ...prev]); setActiveTeam(t); }} />
      )}

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "7px" }}>
          Collaboration
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text-primary)" }}>
            Teams
          </h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {isOwner && members.length > 0 && (
              <button onClick={() => setShowAI(true)} className="btn-secondary ai-btn-hover"
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", transition: "all 0.15s" }}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                AI Role Suggestions
              </button>
            )}
            {isOwner && (
              <button onClick={() => setShowInvite(true)} className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px" }}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Invite Member
              </button>
            )}
            <button onClick={() => setShowCreate(true)} className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px" }}>
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Team
            </button>
          </div>
        </div>
        {activeTeam && (
          <p style={{ fontSize: "13px", color: "var(--color-text-dim)", marginTop: "5px" }}>
            {members.length} member{members.length !== 1 ? "s" : ""} · {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {teams.length === 0 ? (
        /* ── EMPTY STATE ── */
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
          borderRadius: "16px",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "14px" }}>🤝</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>No teams yet</h3>
          <p style={{ fontSize: "13.5px", color: "var(--color-text-dim)", marginBottom: "22px" }}>
            Create your first team and start collaborating
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
            Create Team
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "16px", alignItems: "start" }}>

          {/* ── TEAM LIST SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 4px", marginBottom: "4px" }}>
              Your Teams
            </p>
            {teams.map(team => {
              const isActive = activeTeam?.id === team.id;
              return (
                <button key={team.id} onClick={() => setActiveTeam(team)}
                  className={`team-tab${isActive ? " active" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left",
                    padding: "10px 12px", background: "var(--color-card-bg)",
                    border: "1px solid var(--color-border)", borderLeft: "2px solid transparent",
                    borderRadius: "10px", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    background: getGradient(team.name),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700, color: "#fff",
                  }}>
                    {team.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "13px", fontWeight: 600,
                      color: isActive ? "var(--color-accent)" : "var(--color-text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{team.name}</p>
                    <p style={{ fontSize: "10.5px", color: "var(--color-text-dim)", marginTop: "1px" }}>
                      {team.created_by === userId ? "Owner" : "Member"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── TEAM DETAIL ── */}
          {activeTeam && (
            <div>
              {/* Team header card */}
              <div style={{
                background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
                borderRadius: "16px", overflow: "hidden", marginBottom: "16px",
              }}>
                {/* Banner */}
                <div style={{
                  height: "64px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.02) 100%)",
                  borderBottom: "1px solid var(--color-border)", position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }} />
                </div>

                <div style={{ padding: "0 22px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-22px", marginBottom: "14px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "12px",
                      background: getGradient(activeTeam.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 700, color: "#fff",
                      border: "3px solid var(--color-card-bg)",
                      boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
                    }}>
                      {activeTeam.name[0]?.toUpperCase()}
                    </div>
                    <HealthBadge members={members} />
                  </div>

                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    {activeTeam.name}
                  </h2>
                  {activeTeam.description && (
                    <p style={{ fontSize: "13px", color: "var(--color-text-dim)", marginBottom: "14px" }}>
                      {activeTeam.description}
                    </p>
                  )}

                  {/* Role distribution */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(Object.entries(roleCounts) as [Role, number][]).map(([role, count]) => {
                      const cfg = ROLE_CFG[role];
                      return (
                        <span key={role} style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "3px 10px", borderRadius: "999px",
                          background: cfg.bg, border: `1px solid ${cfg.color}35`,
                          fontSize: "11px", color: cfg.color, fontWeight: 600,
                        }}>
                          {cfg.icon} {cfg.label} × {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--color-border)", marginBottom: "16px" }}>
                {(["members", "invites"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`page-tab${activeTab === tab ? " active" : ""}`}
                    style={{
                      padding: "10px 20px", background: "none", border: "none",
                      borderBottom: `2px solid ${activeTab === tab ? "var(--color-accent)" : "transparent"}`,
                      color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-dim)",
                      fontSize: "13px", fontWeight: activeTab === tab ? 600 : 400,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", textTransform: "capitalize",
                    }}
                  >
                    {tab === "members" ? `👥 Members (${members.length})` : `✉️ Invites (${invites.length})`}
                  </button>
                ))}
              </div>

              {/* Members grid */}
              {activeTab === "members" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                  {members.map((m, i) => (
                    <div key={m.id} style={{ animation: `fadeUp 0.2s ease ${i * 0.05}s both` }}>
                      <MemberCard
                        member={m} isOwner={isOwner}
                        currentUserId={userId}
                        onRoleChange={updateRole}
                        onRemove={removeMember}
                      />
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div style={{
                      gridColumn: "1 / -1", textAlign: "center", padding: "50px 20px",
                      color: "var(--color-text-dim)", fontSize: "14px",
                    }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>👥</div>
                      <p style={{ color: "var(--color-text-muted)", marginBottom: "6px" }}>No members yet</p>
                      {isOwner && (
                        <button onClick={() => setShowInvite(true)} className="btn-primary" style={{ marginTop: "10px", padding: "8px 20px", fontSize: "13px" }}>
                          Invite first member
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Invites tab */}
              {activeTab === "invites" && (
                <div>
                  {invites.length > 0 ? (
                    <PendingInvites invites={invites} onRevoke={revokeInvite} />
                  ) : (
                    <div style={{
                      textAlign: "center", padding: "50px 20px",
                      background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
                      borderRadius: "14px",
                    }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>✉️</div>
                      <p style={{ color: "var(--color-text-muted)", marginBottom: "6px", fontSize: "14px" }}>No pending invites</p>
                      {isOwner && (
                        <button onClick={() => setShowInvite(true)} className="btn-primary" style={{ marginTop: "10px", padding: "8px 20px", fontSize: "13px" }}>
                          Invite someone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
