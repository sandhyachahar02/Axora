"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { Profile } from "@/lib/matching";
import Link from "next/link";

export function MatchSection() {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Get current user skills for highlighting
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", session.user.id)
        .single();

      setCurrentUserSkills(myProfile?.skills ?? []);

      // Call FastAPI AI matching endpoint
      try {
        const res = await fetch("http://localhost:8000/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: session.user.id }),
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setMatches(data.slice(0, 3));
      } catch (err) {
        // FastAPI not running — fail silently
        console.warn("AI matching server offline");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return null;
  if (matches.length === 0) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>
          AI Teammate Matches
        </h2>
        <Link href="/match" style={{ fontSize: "13px", color: "rgba(99,91,255,0.8)", textDecoration: "none" }}>
          View all →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {matches.map((profile) => (
          <MatchCard key={profile.id} profile={profile} currentUserSkills={currentUserSkills} />
        ))}
      </div>
    </div>
  );
}
