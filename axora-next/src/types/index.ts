// ── Navigation ──────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

// ── Stats ───────────────────────────────────────────────────
export interface Stat {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  delta: string;
  color: "purple" | "blue" | "green" | "pink";
}

// ── Activity ────────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  content: string;
  time: string;
  icon: string;
  iconColor?: string;
}

// ── Tasks ───────────────────────────────────────────────────
export interface Task {
  id: string;
  label: string;
  done: boolean;
  tag: string;
  tagColor: "purple" | "blue" | "green";
}

// ── Features ────────────────────────────────────────────────
export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: "purple" | "blue" | "pink";
}

// ── Steps ───────────────────────────────────────────────────
export interface Step {
  number: string;
  title: string;
  description: string;
}

// ── Testimonials ────────────────────────────────────────────
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

// ── Kanban ──────────────────────────────────────────────────
export interface KanbanCard {
  id: string;
  title: string;
  label: string;
}
export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

// ── Teams ───────────────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  memberCount: number;
  avatarColors: string[];
}

// ── Chat ────────────────────────────────────────────────────
export interface ChatChannel {
  id: string;
  name: string;
  unread?: number;
}
export interface ChatMessage {
  id: string;
  author: string;
  initials: string;
  avatarGradient: string;
  text: string;
  time: string;
}
