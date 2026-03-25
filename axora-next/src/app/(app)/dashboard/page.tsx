"use client";

import { WelcomeRow } from "@/components/dashboard/WelcomeRow";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { MatchSection } from "@/components/dashboard/MatchSection";
import { BadgesSection } from "@/components/dashboard/BadgesSection";

export default function DashboardPage() {
  return (
    <>
      <WelcomeRow />
      <StatsGrid />
      <ActivityCard />
      <TasksCard />
      <MatchSection />
      <BadgesSection />
    </>
  );
}