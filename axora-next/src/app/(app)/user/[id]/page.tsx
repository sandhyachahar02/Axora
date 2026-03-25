"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import { BADGE_DEFINITIONS, TIER_COLORS, TIER_LABELS, BadgeType } from "@/lib/badges";

type Profile = {
  id: string;
  full_name: string;
  role: string;
  skills: string[];
  bio: string;
  github_url: string;
  linkedin_url: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", userId).single();

      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setProfile(profileData);

      const { data: badgesData } = await supabase
        .from("badges").select("badge_type").eq("user_id", userId);
      setEarnedBadges((badgesData ?? []).map((b: { badge_type: string }) => b.badge_type as BadgeType));
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  if (loading) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading profile...</div>;
  if (notFound || !profile) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>User not found.</div>;

  const allBadges = Object.values(BADGE_DEFINITIONS);

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px" }}>
          Team Member
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          {profile.full_name}&apos;s Profile
        </h1>
      </div>

      {/* Profile card */}
      <div style={{
        background: "rgba(255,255,255,0.032)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
        padding: "28px", marginBottom: "16px",
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
            {/* Earned badge symbols */}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {earnedBadges.map(bt => (
                <span key={bt} style={{ fontSize: "16px" }} title={BADGE_DEFINITIONS[bt].label}>
                  {BADGE_DEFINITIONS[bt].symbol}
                </span>
              ))}
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

        {/* Skills */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(230,230,230,0.3)", marginBottom: "10px" }}>
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

        {/* Links */}
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

      {/* Badges */}
      <div style={{
        background: "rgba(255,255,255,0.032)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
        padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Reputation Badges</h2>
          <div style={{
            background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)",
            borderRadius: "999px", padding: "4px 14px",
            fontSize: "12px", fontWeight: 700, color: "#a89fff",
          }}>
            {earnedBadges.length}/{allBadges.length} Earned
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
          {allBadges.map(badge => {
            const isEarned = earnedBadges.includes(badge.type);
            return (
              <div key={badge.type} style={{
                padding: "16px",
                background: isEarned ? badge.glow.replace("0.4", "0.08") : "rgba(255,255,255,0.02)",
                border: isEarned ? `1px solid ${badge.glow.replace("0.4", "0.3")}` : "1px solid rgba(255,255,255,0.05)",
                borderRadius: "12px",
                opacity: isEarned ? 1 : 0.4,
                filter: isEarned ? "none" : "grayscale(0.8)",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: isEarned ? badge.gradient : "rgba(255,255,255,0.06)" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 800,
                    color: isEarned ? TIER_COLORS[badge.tier] : "rgba(230,230,230,0.2)",
                    background: isEarned ? `${TIER_COLORS[badge.tier]}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isEarned ? TIER_COLORS[badge.tier] + "40" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "4px", padding: "2px 5px", letterSpacing: "0.08em",
                  }}>
                    {isEarned ? TIER_LABELS[badge.tier] : "LOCKED"}
                  </span>
                  {isEarned && (
                    <span style={{ fontSize: "9px", color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "4px", padding: "1px 5px" }}>
                      ✓
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "28px", marginBottom: "8px", filter: isEarned ? `drop-shadow(0 0 8px ${badge.glow})` : "none" }}>
                  {badge.symbol}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: isEarned ? "#fff" : "rgba(230,230,230,0.3)", marginBottom: "3px" }}>
                  {badge.label}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(230,230,230,0.3)", lineHeight: 1.5 }}>
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
