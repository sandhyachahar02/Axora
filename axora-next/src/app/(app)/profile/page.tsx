"use client";

import { useEffect, useState } from "react";
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [proofs, setProofs] = useState<Record<string, ProofRecord>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [modalBadge, setModalBadge] = useState<BadgeType | null>(null);

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
    if (!proof) return { label: "AUTO", color: "#635BFF", bg: "rgba(99,91,255,0.15)" };
    if (proof.status === "verified") return { label: "✓ VERIFIED", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    if (proof.status === "rejected") return { label: "✗ REJECTED", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    return { label: "⏳ PENDING", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  };

  if (loading) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading profile...</div>;
  if (!profile) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Profile not found.</div>;

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Modal */}
      {modalBadge && (
        <BadgeProofModal
          badge={BADGE_DEFINITIONS[modalBadge]}
          existingProof={proofs[modalBadge] ?? null}
          onClose={() => setModalBadge(null)}
          onSubmitted={() => { loadData(); }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{
          fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px",
        }}>
          My Profile
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          Skill Portfolio
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "6px" }}>
          Your verifiable reputation built from real actions on Axora
        </p>
      </div>

      {/* Profile card */}
      <div style={{
        background: "rgba(255,255,255,0.032)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
        padding: "28px", marginBottom: "20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "linear-gradient(135deg, #635BFF, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 700, color: "#fff", flexShrink: 0,
            boxShadow: "0 0 24px rgba(99,91,255,0.4)",
          }}>
            {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
              {profile.full_name}
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.45)", marginTop: "2px" }}>
              {profile.role}
            </p>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              {earnedBadges.slice(0, 4).map(bt => {
                const b = BADGE_DEFINITIONS[bt];
                const proof = proofs[bt];
                return (
                  <span key={bt} style={{
                    fontSize: "16px",
                    filter: `drop-shadow(0 0 6px ${b.glow})`,
                    cursor: "pointer",
                    position: "relative",
                  }}
                    title={`${b.label} ${proof?.status === "verified" ? "✓ Verified" : proof ? "⏳ Pending" : ""}`}
                    onClick={() => setModalBadge(bt)}
                  >
                    {b.symbol}
                    {proof?.status === "verified" && (
                      <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        fontSize: "8px", color: "#22c55e",
                      }}>✓</span>
                    )}
                  </span>
                );
              })}
              {earnedBadges.length > 4 && (
                <span style={{ fontSize: "11px", color: "rgba(230,230,230,0.35)", alignSelf: "center" }}>
                  +{earnedBadges.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p style={{
            fontSize: "14px", color: "rgba(230,230,230,0.5)", lineHeight: 1.65,
            marginBottom: "20px", paddingBottom: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {profile.bio}
          </p>
        )}

        <div style={{ marginBottom: "20px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(230,230,230,0.3)", marginBottom: "10px",
          }}>
            Skills
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {(profile.skills ?? []).map(skill => (
              <span key={skill} style={{
                background: "rgba(99,91,255,0.14)", border: "1px solid rgba(99,91,255,0.3)",
                color: "#a89fff", borderRadius: "999px", padding: "4px 12px", fontSize: "12.5px",
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer" style={{
              padding: "7px 14px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
              fontSize: "13px", color: "rgba(230,230,230,0.6)", textDecoration: "none",
            }}>
              GitHub ↗
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{
              padding: "7px 14px", background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px",
              fontSize: "13px", color: "rgba(59,130,246,0.8)", textDecoration: "none",
            }}>
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      {/* Badges card */}
      <div style={{
        background: "rgba(255,255,255,0.032)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
        padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>
              Reputation Badges
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.3)", marginTop: "4px" }}>
              Click any badge to submit proof and get verified
            </p>
          </div>
          <div style={{
            background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)",
            borderRadius: "999px", padding: "5px 16px",
            fontSize: "13px", fontWeight: 700, color: "#a89fff",
          }}>
            {earnedBadges.length}/{allBadges.length} Earned
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "14px",
        }}>
          {allBadges.map(badge => {
            const isEarned = earnedBadges.includes(badge.type);
            const isHovered = hoveredBadge === badge.type;
            const statusBadge = getStatusBadge(badge.type);

            return (
              <div
                key={badge.type}
                onMouseEnter={() => setHoveredBadge(badge.type)}
                onMouseLeave={() => setHoveredBadge(null)}
                onClick={() => setModalBadge(badge.type)}
                style={{
                  padding: "20px",
                  background: isEarned ? badge.glow.replace("0.4", "0.08") : "rgba(255,255,255,0.02)",
                  border: isEarned
                    ? `1px solid ${badge.glow.replace("0.4", "0.3")}`
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                  boxShadow: isEarned && isHovered
                    ? `0 8px 32px ${badge.glow}`
                    : isEarned ? `0 4px 16px ${badge.glow.replace("0.4", "0.2")}` : "none",
                  filter: isEarned ? "none" : "grayscale(0.7)",
                  opacity: isEarned ? 1 : 0.55,
                  cursor: "pointer",
                }}
              >
                {/* Top gradient bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: isEarned ? badge.gradient : "rgba(255,255,255,0.08)",
                  opacity: isEarned ? 1 : 0.4,
                }} />

                {/* Tier + status row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 800,
                    color: isEarned ? TIER_COLORS[badge.tier] : "rgba(230,230,230,0.2)",
                    background: isEarned ? `${TIER_COLORS[badge.tier]}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isEarned ? TIER_COLORS[badge.tier] + "40" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.08em",
                  }}>
                    {isEarned ? TIER_LABELS[badge.tier] : "LOCKED"}
                  </span>

                  {statusBadge && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700,
                      color: statusBadge.color,
                      background: statusBadge.bg,
                      border: `1px solid ${statusBadge.color}40`,
                      borderRadius: "4px", padding: "2px 6px",
                    }}>
                      {statusBadge.label}
                    </span>
                  )}
                </div>

                {/* Symbol */}
                <div style={{
                  fontSize: "36px", marginBottom: "12px",
                  filter: isEarned ? `drop-shadow(0 0 10px ${badge.glow})` : "none",
                  transition: "filter 0.2s",
                }}>
                  {badge.symbol}
                </div>

                <div style={{
                  fontSize: "14px", fontWeight: 700,
                  color: isEarned ? "#fff" : "rgba(230,230,230,0.4)",
                  letterSpacing: "-0.2px", marginBottom: "4px",
                }}>
                  {badge.label}
                </div>
                <div style={{
                  fontSize: "11px", fontWeight: 500,
                  color: isEarned ? badge.glow.replace("rgba(", "rgba(").replace(", 0.4)", ", 0.7)") : "rgba(230,230,230,0.25)",
                  marginBottom: "10px", fontStyle: "italic",
                }}>
                  {badge.tagline}
                </div>

                <p style={{
                  fontSize: "12px",
                  color: isEarned ? "rgba(230,230,230,0.45)" : "rgba(230,230,230,0.3)",
                  lineHeight: 1.55, margin: 0,
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {isEarned ? badge.description : badge.motivation}
                </p>

                {/* Click to prove CTA */}
                <div style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  color: isEarned
                    ? proofs[badge.type]?.status === "verified"
                      ? "#22c55e"
                      : "rgba(99,91,255,0.7)"
                    : "rgba(230,230,230,0.25)",
                  textAlign: "center",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {isEarned
                    ? proofs[badge.type]?.status === "verified"
                      ? "✓ Proof verified"
                      : proofs[badge.type]
                      ? "⏳ View submitted proof"
                      : "→ Submit proof to get verified"
                    : "→ Click to earn this badge"
                  }
                </div>
              </div>
            );
          })}
        </div>

        {earnedBadges.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "rgba(230,230,230,0.25)", fontSize: "14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏆</div>
            <p>Your badge shelf is empty — but not for long.</p>
            <p style={{ marginTop: "6px", fontSize: "12px" }}>
              Click any badge to see what you need to do to earn it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
