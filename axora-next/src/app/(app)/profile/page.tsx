"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";
import {
  BADGE_DEFINITIONS,
  TIER_COLORS,
  TIER_LABELS,
  checkAndAwardBadges,
  BadgeType,
} from "@/lib/badges";
import { BadgeProofModal } from "@/components/dashboard/BadgeProofModal";

type Profile = {
  full_name: string;
  role: string;
  skills: string[];
  bio: string;
  github_url: string;
  linkedin_url: string;
};

type ProofRecord = {
  badge_type: string;
  status: string;
  project_url?: string;
  github_url?: string;
  linkedin_url?: string;
  description?: string;
  certificate_url?: string;
};

// Skill proficiency levels (mock — extend to pull from DB as needed)
const SKILL_LEVELS: Record<string, number> = {
  React: 90, TypeScript: 85, "Next.js": 80, "Node.js": 75,
  Python: 70, "UI/UX": 65, GraphQL: 60, Docker: 55,
};

function SkillGraph({ skills }: { skills: string[] }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
      {skills.slice(0, 8).map((skill, i) => {
        const level = SKILL_LEVELS[skill] ?? Math.floor(55 + Math.random() * 35);
        return (
          <div key={skill}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--color-text-muted)", fontWeight: 500 }}>{skill}</span>
              <span style={{ fontSize: "11px", color: "var(--color-accent)", fontWeight: 600 }}>{level}%</span>
            </div>
            <div style={{
              height: "5px", background: "var(--color-surface2)", borderRadius: "999px",
              overflow: "hidden", border: "1px solid var(--color-border)",
            }}>
              <div style={{
                height: "100%", borderRadius: "999px",
                background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))`,
                width: animated ? `${level}%` : "0%",
                transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.07}s`,
                boxShadow: "0 0 8px rgba(16,185,129,0.4)",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [proofs, setProofs] = useState<Record<string, ProofRecord>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [modalBadge, setModalBadge] = useState<BadgeType | null>(null);
  const [activeTab, setActiveTab] = useState<"badges" | "skills" | "activity">("badges");
  const [copySuccess, setCopySuccess] = useState(false);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    await checkAndAwardBadges(supabase, session.user.id);
    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(profileData);
    const { data: badgesData } = await supabase
      .from("badges").select("badge_type").eq("user_id", session.user.id);
    setEarnedBadges((badgesData ?? []).map((b: { badge_type: string }) => b.badge_type as BadgeType));
    const { data: proofsData } = await supabase
      .from("badge_proofs").select("*").eq("user_id", session.user.id);
    const proofMap: Record<string, ProofRecord> = {};
    (proofsData ?? []).forEach((p: ProofRecord) => { proofMap[p.badge_type] = p; });
    setProofs(proofMap);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const allBadges = Object.values(BADGE_DEFINITIONS);

  const getStatusBadge = (badgeType: BadgeType) => {
    if (!earnedBadges.includes(badgeType)) return null;
    const proof = proofs[badgeType];
    if (!proof) return { label: "AUTO", color: "var(--color-accent)", bg: "var(--color-accent-dim)" };
    if (proof.status === "verified") return { label: "✓ VERIFIED", color: "#22c55e", bg: "rgba(34,197,94,0.10)" };
    if (proof.status === "rejected") return { label: "✗ REJECTED", color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
    return { label: "⏳ PENDING", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" };
  };

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const verifiedCount = earnedBadges.filter(b => proofs[b]?.status === "verified").length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-dim)", fontSize: "14px", padding: "20px" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading profile…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!profile) return <div style={{ color: "var(--color-text-dim)", fontSize: "14px", padding: "20px" }}>Profile not found.</div>;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 16px rgba(16,185,129,0.2); } 50% { box-shadow: 0 0 28px rgba(16,185,129,0.45); } }
        .profile-page { animation: fadeUp 0.3s ease; }
        .stat-card:hover { border-color: var(--color-border-hover) !important; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(16,185,129,0.12) !important; }
        .skill-tag:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .tab-btn.active { color: var(--color-accent) !important; border-bottom-color: var(--color-accent) !important; }
        .tab-btn:hover { color: var(--color-text-primary) !important; }
        .badge-card:hover { transform: translateY(-3px); }
        .social-link:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .collab-btn:hover { background: var(--color-accent-hover) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4) !important; }
        .hire-btn:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .copy-btn:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
      `}</style>

      <div className="profile-page" style={{ maxWidth: "800px" }}>
        {modalBadge && (
          <BadgeProofModal
            badge={BADGE_DEFINITIONS[modalBadge]}
            existingProof={proofs[modalBadge] ?? null}
            onClose={() => setModalBadge(null)}
            onSubmitted={() => { loadData(); }}
          />
        )}

        {/* Page header */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "6px",
          }}>
            My Profile
          </p>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text-primary)", marginBottom: "4px" }}>
            Skill Portfolio
          </h1>
          <p style={{ fontSize: "13.5px", color: "var(--color-text-dim)" }}>
            Your verifiable reputation built from real actions on Axora
          </p>
        </div>

        {/* ── Profile hero card ── */}
        <div style={{
          background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
          borderRadius: "16px", overflow: "hidden", marginBottom: "16px",
        }}>
          {/* Gradient top bar */}
          <div style={{
            height: "80px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 60%, transparent 100%)",
            borderBottom: "1px solid var(--color-border)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: "200px", height: "80px",
              background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)",
            }} />
          </div>

          <div style={{ padding: "0 28px 24px" }}>
            {/* Avatar — overlaps banner */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-28px", marginBottom: "16px" }}>
              <div style={{
                width: "62px", height: "62px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", fontWeight: 700, color: "#022C22",
                border: "3px solid var(--color-card-bg)",
                boxShadow: "0 0 20px rgba(16,185,129,0.3)",
                animation: "glow 3s ease infinite",
                flexShrink: 0,
              }}>
                {profile.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingTop: "8px" }}>
                <button onClick={handleCopyProfile} className="copy-btn"
                  style={{
                    padding: "7px 12px", background: "var(--color-surface2)",
                    border: "1px solid var(--color-border)", borderRadius: "8px",
                    color: copySuccess ? "var(--color-accent)" : "var(--color-text-muted)",
                    fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s",
                  }}
                >
                  {copySuccess ? (
                    <><svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                  ) : (
                    <><svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Share</>
                  )}
                </button>
                <button className="hire-btn"
                  style={{
                    padding: "7px 14px", background: "var(--color-surface2)",
                    border: "1px solid var(--color-border)", borderRadius: "8px",
                    color: "var(--color-text-muted)", fontSize: "12px",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
                  </svg>
                  Hire me
                </button>
                <button className="collab-btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Collaborate
                </button>
              </div>
            </div>

            {/* Name + role */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
                  {profile.full_name}
                </h2>
                {earnedBadges.length > 0 && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {earnedBadges.slice(0, 5).map(bt => {
                      const b = BADGE_DEFINITIONS[bt];
                      return (
                        <span key={bt}
                          onClick={() => setModalBadge(bt)}
                          style={{ fontSize: "15px", filter: `drop-shadow(0 0 5px ${b.glow})`, cursor: "pointer" }}
                          title={b.label}
                        >{b.symbol}</span>
                      );
                    })}
                    {earnedBadges.length > 5 && (
                      <span style={{ fontSize: "11px", color: "var(--color-text-dim)", alignSelf: "center" }}>+{earnedBadges.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-dim)", marginTop: "2px" }}>{profile.role}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{
                fontSize: "13.5px", color: "var(--color-text-muted)", lineHeight: 1.65,
                marginBottom: "18px", paddingBottom: "18px", borderBottom: "1px solid var(--color-divider)",
              }}>
                {profile.bio}
              </p>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
              {[
                { label: "Badges Earned", value: earnedBadges.length, icon: "🏆" },
                { label: "Verified", value: verifiedCount, icon: "✓", accent: true },
                { label: "Skills", value: (profile.skills ?? []).length, icon: "⚡" },
              ].map(stat => (
                <div key={stat.label} className="stat-card"
                  style={{
                    flex: 1, minWidth: "100px",
                    background: stat.accent ? "var(--color-accent-dim)" : "var(--color-surface2)",
                    border: `1px solid ${stat.accent ? "var(--color-border-accent)" : "var(--color-border)"}`,
                    borderRadius: "10px", padding: "12px 14px",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "4px" }}>{stat.icon}</div>
                  <div style={{
                    fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px",
                    color: stat.accent ? "var(--color-accent)" : "var(--color-text-primary)",
                  }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-dim)", marginTop: "1px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div style={{ marginBottom: "18px" }}>
              <p style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: "10px",
              }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {(profile.skills ?? []).map(skill => (
                  <span key={skill} className="skill-tag"
                    style={{
                      background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-muted)", borderRadius: "999px", padding: "4px 12px",
                      fontSize: "12px", transition: "all 0.15s", cursor: "default",
                    }}
                  >{skill}</span>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="social-link"
                  style={{
                    padding: "7px 14px", background: "var(--color-surface2)",
                    border: "1px solid var(--color-border)", borderRadius: "8px",
                    fontSize: "12.5px", color: "var(--color-text-muted)", textDecoration: "none",
                    display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s",
                  }}
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub ↗
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="social-link"
                  style={{
                    padding: "7px 14px", background: "var(--color-surface2)",
                    border: "1px solid var(--color-border)", borderRadius: "8px",
                    fontSize: "12.5px", color: "var(--color-text-muted)", textDecoration: "none",
                    display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s",
                  }}
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", gap: "0", borderBottom: "1px solid var(--color-border)",
          marginBottom: "16px",
        }}>
          {(["badges", "skills", "activity"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-btn${activeTab === tab ? " active" : ""}`}
              style={{
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: `2px solid ${activeTab === tab ? "var(--color-accent)" : "transparent"}`,
                color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-dim)",
                fontSize: "13px", fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {tab === "badges" && `🏆 Badges (${earnedBadges.length}/${allBadges.length})`}
              {tab === "skills" && `📊 Skill Graph`}
              {tab === "activity" && `⚡ Activity`}
            </button>
          ))}
        </div>

        {/* ── Tab: Skill Graph ── */}
        {activeTab === "skills" && (
          <div style={{
            background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>Skill Proficiency</h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginTop: "3px" }}>Based on your activity and endorsements</p>
              </div>
              <div style={{
                background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
                borderRadius: "8px", padding: "6px 12px",
                fontSize: "12px", color: "var(--color-accent)", fontWeight: 600,
              }}>
                {(profile.skills ?? []).length} skills
              </div>
            </div>
            <SkillGraph skills={profile.skills ?? []} />
          </div>
        )}

        {/* ── Tab: Activity ── */}
        {activeTab === "activity" && (
          <div style={{
            background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "28px",
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "18px" }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { icon: "🏆", text: "Earned Early Adopter badge", time: "2 days ago", accent: true },
                { icon: "💬", text: "Sent 12 messages in #general", time: "3 days ago" },
                { icon: "🤝", text: "Joined Axora workspace", time: "1 week ago" },
                { icon: "✅", text: "Submitted badge proof for verification", time: "1 week ago" },
                { icon: "🚀", text: "Completed profile setup", time: "1 week ago" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 0",
                  borderBottom: i < 4 ? "1px solid var(--color-divider)" : "none",
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    background: item.accent ? "var(--color-accent-dim)" : "var(--color-surface2)",
                    border: `1px solid ${item.accent ? "var(--color-border-accent)" : "var(--color-border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                  }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{item.text}</p>
                    <p style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Badges ── */}
        {activeTab === "badges" && (
          <div style={{
            background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>Reputation Badges</h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginTop: "3px" }}>Click any badge to submit proof and get verified</p>
              </div>
              <div style={{
                background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
                borderRadius: "999px", padding: "5px 16px",
                fontSize: "13px", fontWeight: 700, color: "var(--color-accent)",
              }}>
                {earnedBadges.length}/{allBadges.length} Earned
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "12px",
            }}>
              {allBadges.map(badge => {
                const isEarned = earnedBadges.includes(badge.type);
                const isHovered = hoveredBadge === badge.type;
                const statusBadge = getStatusBadge(badge.type);

                return (
                  <div key={badge.type} className="badge-card"
                    onMouseEnter={() => setHoveredBadge(badge.type)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    onClick={() => setModalBadge(badge.type)}
                    style={{
                      padding: "18px",
                      background: isEarned ? badge.glow.replace("0.4", "0.07") : "var(--color-surface2)",
                      border: isEarned
                        ? `1px solid ${badge.glow.replace("0.4", "0.25")}`
                        : "1px solid var(--color-border)",
                      borderRadius: "14px", position: "relative", overflow: "hidden",
                      transition: "all 0.22s ease",
                      boxShadow: isEarned && isHovered ? `0 8px 28px ${badge.glow}` : isEarned ? `0 4px 14px ${badge.glow.replace("0.4", "0.15")}` : "none",
                      filter: isEarned ? "none" : "grayscale(0.6)",
                      opacity: isEarned ? 1 : 0.55, cursor: "pointer",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                      background: isEarned ? badge.gradient : "var(--color-border)",
                    }} />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{
                        fontSize: "9px", fontWeight: 800,
                        color: isEarned ? TIER_COLORS[badge.tier] : "var(--color-text-dim)",
                        background: isEarned ? `${TIER_COLORS[badge.tier]}15` : "var(--color-surface)",
                        border: `1px solid ${isEarned ? TIER_COLORS[badge.tier] + "35" : "var(--color-border)"}`,
                        borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.08em",
                      }}>
                        {isEarned ? TIER_LABELS[badge.tier] : "LOCKED"}
                      </span>
                      {statusBadge && (
                        <span style={{
                          fontSize: "9px", fontWeight: 700, color: statusBadge.color,
                          background: statusBadge.bg, border: `1px solid ${statusBadge.color}40`,
                          borderRadius: "4px", padding: "2px 6px",
                        }}>
                          {statusBadge.label}
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: "34px", marginBottom: "10px",
                      filter: isEarned ? `drop-shadow(0 0 10px ${badge.glow})` : "none",
                      transition: "filter 0.2s, transform 0.2s",
                      transform: isHovered && isEarned ? "scale(1.1)" : "scale(1)",
                    }}>
                      {badge.symbol}
                    </div>

                    <div style={{
                      fontSize: "13px", fontWeight: 700,
                      color: isEarned ? "var(--color-text-primary)" : "var(--color-text-dim)",
                      letterSpacing: "-0.2px", marginBottom: "3px",
                    }}>{badge.label}</div>

                    <div style={{
                      fontSize: "11px", fontWeight: 500,
                      color: isEarned ? badge.glow.replace("rgba(", "rgba(").replace(", 0.4)", ", 0.75)") : "var(--color-text-dim)",
                      marginBottom: "9px", fontStyle: "italic",
                    }}>{badge.tagline}</div>

                    <p style={{
                      fontSize: "11.5px",
                      color: isEarned ? "var(--color-text-muted)" : "var(--color-text-dim)",
                      lineHeight: 1.55, margin: 0, paddingTop: "9px",
                      borderTop: "1px solid var(--color-divider)",
                    }}>
                      {isEarned ? badge.description : badge.motivation}
                    </p>

                    <div style={{
                      marginTop: "10px", fontSize: "10.5px",
                      color: isEarned
                        ? proofs[badge.type]?.status === "verified" ? "#22c55e" : "var(--color-accent)"
                        : "var(--color-text-dim)",
                      textAlign: "center", paddingTop: "7px", borderTop: "1px solid var(--color-divider)",
                    }}>
                      {isEarned
                        ? proofs[badge.type]?.status === "verified" ? "✓ Proof verified"
                          : proofs[badge.type] ? "⏳ View submitted proof"
                          : "→ Submit proof to verify"
                        : "→ Click to earn this badge"}
                    </div>
                  </div>
                );
              })}
            </div>

            {earnedBadges.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-dim)", fontSize: "14px" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
                <p style={{ color: "var(--color-text-muted)", marginBottom: "6px" }}>Your badge shelf is empty — but not for long.</p>
                <p style={{ fontSize: "12px" }}>Click any badge to see what you need to do to earn it.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
