"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { BadgesSection } from "@/components/dashboard/BadgesSection";
import { Profile, calculateMatchScore } from "@/lib/matching";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  project_id?: string;
};

type Notification = {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
};

type StatsData = {
  projects: number;
  tasks: number;
  matches: number;
  messages: number;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState<StatsData>({ projects: 0, tasks: 0, matches: 0, messages: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: profile } = await supabase
        .from("profiles").select("full_name, skills").eq("id", uid).single();
      const name = profile?.full_name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "there";
      setUserName(name);
      setCurrentUserSkills(profile?.skills ?? []);

      const { data: taskData } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, project_id")
        .or(`assignee_id.eq.${uid},creator_id.eq.${uid}`)
        .neq("status", "done")
        .order("due_date", { ascending: true })
        .limit(5);
      setTasks(taskData ?? []);

      const { count: projCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .or(`owner_id.eq.${uid},members.cs.{${uid}}`);

      const { count: taskCount } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .or(`assignee_id.eq.${uid},creator_id.eq.${uid}`)
        .neq("status", "done");

      const { data: allProfiles } = await supabase
        .from("profiles").select("*").neq("id", uid);
      const scored: Profile[] = (allProfiles ?? []).map(p => ({
        ...p,
        match_score: calculateMatchScore(profile?.skills ?? [], p.skills ?? []),
        reason: `${calculateMatchScore(profile?.skills ?? [], p.skills ?? [])}% skill compatibility`,
      })).sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
      setMatches(scored.slice(0, 3));

      setStats({ projects: projCount ?? 0, tasks: taskCount ?? 0, matches: scored.length, messages: 0 });

      const pendingCount = taskCount ?? 0;
      const topMatch = scored[0];
      if (pendingCount > 0 && topMatch) {
        setAiInsight(`You have ${pendingCount} pending task${pendingCount > 1 ? "s" : ""} and ${scored.length} potential teammate${scored.length !== 1 ? "s" : ""} available. Your top match is ${topMatch.full_name} at ${topMatch.match_score}% compatibility.`);
      } else if (pendingCount > 0) {
        setAiInsight(`You have ${pendingCount} pending task${pendingCount > 1 ? "s" : ""} today. Stay focused and knock them out!`);
      } else if (scored.length > 0) {
        setAiInsight(`All caught up on tasks! ${scored.length} potential teammate${scored.length !== 1 ? "s" : ""} available — great time to connect.`);
      } else {
        setAiInsight(`Welcome to Axora, ${name}! Start by creating a project or finding your first teammate.`);
      }

      setLoading(false);
    };
    init();
  }, []);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // ── stat cards: all colors from CSS variables ──
  const statCards = [
    { label: "Projects",     value: stats.projects, icon: "🚀", href: "/projects" },
    { label: "Pending Tasks",value: stats.tasks,    icon: "✅", href: "/tasks"    },
    { label: "Matches",      value: stats.matches,  icon: "🤝", href: "/match"    },
    { label: "Messages",     value: stats.messages, icon: "💬", href: "/chat"     },
  ];

  const quickActions = [
    { label: "Create Project", icon: "🚀", href: "/projects" },
    { label: "Find Team",      icon: "👥", href: "/discover" },
    { label: "AI Match",       icon: "✨", href: "/match"    },
  ];

  if (loading) return (
    <div style={{ color: "var(--color-text-dim)", fontSize: "14px", padding: "40px" }}>
      Loading dashboard...
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-section { animation: dashFadeUp 0.4s ease both; }

        /* Stat cards */
        .dash-stat-card {
          background: var(--color-card-bg);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          display: block;
        }
        .dash-stat-card:hover {
          border-color: var(--color-border-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.1);
        }
        .dash-stat-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--color-accent-dim);
          border: 1px solid var(--color-border-accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; margin-bottom: 14px;
        }
        .dash-stat-value {
          font-size: 2rem; font-weight: 800;
          color: var(--color-text-primary);
          letter-spacing: -0.04em; line-height: 1;
        }
        .dash-stat-label {
          font-size: 12px;
          color: var(--color-text-dim);
          margin-top: 5px;
        }
        /* Corner accent */
        .dash-stat-corner {
          position: absolute; top: 0; right: 0;
          width: 60px; height: 60px;
          border-radius: 0 16px 0 60px;
          background: var(--color-accent-dim);
          opacity: 0.7;
        }

        /* Panel */
        .dash-panel {
          background: var(--color-card-bg);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 20px;
        }
        .dash-panel-title {
          font-size: 14px; font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 14px;
        }

        /* Quick actions */
        .dash-quick-action {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 11px;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: border-color 0.18s, transform 0.18s, background 0.18s;
          text-decoration: none;
        }
        .dash-quick-action:hover {
          border-color: var(--color-border-hover);
          background: var(--color-accent-dim);
          transform: translateY(-1px);
        }
        .dash-quick-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(16,185,129,0.25);
        }
        .dash-quick-label {
          font-size: 13.5px; font-weight: 500;
          color: var(--color-text-primary);
          flex: 1;
        }
        .dash-quick-arrow {
          color: var(--color-text-dim);
          font-size: 14px;
        }

        /* Tasks */
        .dash-task-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 10px;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          transition: border-color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .dash-task-row:hover {
          border-color: var(--color-border-hover);
          background: var(--color-accent-dim);
        }
        .dash-task-check {
          width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid var(--color-border-hover);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: var(--color-accent);
          transition: all 0.15s;
        }
        .dash-task-check.done {
          border: none;
          background: var(--color-accent-dim);
          color: var(--color-accent);
        }
        .dash-task-title {
          font-size: 13px; flex: 1;
          color: var(--color-text-primary);
          transition: all 0.15s;
        }
        .dash-task-title.done {
          color: var(--color-text-dim);
          text-decoration: line-through;
        }
        .dash-task-badge {
          font-size: 10.5px; padding: 2px 8px; border-radius: 999px;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          white-space: nowrap;
        }
        .dash-task-badge.overdue {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }

        /* AI Insight */
        .dash-insight {
          padding: 16px 20px;
          background: var(--color-accent-dim);
          border: 1px solid var(--color-border-accent);
          border-radius: 14px;
          display: flex; align-items: flex-start; gap: 14px;
        }
        .dash-insight-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: var(--color-accent-dim);
          border: 1px solid var(--color-border-accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .dash-insight-tag {
          font-size: 11px; font-weight: 600;
          color: var(--color-accent);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 5px;
        }
        .dash-insight-text {
          font-size: 14px;
          color: var(--color-text-muted);
          line-height: 1.6; margin: 0;
        }

        /* Notifications */
        .dash-notif-btn {
          background: var(--color-card-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px; padding: 10px 14px;
          color: var(--color-text-muted);
          font-size: 18px; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .dash-notif-btn:hover {
          border-color: var(--color-border-hover);
          background: var(--color-accent-dim);
        }
        .dash-notif-panel {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: 300px; z-index: 50;
          background: var(--color-elevated);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .dash-notif-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--color-border);
          font-size: 13px; font-weight: 600;
          color: var(--color-text-primary);
        }
        .dash-notif-empty {
          padding: 24px 16px;
          text-align: center;
          font-size: 13px;
          color: var(--color-text-dim);
        }
        .dash-notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .dash-notif-item:hover { background: var(--color-accent-dim); }
        .dash-notif-msg { font-size: 13px; color: var(--color-text-muted); margin: 0; }
        .dash-notif-time { font-size: 11px; color: var(--color-text-dim); margin: 4px 0 0; }

        /* Section headers */
        .dash-section-title {
          font-size: 16px; font-weight: 600;
          color: var(--color-text-primary);
        }
        .dash-section-sub {
          font-size: 12px;
          color: var(--color-text-dim);
          margin-top: 3px;
        }
        .dash-see-all {
          font-size: 13px;
          color: var(--color-accent);
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 0.15s;
        }
        .dash-see-all:hover { opacity: 1; }

        /* Header */
        .dash-greeting {
          font-size: 13px;
          color: var(--color-text-dim);
          margin-bottom: 6px;
        }
        .dash-greeting-date {
          color: var(--color-text-dim);
          opacity: 0.7;
        }
        .dash-heading {
          font-size: 2rem; font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--color-text-primary);
          line-height: 1.1;
        }
        .dash-heading-name {
          background: linear-gradient(135deg, var(--color-accent-soft), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── Header row ── */}
      <div className="dash-section" style={{ animationDelay: "0ms", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="dash-greeting">
            {getGreeting()} ·{" "}
            <span className="dash-greeting-date">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </p>
          <h1 className="dash-heading font-display">
            Welcome back,{" "}
            <span className="dash-heading-name">{userName}</span>{" "}
            👋
          </h1>
        </div>

        {/* Notifications bell */}
        <div style={{ position: "relative" }}>
          <button className="dash-notif-btn" onClick={() => setNotifOpen(o => !o)} style={{ position: "relative" }}>
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{
                position: "absolute", top: "6px", right: "6px",
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid var(--color-bg)",
              }} />
            )}
          </button>

          {notifOpen && (
            <div className="dash-notif-panel">
              <div className="dash-notif-header">Notifications</div>
              {notifications.length === 0 ? (
                <div className="dash-notif-empty">You're all caught up! 🎉</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="dash-notif-item">
                    <p className="dash-notif-msg">{n.message}</p>
                    <p className="dash-notif-time">{timeAgo(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Insight banner ── */}
      {aiInsight && (
        <div className="dash-section" style={{ animationDelay: "60ms" }}>
          <div className="dash-insight">
            <div className="dash-insight-icon">✨</div>
            <div>
              <p className="dash-insight-tag">AI Daily Insight</p>
              <p className="dash-insight-text">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="dash-section" style={{ animationDelay: "100ms", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="dash-stat-card">
            <div className="dash-stat-corner" />
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Quick actions + Tasks ── */}
      <div className="dash-section" style={{ animationDelay: "150ms", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "14px" }}>

        {/* Quick actions */}
        <div className="dash-panel">
          <h2 className="dash-panel-title">Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {quickActions.map(a => (
              <Link key={a.label} href={a.href} className="dash-quick-action">
                <div className="dash-quick-icon">{a.icon}</div>
                <span className="dash-quick-label">{a.label}</span>
                <span className="dash-quick-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="dash-panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 className="dash-panel-title" style={{ marginBottom: 0 }}>Pending Tasks</h2>
            <Link href="/tasks" className="dash-see-all">See all →</Link>
          </div>

          {tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", fontSize: "13px" }} className="dash-notif-empty">
              🎉 No pending tasks — you're all caught up!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {tasks.map(task => {
                const done = completedTasks.has(task.id);
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    className="dash-task-row"
                    style={{ opacity: done ? 0.5 : 1 }}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`dash-task-check${done ? " done" : ""}`}>
                      {done && "✓"}
                    </div>
                    <span className={`dash-task-title${done ? " done" : ""}`}>
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className={`dash-task-badge${isOverdue ? " overdue" : ""}`}>
                        {isOverdue ? "Overdue" : new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Matches ── */}
      {matches.length > 0 && (
        <div className="dash-section" style={{ animationDelay: "200ms" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 className="dash-section-title">AI Teammate Matches</h2>
              <p className="dash-section-sub">Ranked by skill compatibility</p>
            </div>
            <Link href="/match" className="dash-see-all">View all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {matches.map(profile => (
              <MatchCard key={profile.id} profile={profile} currentUserSkills={currentUserSkills} />
            ))}
          </div>
        </div>
      )}

      {/* ── Badges ── */}
      <div className="dash-section" style={{ animationDelay: "250ms" }}>
        <BadgesSection />
      </div>
    </div>
  );
}
