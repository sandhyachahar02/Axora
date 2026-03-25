"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

type Project = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  team_size: number;
  creator_name: string;
  creator_id?: string;
};

const STATIC_PROJECTS: Project[] = [
  {
    id: "s1",
    title: "AI Study Buddy App",
    description: "Build an AI-powered study assistant that personalizes learning paths for students based on their strengths and weaknesses.",
    skills: ["React", "Python", "NLP", "Supabase"],
    difficulty: "Intermediate",
    team_size: 3,
    creator_name: "Sandhya C.",
  },
  {
    id: "s2",
    title: "Freelance Marketplace MVP",
    description: "A minimal marketplace connecting student freelancers with small businesses. Includes profiles, gigs, and a basic escrow system.",
    skills: ["Next.js", "Node.js", "PostgreSQL", "Stripe"],
    difficulty: "Advanced",
    team_size: 4,
    creator_name: "Arjun M.",
  },
  {
    id: "s3",
    title: "Campus Event Hub",
    description: "A unified platform for college events, hackathons, and club activities with RSVP, reminders, and team formation.",
    skills: ["React", "Firebase", "UI/UX", "Figma"],
    difficulty: "Beginner",
    team_size: 2,
    creator_name: "Priya S.",
  },
  {
    id: "s4",
    title: "Open Source Contribution Tracker",
    description: "Track and visualize your open source contributions across GitHub repos. Build your developer reputation automatically.",
    skills: ["TypeScript", "GitHub API", "D3.js", "MongoDB"],
    difficulty: "Intermediate",
    team_size: 3,
    creator_name: "Lucas K.",
  },
  {
    id: "s5",
    title: "Mental Health Check-in Bot",
    description: "A Telegram/WhatsApp bot that helps students track their mental health daily with AI-powered suggestions and resources.",
    skills: ["Python", "Telegram API", "NLP", "MongoDB"],
    difficulty: "Beginner",
    team_size: 2,
    creator_name: "Aisha P.",
  },
  {
    id: "s6",
    title: "Real-time Code Collaboration Tool",
    description: "Like Google Docs but for code. Real-time collaborative coding with syntax highlighting, chat, and video integration.",
    skills: ["WebSockets", "React", "Node.js", "WebRTC"],
    difficulty: "Advanced",
    team_size: 4,
    creator_name: "Omar H.",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
};

export default function DiscoverPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");

  const [form, setForm] = useState({
    title: "",
    description: "",
    skillInput: "",
    skills: [] as string[],
    difficulty: "Intermediate",
    team_size: 2,
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("skills, full_name")
          .eq("id", session.user.id)
          .single();
        setUserSkills(profile?.skills ?? []);
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setProjects(data);
      } else {
        setProjects(STATIC_PROJECTS);
        setUsingFallback(true);
      }

      setLoading(false);
    };
    load();
  }, []);

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && form.skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(form.skillInput.trim())) {
        setForm(f => ({ ...f, skills: [...f.skills, f.skillInput.trim()], skillInput: "" }));
      } else {
        setForm(f => ({ ...f, skillInput: "" }));
      }
    }
  };

  const handlePost = async () => {
    if (!form.title) { alert("Title is required."); return; }
    if (form.skills.length === 0) { alert("Add at least one skill."); return; }

    setPosting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("You must be logged in."); setPosting(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    const { data, error } = await supabase.from("projects").insert({
      title: form.title,
      description: form.description,
      skills: form.skills,
      difficulty: form.difficulty,
      team_size: form.team_size,
      creator_id: session.user.id,
      creator_name: profile?.full_name ?? session.user.email?.split("@")[0],
    }).select().single();

    setPosting(false);

    if (error) { alert(error.message); return; }

    setProjects(prev => [data, ...prev]);
    setUsingFallback(false);
    setShowForm(false);
    setForm({ title: "", description: "", skillInput: "", skills: [], difficulty: "Intermediate", team_size: 2 });
  };

  const filtered = filter === "All"
    ? projects
    : projects.filter(p => p.difficulty === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{
            fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px",
          }}>
            Project Discovery
          </p>
          <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
            Find Your Next Project
          </h1>
          {/* ✅ FIX: use currentColor-safe muted text instead of rgba(230,230,230,x) */}
          <p style={{ fontSize: "14px", color: "var(--muted-foreground, #6b7280)", marginTop: "6px" }}>
            Browse open projects and find teammates to build with
            {usingFallback && (
              <span style={{
                marginLeft: "10px", fontSize: "11px", color: "rgba(245,158,11,0.9)",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "999px", padding: "2px 8px",
              }}>
                Sample data
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #635BFF 0%, #3B82F6 100%)",
            border: "none", borderRadius: "10px", color: "#fff",
            fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(99,91,255,0.35)",
            fontFamily: "var(--font-dm-sans)",
            transition: "all 0.18s",
          }}
        >
          {showForm ? "Cancel" : "+ Post a Project"}
        </button>
      </div>

      {/* Post Project Form */}
      {showForm && (
        <div style={{
          // ✅ FIX: theme-aware card background
          background: "var(--card, rgba(255,255,255,0.85))",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border, rgba(99,91,255,0.2))",
          borderRadius: "16px",
          padding: "28px", marginBottom: "28px",
          boxShadow: "0 8px 32px rgba(99,91,255,0.1)",
        }}>
          {/* ✅ FIX: use foreground color */}
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground, #111)", marginBottom: "20px" }}>
            Post a New Project
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--muted-foreground, #6b7280)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Project Title *
              </label>
              <input
                type="text"
                placeholder="e.g. AI Study Buddy App"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{
                  // ✅ FIX: theme-aware input
                  background: "var(--input, rgba(0,0,0,0.04))",
                  border: "1px solid var(--border, rgba(0,0,0,0.12))",
                  borderRadius: "10px", padding: "11px 14px",
                  color: "var(--foreground, #111)",
                  fontSize: "14px", outline: "none", width: "100%", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--muted-foreground, #6b7280)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Description
              </label>
              <textarea
                placeholder="What are you building? What problem does it solve?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{
                  background: "var(--input, rgba(0,0,0,0.04))",
                  border: "1px solid var(--border, rgba(0,0,0,0.12))",
                  borderRadius: "10px", padding: "11px 14px",
                  color: "var(--foreground, #111)",
                  fontSize: "14px", outline: "none", width: "100%",
                  resize: "none", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Skills */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--muted-foreground, #6b7280)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Required Skills (press Enter to add) *
              </label>
              <input
                type="text"
                placeholder="e.g. React, Python, Figma"
                value={form.skillInput}
                onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
                onKeyDown={addSkill}
                style={{
                  background: "var(--input, rgba(0,0,0,0.04))",
                  border: "1px solid var(--border, rgba(0,0,0,0.12))",
                  borderRadius: "10px", padding: "11px 14px",
                  color: "var(--foreground, #111)",
                  fontSize: "14px", outline: "none", width: "100%", fontFamily: "inherit",
                }}
              />
              {form.skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {form.skills.map(s => (
                    <span
                      key={s}
                      onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))}
                      style={{
                        background: "rgba(99,91,255,0.14)", border: "1px solid rgba(99,91,255,0.3)",
                        color: "#635BFF", borderRadius: "999px", padding: "3px 10px",
                        fontSize: "12px", cursor: "pointer",
                      }}
                    >
                      {s} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty + Team Size */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                <label style={{ fontSize: "11.5px", color: "var(--muted-foreground, #6b7280)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Difficulty
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Beginner", "Intermediate", "Advanced"].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                      style={{
                        flex: 1, padding: "8px",
                        borderRadius: "8px",
                        border: form.difficulty === d
                          ? `1px solid ${DIFFICULTY_COLORS[d]}60`
                          : "1px solid var(--border, rgba(0,0,0,0.12))",
                        background: form.difficulty === d
                          ? `${DIFFICULTY_COLORS[d]}15`
                          : "var(--input, rgba(0,0,0,0.04))",
                        color: form.difficulty === d
                          ? DIFFICULTY_COLORS[d]
                          : "var(--muted-foreground, #6b7280)",
                        fontSize: "12px", fontWeight: 500, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "120px" }}>
                <label style={{ fontSize: "11.5px", color: "var(--muted-foreground, #6b7280)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Team Size
                </label>
                <input
                  type="number"
                  min={1} max={10}
                  value={form.team_size}
                  onChange={e => setForm(f => ({ ...f, team_size: Number(e.target.value) }))}
                  style={{
                    background: "var(--input, rgba(0,0,0,0.04))",
                    border: "1px solid var(--border, rgba(0,0,0,0.12))",
                    borderRadius: "10px", padding: "11px 14px",
                    color: "var(--foreground, #111)",
                    fontSize: "14px", outline: "none", width: "100%", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handlePost}
              disabled={posting}
              style={{
                marginTop: "4px", padding: "12px",
                background: "linear-gradient(135deg, #635BFF 0%, #3B82F6 100%)",
                border: "none", borderRadius: "10px", color: "#fff",
                fontSize: "14px", fontWeight: 600, cursor: posting ? "not-allowed" : "pointer",
                opacity: posting ? 0.65 : 1, fontFamily: "inherit",
              }}
            >
              {posting ? "Posting..." : "Post Project →"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {["All", "Beginner", "Intermediate", "Advanced"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: "999px",
              // ✅ FIX: theme-aware filter tabs
              border: filter === f
                ? "1px solid rgba(99,91,255,0.5)"
                : "1px solid var(--border, rgba(0,0,0,0.12))",
              background: filter === f
                ? "rgba(99,91,255,0.12)"
                : "transparent",
              color: filter === f
                ? "#635BFF"
                : "var(--muted-foreground, #6b7280)",
              fontSize: "13px", fontWeight: filter === f ? 500 : 400,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--muted-foreground, #6b7280)", alignSelf: "center" }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: "var(--card, rgba(0,0,0,0.04))",
              border: "1px solid var(--border, rgba(0,0,0,0.08))",
              borderRadius: "16px", height: "240px",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--muted-foreground, #6b7280)", fontSize: "14px" }}>
          No projects found. Be the first to post one!
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map(project => {
            const diffColor = DIFFICULTY_COLORS[project.difficulty] ?? "#635BFF";
            const matchingSkills = (project.skills ?? []).filter(s =>
              userSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
            );

            return (
              <div
                key={project.id}
                style={{
                  // ✅ FIX: theme-aware card
                  background: "var(--card, rgba(255,255,255,0.85))",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border, rgba(0,0,0,0.08))",
                  borderRadius: "16px",
                  padding: "22px", display: "flex", flexDirection: "column", gap: "14px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(99,91,255,0.15)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,91,255,0.35)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border, rgba(0,0,0,0.08))";
                }}
              >
                {/* Title + difficulty */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  {/* ✅ FIX: foreground color for title */}
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground, #111)", lineHeight: 1.3, margin: 0 }}>
                    {project.title}
                  </h3>
                  <span style={{
                    background: `${diffColor}18`,
                    border: `1px solid ${diffColor}50`,
                    borderRadius: "999px", padding: "3px 10px",
                    fontSize: "11px", fontWeight: 600, color: diffColor, whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {project.difficulty}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  // ✅ FIX: muted foreground for description
                  <p style={{ fontSize: "13px", color: "var(--muted-foreground, #6b7280)", lineHeight: 1.6, margin: 0 }}>
                    {project.description}
                  </p>
                )}

                {/* Skills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(project.skills ?? []).map(skill => {
                    const isMatch = matchingSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                    return (
                      <span key={skill} style={{
                        // ✅ FIX: non-matching skills now visible in light theme
                        background: isMatch
                          ? "rgba(99,91,255,0.12)"
                          : "var(--secondary, rgba(0,0,0,0.06))",
                        border: isMatch
                          ? "1px solid rgba(99,91,255,0.35)"
                          : "1px solid var(--border, rgba(0,0,0,0.1))",
                        color: isMatch
                          ? "#635BFF"
                          : "var(--muted-foreground, #6b7280)",
                        borderRadius: "999px", padding: "3px 10px", fontSize: "11.5px",
                        fontWeight: isMatch ? 600 : 400,
                      }}>
                        {skill}
                      </span>
                    );
                  })}
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* ✅ FIX: muted foreground for meta text */}
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground, #6b7280)" }}>
                    👤 {project.creator_name}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground, #6b7280)" }}>
                    👥 {project.team_size} members needed
                  </span>
                  {matchingSkills.length > 0 && (
                    <span style={{
                      marginLeft: "auto", fontSize: "11px", color: "#635BFF",
                      background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.25)",
                      borderRadius: "999px", padding: "2px 8px",
                    }}>
                      {matchingSkills.length} skill match
                    </span>
                  )}
                </div>

                {/* Apply button */}
                <button
                  style={{
                    width: "100%", padding: "10px",
                    background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.3)",
                    borderRadius: "10px", color: "#635BFF",
                    fontSize: "13.5px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.18s ease", fontFamily: "inherit",
                    marginTop: "2px",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,91,255,0.18)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,91,255,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,91,255,0.1)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,91,255,0.3)";
                  }}
                  onClick={() => alert(`Applied to "${project.title}"! The creator will be notified.`)}
                >
                  Apply / Join →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
