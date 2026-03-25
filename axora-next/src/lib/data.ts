import type {
  Stat, ActivityItem, Task, Feature,
  Step, Testimonial, KanbanColumn, Team,
  ChatChannel, ChatMessage, NavItem,
} from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Discover", href: "/discover", icon: "grid" },
  { label: "AI Match",  href: "/match",     icon: "users" },
  { label: "Matches",  href: "/matches",   icon: "users" },  // ← add this
  { label: "Projects",  href: "/projects",  icon: "list" },
  { label: "Teams",     href: "/teams",     icon: "users" },
  { label: "Chat",      href: "/chat",      icon: "message", badge: 3 },
  { label: "Profile", href: "/profile", icon: "users" },
  { label: "Docs", href: "/docs", icon: "list" },
  { label: "Tasks", href: "/tasks", icon: "list" },
];
export const STATS: Stat[] = [
  { id: "projects", label: "Total Projects",    value: 24,  icon: "📁", delta: "↑ 3 this week", color: "purple" },
  { id: "members",  label: "Team Members",      value: 8,   icon: "👥", delta: "↑ 2 new",       color: "blue"   },
  { id: "tasks",    label: "Tasks Completed",   value: 142, icon: "✅", delta: "↑ 18 today",    color: "green"  },
  { id: "messages", label: "Messages",          value: 39,  icon: "💬", delta: "3 unread",       color: "pink"   },
];

export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: "1", icon: "✦", content: '<strong>Jordan</strong> completed "API Rate Limiting"', time: "2m ago" },
  { id: "2", icon: "💬", content: "<strong>Sam</strong> replied in #design-system",        time: "14m ago", iconColor: "rgba(63,208,255,0.1)" },
  { id: "3", icon: "📋", content: `New project <strong>"Axora v2"</strong> was created`, time: "1h ago",  iconColor: "rgba(52,211,153,0.1)" },
  { id: "4", icon: "✦", content: "<strong>Morgan</strong> joined the workspace",           time: "3h ago" },
];

export const TASKS: Task[] = [
  { id: "1", label: "Write API documentation",  done: true,  tag: "Done",    tagColor: "green"  },
  { id: "2", label: "Review design system PR",  done: false, tag: "Design",  tagColor: "purple" },
  { id: "3", label: "Finalize Q4 roadmap",      done: false, tag: "Planning",tagColor: "blue"   },
  { id: "4", label: "Sync with Growth team",    done: false, tag: "Meeting", tagColor: "purple" },
];

export const FEATURES: Feature[] = [
  { id: "1", icon: "🧠", title: "AI-Powered Insights",      color: "purple", description: "Get intelligent summaries, auto-generated tasks, and smart suggestions — all surfaced exactly when you need them."        },
  { id: "2", icon: "⚡", title: "Real-time Collaboration",  color: "blue",   description: "Co-edit documents, comment on tasks, and chat in context. Presence indicators show who's working on what, live."          },
  { id: "3", icon: "📋", title: "Unified Project Tracking", color: "purple", description: "Kanban, List, or Timeline — your way. Set priorities, track dependencies, and ship projects faster."                       },
  { id: "4", icon: "💬", title: "Contextual Messaging",     color: "blue",   description: "Conversations tied to tasks, projects, or docs. No more digging through Slack to find context. Everything, connected."     },
  { id: "5", icon: "🔗", title: "Deep Integrations",        color: "pink",   description: "Works natively with GitHub, Figma, Notion, and 80+ tools you already use. Zero workflow disruption."                       },
  { id: "6", icon: "🛡️", title: "Enterprise Security",      color: "purple", description: "SOC 2 Type II, SSO, granular permissions, and audit logs. Built for teams that take security seriously."                    },
];

export const STEPS: Step[] = [
  { number: "01", title: "Create your workspace",  description: "Sign up and invite your team in under 60 seconds. Axora auto-imports your existing projects from Notion, Linear, or Jira — no manual migration needed." },
  { number: "02", title: "Let AI set the stage",   description: "Our AI analyzes your team structure and automatically creates projects, suggests task breakdowns, and surfaces blockers before they become problems."     },
  { number: "03", title: "Ship, together",          description: "Collaborate in real-time with your team. Track progress, resolve blockers, celebrate wins — all in one calm, focused environment."                      },
];

export const TESTIMONIALS: Testimonial[] = [
  { id: "1", initials: "SC", name: "Sarah Chen",    role: "CTO at Vercel-style Startup", gradient: "linear-gradient(135deg,#635BFF,#3FD0FF)", quote: "Axora replaced five tools we were paying for. The AI integrations are genuinely useful, not just a marketing bullet point. Our team ships 30% faster now." },
  { id: "2", initials: "MK", name: "Marcus Kim",    role: "Head of Product at Loom",     gradient: "linear-gradient(135deg,#FF5C8A,#635BFF)", quote: "The design is so clean it's almost unfair. My team actually enjoys using it — which has never happened with project management software before."        },
  { id: "3", initials: "RT", name: "Rachel Torres", role: "Engineering Lead at Stripe",  gradient: "linear-gradient(135deg,#34d399,#3FD0FF)", quote: "We evaluated Linear, Notion, and Asana. Axora beat all three on UX. The contextual chat alone has reduced our Slack usage by 60%."                   },
];

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "backlog",     title: "Backlog",     cards: [{ id: "k1", title: "User auth flow",    label: "Design"  }, { id: "k2", title: "API rate limiting", label: "Backend" }] },
  { id: "inprogress",  title: "In Progress", cards: [{ id: "k3", title: "Dashboard redesign", label: "Design" }]                                                              },
  { id: "done",        title: "Done",        cards: [{ id: "k4", title: "Landing page",        label: "Frontend"}]                                                             },
];

export const TEAMS: Team[] = [
  { id: "1", name: "Engineering", memberCount: 5, avatarColors: ["linear-gradient(135deg,#635BFF,#3FD0FF)", "linear-gradient(135deg,#FF5C8A,#635BFF)", "linear-gradient(135deg,#34d399,#3FD0FF)"] },
  { id: "2", name: "Design",      memberCount: 3, avatarColors: ["linear-gradient(135deg,#FF5C8A,#635BFF)", "linear-gradient(135deg,#34d399,#3FD0FF)"]                                            },
  { id: "3", name: "Growth",      memberCount: 4, avatarColors: ["linear-gradient(135deg,#34d399,#3FD0FF)", "linear-gradient(135deg,#635BFF,#3FD0FF)", "linear-gradient(135deg,#FF5C8A,#635BFF)"] },
];

export const CHAT_CHANNELS: ChatChannel[] = [
  { id: "general",       name: "general",       unread: 2 },
  { id: "design-system", name: "design-system", unread: 1 },
  { id: "engineering",   name: "engineering"               },
  { id: "announcements", name: "announcements"              },
  { id: "random",        name: "random"                     },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: "1", author: "Sarah Chen",    initials: "SC", avatarGradient: "linear-gradient(135deg,#635BFF,#3FD0FF)", time: "10:24 AM", text: "Hey team! Just pushed the new design system updates. Can everyone review before tomorrow's standup? 🎨" },
  { id: "2", author: "Marcus Kim",    initials: "MK", avatarGradient: "linear-gradient(135deg,#FF5C8A,#635BFF)", time: "10:31 AM", text: "On it! The new token system looks really clean. Going through it now."                                    },
  { id: "3", author: "Rachel Torres", initials: "RT", avatarGradient: "linear-gradient(135deg,#34d399,#3FD0FF)", time: "10:45 AM", text: "Reviewed the components — left a few comments. The button variants are 🔥 Overall a huge improvement over v1." },
];
