"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { Profile } from "@/lib/matching";

export default function MatchPage() {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get current user skills for highlighting
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", session.user.id)
        .single();

      setCurrentUserSkills(myProfile?.skills ?? []);

      // Call FastAPI AI matching endpoint
      const res = await fetch("http://localhost:8000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id }),
      });

      if (!res.ok) { setLoading(false); return; }

      const data = await res.json();
      setMatches(data);
      setLoading(false);
    };

    fetchMatches();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", color: "rgba(99,91,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          AI Powered
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          Teammate Matches
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "6px" }}>
          Ranked by NLP skill compatibility — shared skills highlighted in purple.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Finding matches...</p>
      ) : matches.length === 0 ? (
        <p style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>
          No matches yet. More users will appear as they join.
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}>
          {matches.map((profile) => (
            <MatchCard
              key={profile.id}
              profile={profile}
              currentUserSkills={currentUserSkills}
            />
          ))}
        </div>
      )}
    </div>
  );
}