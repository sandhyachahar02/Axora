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

export function BadgesSection() {
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      await checkAndAwardBadges(supabase, session.user.id);

      const { data } = await supabase
        .from("badges")
        .select("badge_type")
        .eq("user_id", session.user.id);

      setEarnedBadges(
        (data ?? []).map((b: { badge_type: string }) => b.badge_type as BadgeType)
      );
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  const allBadges = Object.values(BADGE_DEFINITIONS);
  const earned = allBadges.filter(b => earnedBadges.includes(b.type));
  const unearned = allBadges.filter(b => !earnedBadges.includes(b.type));

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>
            Reputation Badges
          </h2>
          <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.3)", marginTop: "3px" }}>
            Earn badges by taking action — they prove your skills are real
          </p>
        </div>
        <div style={{
          background: "rgba(99,91,255,0.12)",
          border: "1px solid rgba(99,91,255,0.25)",
          borderRadius: "999px",
          padding: "4px 14px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#a89fff",
        }}>
          {earnedBadges.length} / {allBadges.length} earned
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          {earned.map(badge => (
            <div
              key={badge.type}
              title={badge.description}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                background: badge.glow.replace("0.4", "0.08"),
                border: `1px solid ${badge.glow.replace("0.4", "0.35")}`,
                borderRadius: "12px",
                boxShadow: `0 0 18px ${badge.glow}`,
                cursor: "default",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Gradient shimmer line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "1px",
                background: badge.gradient,
                opacity: 0.6,
              }} />

              <span style={{
                fontSize: "20px",
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))",
              }}>
                {badge.symbol}
              </span>

              <div>
                <div style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.2px",
                }}>
                  {badge.label}
                </div>
                <div style={{
                  fontSize: "10px",
                  color: "rgba(230,230,230,0.4)",
                  marginTop: "1px",
                }}>
                  {badge.tagline}
                </div>
              </div>

              {/* Tier label */}
              <span style={{
                fontSize: "9px",
                fontWeight: 800,
                color: TIER_COLORS[badge.tier],
                background: `${TIER_COLORS[badge.tier]}18`,
                border: `1px solid ${TIER_COLORS[badge.tier]}40`,
                borderRadius: "4px",
                padding: "2px 5px",
                letterSpacing: "0.08em",
              }}>
                {TIER_LABELS[badge.tier]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Unearned badges — greyed out with motivation */}
      {unearned.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {unearned.map(badge => (
            <div
              key={badge.type}
              title={badge.motivation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                opacity: 0.5,
                cursor: "default",
                filter: "grayscale(0.8)",
              }}
            >
              <span style={{ fontSize: "16px" }}>{badge.symbol}</span>
              <div style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(230,230,230,0.4)",
              }}>
                {badge.label}
              </div>
              <span style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "rgba(230,230,230,0.25)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "4px",
                padding: "2px 5px",
                letterSpacing: "0.06em",
              }}>
                LOCKED
              </span>
            </div>
          ))}
        </div>
      )}

      {earnedBadges.length === 0 && (
        <p style={{
          fontSize: "13px",
          color: "rgba(230,230,230,0.25)",
          marginTop: "12px",
          fontStyle: "italic",
        }}>
          Your badge shelf is empty — add skills, post a project, or connect GitHub to start earning.
        </p>
      )}
    </div>
  );
}
