import { createBrowserClient } from "@supabase/ssr";

export type BadgeType =
  | "project_contributor"
  | "team_player"
  | "ai_enthusiast"
  | "open_source_hero"
  | "startup_builder"
  | "top_matcher";

export type Badge = {
  type: BadgeType;
  label: string;
  symbol: string;
  tagline: string;
  description: string;
  motivation: string;
  gradient: string;
  glow: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
};

export const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
  ai_enthusiast: {
    type: "ai_enthusiast",
    label: "AI Visionary",
    symbol: "🧠",
    tagline: "Thinking Beyond Human",
    description: "Awarded to builders who embrace AI and ML in their skill set.",
    motivation: "Add AI, ML, or NLP to your skills to unlock this rare badge. Only the forward-thinkers earn it.",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 50%, #3B82F6 100%)",
    glow: "rgba(139,92,246,0.4)",
    tier: "gold",
  },
  open_source_hero: {
    type: "open_source_hero",
    label: "Open Source Hero",
    symbol: "⚡",
    tagline: "Code That Changes the World",
    description: "For builders who share their work openly with the world via GitHub.",
    motivation: "Add your GitHub profile to prove your work is real and open. The world deserves to see what you build.",
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    glow: "rgba(34,197,94,0.4)",
    tier: "silver",
  },
  project_contributor: {
    type: "project_contributor",
    label: "Project Founder",
    symbol: "📡",
    tagline: "Ideas Into Reality",
    description: "You didn't just dream — you built and shared. Posted a real project on Axora.",
    motivation: "Post your first project on the Discover page. Every great product started as a single post.",
    gradient: "linear-gradient(135deg, #635BFF 0%, #3B82F6 100%)",
    glow: "rgba(99,91,255,0.4)",
    tier: "silver",
  },
  startup_builder: {
    type: "startup_builder",
    label: "Startup Architect",
    symbol: "🚀",
    tagline: "Building the Next Big Thing",
    description: "For the dreamers chasing startup life. Interests include building companies from scratch.",
    motivation: "Add Startups to your interests in your profile. Show the world you're here to build empires.",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    glow: "rgba(245,158,11,0.4)",
    tier: "gold",
  },
  top_matcher: {
    type: "top_matcher",
    label: "Skill Magnet",
    symbol: "✦",
    tagline: "Everyone Wants to Work With You",
    description: "Your profile is stacked. 3+ skills means you're a serious collaborator worth finding.",
    motivation: "Add at least 3 skills to your profile. The more you know, the more doors open.",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8B5CF6 100%)",
    glow: "rgba(236,72,153,0.4)",
    tier: "platinum",
  },
  team_player: {
    type: "team_player",
    label: "Team Catalyst",
    symbol: "🤝",
    tagline: "Stronger Together",
    description: "You understand that the best products are built by great teams, not lone wolves.",
    motivation: "Apply to join projects on the Discover page. Collaboration is how legends are made.",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #06b6d4 100%)",
    glow: "rgba(59,130,246,0.4)",
    tier: "bronze",
  },
};

export const TIER_LABELS: Record<string, string> = {
  bronze: "BRONZE",
  silver: "SILVER",
  gold: "GOLD",
  platinum: "PLATINUM",
};

export const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#94a3b8",
  gold: "#f59e0b",
  platinum: "#e2e8f0",
};

export async function awardBadgeIfEarned(
  supabase: ReturnType<typeof createBrowserClient>,
  userId: string,
  badgeType: BadgeType
) {
  try {
    await supabase.from("badges").insert({
      user_id: userId,
      badge_type: badgeType,
    });
  } catch {
    // Already earned — unique constraint prevents duplicates
  }
}

export async function checkAndAwardBadges(
  supabase: ReturnType<typeof createBrowserClient>,
  userId: string
) {
  // Get profile with skills, github, and interests
  const { data: profile } = await supabase
    .from("profiles")
    .select("skills, github_url, interests, bio")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const skills = (profile.skills ?? []).map((s: string) => s.toLowerCase());

  // ── AI Enthusiast — has AI/ML/NLP skills ──
  const aiSkills = ["ai", "ml", "nlp", "machine learning", "deep learning", "tensorflow", "pytorch", "data science", "artificial intelligence"];
  const hasAISkill = skills.some((s: string) => aiSkills.some(a => s.includes(a)));
  if (hasAISkill) await awardBadgeIfEarned(supabase, userId, "ai_enthusiast");

  // ── Open Source Hero — has GitHub URL ──
  if (profile.github_url) await awardBadgeIfEarned(supabase, userId, "open_source_hero");

  // ── Top Matcher — has 3+ skills ──
  if (skills.length >= 3) await awardBadgeIfEarned(supabase, userId, "top_matcher");

  // ── Project Contributor — posted at least 1 project ──
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("creator_id", userId)
    .limit(1);
  if (projects && projects.length > 0) {
    await awardBadgeIfEarned(supabase, userId, "project_contributor");
  }

  // ── Team Player — applied to at least 1 project (has sent a chat message or applied) ──
  // Check if user has posted any chat messages (proxy for team engagement)
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (messages && messages.length > 0) {
    await awardBadgeIfEarned(supabase, userId, "team_player");
  }

  // ── Startup Builder — bio or interests mention startups ──
  const startupKeywords = ["startup", "startups", "founder", "entrepreneur", "venture", "saas", "bootstrap"];
  const bioText = (profile.bio ?? "").toLowerCase();
  const interestText = ((profile.interests ?? []) as string[]).join(" ").toLowerCase();
  const hasStartupInterest = startupKeywords.some(k => bioText.includes(k) || interestText.includes(k));
  if (hasStartupInterest) await awardBadgeIfEarned(supabase, userId, "startup_builder");
}
