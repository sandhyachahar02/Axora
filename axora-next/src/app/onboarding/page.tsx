"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

const ROLES = ["Student", "Freelancer", "Developer"];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    if (!fullName) { alert("Full name is required."); return; }
    if (!role) { alert("Please select a role."); return; }
    if (skills.length === 0) { alert("Add at least one skill."); return; }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { error } = await supabase.from("profiles").insert({
      id: session.user.id,
      full_name: fullName,
      role,
      skills,
      bio,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
    });

    setLoading(false);

    if (error) { alert(error.message); return; }

    window.location.href = "/dashboard";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        background: "#0d0d12",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "40px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.65)", marginBottom: "10px" }}>
            Step 1 of 1
          </p>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", letterSpacing: "-0.6px", marginBottom: "6px" }}>
            Set up your profile
          </h1>
          <p style={{ fontSize: "13.5px", color: "rgba(230,230,230,0.32)" }}>
            Help us match you with the right teammates and projects.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Full Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: "#f0f0f0",
                fontSize: "14px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          {/* Role */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Role
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "10px",
                    border: role === r ? "1px solid rgba(99,91,255,0.6)" : "1px solid rgba(255,255,255,0.09)",
                    background: role === r ? "rgba(99,91,255,0.14)" : "rgba(255,255,255,0.04)",
                    color: role === r ? "#a89fff" : "rgba(230,230,230,0.5)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Skills (press Enter to add)
            </label>
            <input
              type="text"
              placeholder="e.g. React, Python, UI Design"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={addSkill}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: "#f0f0f0",
                fontSize: "14px",
                outline: "none",
                width: "100%",
              }}
            />
            {skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: "rgba(99,91,255,0.14)",
                      border: "1px solid rgba(99,91,255,0.3)",
                      color: "#a89fff",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Bio (optional)
            </label>
            <textarea
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: "#f0f0f0",
                fontSize: "14px",
                outline: "none",
                width: "100%",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* GitHub */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              GitHub URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: "#f0f0f0",
                fontSize: "14px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          {/* LinkedIn */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "rgba(230,230,230,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              LinkedIn URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: "#f0f0f0",
                fontSize: "14px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "11px",
              background: "linear-gradient(135deg, #635BFF 0%, #3B82F6 100%)",
              color: "#fff",
              fontSize: "14.5px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.65 : 1,
              transition: "all 0.18s",
            }}
          >
            {loading ? "Saving..." : "Complete Setup →"}
          </button>
        </div>
      </div>
    </div>
  );
}