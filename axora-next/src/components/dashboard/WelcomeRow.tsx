"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/Button";

export function WelcomeRow() {
  const [userName, setUserName] = useState<string | null>(null);

useEffect(() => {
  const getUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile?.full_name) {
      setUserName(profile.full_name.split(" ")[0]); // shows first name only
    } else {
      setUserName(session.user.email?.split("@")[0] ?? null);
    }
  };
  getUser();
}, []);

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-text-muted mb-1">Good morning</p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          Welcome back, <span className="text-primary">{userName ?? "..."}</span> 👋
        </h1>
      </div>
      <Button variant="ghost">View all activity</Button>
    </div>
  );
}
