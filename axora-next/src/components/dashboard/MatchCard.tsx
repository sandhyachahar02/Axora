"use client";

import Link from "next/link";
import { Profile } from "@/lib/matching";

type Props = {
  profile: Profile;
  currentUserSkills: string[];
};

export function MatchCard({ profile, currentUserSkills }: Props) {
  const score = profile.match_score ?? 0;

  const scoreColor =
    score >= 70 ? "#22c55e" :
    score >= 40 ? "#f59e0b" :
    "#635BFF";

  return (
    <div style={{
      background: "#0d0d12",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      transition: "border-color 0.2s",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: "linear-gradient(135deg, #635BFF, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(230,230,230,0.4)", marginTop: "2px" }}>
              {profile.role}
            </div>
          </div>
        </div>

        <div style={{
          background: `${scoreColor}18`,
          border: `1px solid ${scoreColor}44`,
          borderRadius: "999px", padding: "4px 12px",
          fontSize: "12px", fontWeight: 600, color: scoreColor,
        }}>
          {score}% match
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.38)", lineHeight: 1.6, margin: 0 }}>
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {profile.skills?.map((skill) => {
          const isShared = currentUserSkills
            .map((s) => s.toLowerCase())
            .includes(skill.toLowerCase());
          return (
            <span key={skill} style={{
              background: isShared ? "rgba(99,91,255,0.14)" : "rgba(255,255,255,0.05)",
              border: isShared ? "1px solid rgba(99,91,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: isShared ? "#a89fff" : "rgba(230,230,230,0.45)",
              borderRadius: "999px", padding: "3px 10px", fontSize: "11.5px",
            }}>
              {skill}
            </span>
          );
        })}
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
        {profile.github_url && (
          <a href={profile.github_url} target="_blank" rel="noreferrer" style={{
            fontSize: "12px", color: "rgba(99,91,255,0.8)", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            GitHub ↗
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{
            fontSize: "12px", color: "rgba(59,130,246,0.8)", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            LinkedIn ↗
          </a>
        )}
      </div>

      {/* Reason */}
      {profile.reason && (
        <p style={{
          fontSize: "11.5px", color: "rgba(230,230,230,0.3)", lineHeight: 1.5,
          fontStyle: "italic", marginTop: "4px",
          borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px",
        }}>
          {profile.reason}
        </p>
      )}

      {/* View Profile button — links to /profile/[id] */}
      <Link
        href={`/user/${profile.id}`}
        style={{
          display: "block", textAlign: "center",
          padding: "8px",
          background: "rgba(99,91,255,0.1)",
          border: "1px solid rgba(99,91,255,0.22)",
          borderRadius: "9px",
          fontSize: "12.5px", fontWeight: 500,
          color: "#a89fff", textDecoration: "none",
          transition: "all 0.15s",
          marginTop: "2px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,91,255,0.18)";
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(99,91,255,0.4)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,91,255,0.1)";
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(99,91,255,0.22)";
        }}
      >
        View Profile →
      </Link>
    </div>
  );
}
