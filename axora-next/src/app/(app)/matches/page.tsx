"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

type MatchProfile = {
  id: string;
  full_name: string;
  role: string;
  skills: string[];
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  match_score: number;
  reason: string;
};

const STATIC_FALLBACK: MatchProfile[] = [
  {
    id: "static-1",
    full_name: "Sarah Chen",
    role: "UI/UX Designer",
    skills: ["Figma", "UX", "Design Systems", "Prototyping"],
    bio: "Passionate about building beautiful and accessible products.",
    match_score: 92,
    reason: "Strong complementary skills with your frontend expertise",
    github_url: "",
    linkedin_url: "",
  },
  {
    id: "static-2",
    full_name: "Arjun Mehta",
    role: "Backend Developer",
    skills: ["Node.js", "MongoDB", "APIs", "Python"],
    bio: "Building scalable systems for the next generation of startups.",
    match_score: 84,
    reason: "Shared interest in startups and scalable systems",
    github_url: "",
    linkedin_url: "",
  },
  {
    id: "static-3",
    full_name: "Priya Sharma",
    role: "ML Engineer",
    skills: ["Python", "TensorFlow", "NLP", "Data Science"],
    bio: "Turning data into intelligent products.",
    match_score: 78,
    reason: "Your AI interests align and your skills complement each other",
    github_url: "",
    linkedin_url: "",
  },
  {
    id: "static-4",
    full_name: "Lucas Kim",
    role: "Full Stack Developer",
    skills: ["React", "Next.js", "PostgreSQL", "Docker"],
    bio: "Love shipping fast and iterating faster.",
    match_score: 71,
    reason: "You share similar tech stacks and startup mindset",
    github_url: "",
    linkedin_url: "",
  },
  {
    id: "static-5",
    full_name: "Aisha Patel",
    role: "Product Manager",
    skills: ["Roadmapping", "Agile", "User Research", "Analytics"],
    bio: "Bridging the gap between users and engineering teams.",
    match_score: 65,
    reason: "Complementary roles — you build, they ship",
    github_url: "",
    linkedin_url: "",
  },
  {
    id: "static-6",
    full_name: "Omar Hassan",
    role: "DevOps Engineer",
    skills: ["AWS", "Kubernetes", "CI/CD", "Linux"],
    bio: "Making deployments boring (in the best way).",
    match_score: 58,
    reason: "Your product needs reliable infrastructure — perfect complement",
    github_url: "",
    linkedin_url: "",
  },
];

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMatches(STATIC_FALLBACK);
        setUsingFallback(true);
        setLoading(false);
        return;
      }

      // Get current user skills
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", session.user.id)
        .single();

      setCurrentUserSkills(myProfile?.skills ?? []);

      // Try FastAPI
      try {
        const res = await fetch("http://localhost:8000/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: session.user.id }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setMatches(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        console.warn("FastAPI offline — using static fallback");
      }

      // Fallback to static data
      setMatches(STATIC_FALLBACK);
      setUsingFallback(true);
      setLoading(false);
    };

    fetchMatches();
  }, []);

  const getScoreColor = (score: number) =>
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#635BFF";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(99,91,255,0.7)",
          marginBottom: "8px",
          fontFamily: "var(--font-dm-sans)",
        }}>
          AI Powered
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          Find Teammates
        </h1>
        <p style={{
          fontSize: "14px",
          color: "rgba(230,230,230,0.4)",
          marginTop: "6px",
        }}>
          AI-powered matches based on your skills and goals
          {usingFallback && (
            <span style={{
              marginLeft: "10px",
              fontSize: "11px",
              color: "rgba(245,158,11,0.7)",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "999px",
              padding: "2px 8px",
            }}>
              Sample data
            </span>
          )}
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "24px",
              height: "220px",
              animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}>
          {matches.map((profile) => {
            const scoreColor = getScoreColor(profile.match_score);
            const sharedSkills = (profile.skills ?? []).filter(s =>
              currentUserSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
            );

            return (
              <div
                key={profile.id}
                style={{
                  background: "rgba(255,255,255,0.032)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(99,91,255,0.15)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,91,255,0.25)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Avatar */}
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(99,91,255,0.3)",
                    }}>
                      {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", letterSpacing: "-0.2px" }}>
                        {profile.full_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(230,230,230,0.4)", marginTop: "2px" }}>
                        {profile.role}
                      </div>
                    </div>
                  </div>

                  {/* Match score */}
                  <div style={{
                    background: `${scoreColor}15`,
                    border: `1px solid ${scoreColor}40`,
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: scoreColor,
                    whiteSpace: "nowrap",
                  }}>
                    {profile.match_score}% Match
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p style={{
                    fontSize: "13px",
                    color: "rgba(230,230,230,0.35)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {profile.bio}
                  </p>
                )}

             {/* Skills */}
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
  {(profile.skills ?? []).map((skill) => {
    const isShared = sharedSkills
      .map(s => s.toLowerCase())
      .includes(skill.toLowerCase());
    return (
      <span key={skill} className={isShared ? "skill-tag-shared" : "skill-tag"}>
        {skill}
      </span>
    );
  })}
</div>

                {/* Reason */}
                <p style={{
                  fontSize: "12px",
                  color: "rgba(230,230,230,0.28)",
                  lineHeight: 1.55,
                  fontStyle: "italic",
                  margin: 0,
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {profile.reason}
                </p>

                {/* Links + Button row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" style={{
                        fontSize: "12px",
                        color: "rgba(99,91,255,0.75)",
                        textDecoration: "none",
                      }}>
                        GitHub ↗
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{
                        fontSize: "12px",
                        color: "rgba(59,130,246,0.75)",
                        textDecoration: "none",
                      }}>
                        LinkedIn ↗
                      </a>
                    )}
                  </div>

                  {/* View Profile button */}
                  <button style={{
                    padding: "7px 16px",
                    background: "rgba(99,91,255,0.12)",
                    border: "1px solid rgba(99,91,255,0.25)",
                    borderRadius: "8px",
                    color: "#a89fff",
                    fontSize: "12.5px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,91,255,0.22)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,91,255,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,91,255,0.12)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,91,255,0.25)";
                  }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
