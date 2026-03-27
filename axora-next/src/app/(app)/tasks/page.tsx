"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Status   = "todo" | "inprogress" | "review" | "done";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee_name: string;
  creator_id: string;
  creator_name: string;
  created_at: string;
  due_date?: string;
  tags?: string[];
};

type Project = { id: string; title: string };

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const COLUMNS: { id: Status; label: string; accent: string; bg: string; icon: string }[] = [
  { id: "todo",       label: "To Do",      accent: "var(--color-text-dim)", bg: "rgba(107,114,128,0.07)", icon: "○" },
  { id: "inprogress", label: "In Progress", accent: "#f59e0b",              bg: "rgba(245,158,11,0.07)",  icon: "◑" },
  { id: "review",     label: "Review",      accent: "#3B82F6",              bg: "rgba(59,130,246,0.07)",  icon: "◎" },
  { id: "done",       label: "Done",        accent: "var(--color-accent)",  bg: "var(--color-accent-dim)", icon: "●" },
];

const PRIORITY_CFG: Record<Priority, { color: string; bg: string }> = {
  low:    { color: "var(--color-text-dim)", bg: "var(--color-surface2)" },
  medium: { color: "#f59e0b",               bg: "rgba(245,158,11,0.10)" },
  high:   { color: "#ef4444",               bg: "rgba(239,68,68,0.10)"  },
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const isOverdue = (d?: string) => !!d && new Date(d) < new Date();
const fmtDate   = (d?: string) => d ? new Date(d).toLocaleDateString([], { month: "short", day: "numeric" }) : null;

/* ─────────────────────────────────────────────
   TASK CARD
───────────────────────────────────────────── */
function TaskCard({
  task, userId, onDelete, onMove, onOpen, isDragging,
}: {
  task: Task; userId: string | null;
  onDelete: () => void; onMove: (s: Status) => void;
  onOpen: () => void; isDragging: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const overdue = isOverdue(task.due_date) && task.status !== "done";

  return (
    <div
      onClick={onOpen}
      className="task-card"
      style={{
        background: isDragging ? "var(--color-accent-dim)" : "var(--color-card-bg)",
        border: `1px solid ${isDragging ? "var(--color-border-accent)" : "var(--color-border)"}`,
        borderRadius: "12px", padding: "13px 14px",
        cursor: "grab", userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? "rotate(1.5deg) scale(0.97)" : "none",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s, opacity 0.15s",
        position: "relative", overflow: "hidden",
      }}
    >
      {task.priority === "high" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #ef4444 0%, transparent 100%)" }} />
      )}

      {/* Title + menu */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: task.description ? "6px" : "10px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, flex: 1 }}>
          {task.title}
        </p>
        <div style={{ position: "relative", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowMenu(v => !v)}
            style={{
              width: "22px", height: "22px", background: "none", border: "none",
              borderRadius: "5px", cursor: "pointer", color: "var(--color-text-dim)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
            }}
          >⋯</button>
          {showMenu && (
            <div style={{
              position: "absolute", right: 0, top: "26px", zIndex: 50,
              background: "var(--color-elevated)", border: "1px solid var(--color-border)",
              borderRadius: "10px", padding: "6px", minWidth: "148px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)", animation: "menuIn 0.12s ease",
            }}>
              {COLUMNS.filter(c => c.id !== task.status).map(c => (
                <button key={c.id} onClick={() => { onMove(c.id); setShowMenu(false); }}
                  className="menu-item"
                  style={{
                    display: "flex", alignItems: "center", gap: "7px", width: "100%",
                    padding: "7px 10px", background: "none", border: "none", borderRadius: "7px",
                    color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: "9px", color: c.accent }}>{c.icon}</span>
                  Move to {c.label}
                </button>
              ))}
              {task.creator_id === userId && (
                <>
                  <div style={{ height: "1px", background: "var(--color-divider)", margin: "5px 0" }} />
                  <button onClick={() => { onDelete(); setShowMenu(false); }}
                    className="menu-item-danger"
                    style={{
                      display: "flex", alignItems: "center", gap: "7px", width: "100%",
                      padding: "7px 10px", background: "none", border: "none", borderRadius: "7px",
                      color: "#ef4444", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 11, height: 11 }}>
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                    Delete task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{
          fontSize: "11.5px", color: "var(--color-text-dim)", lineHeight: 1.5, marginBottom: "10px",
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {task.description}
        </p>
      )}

      {(task.tags ?? []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
          {(task.tags ?? []).map(tag => (
            <span key={tag} style={{
              fontSize: "9.5px", padding: "2px 7px", borderRadius: "999px",
              background: "var(--color-accent-dim)", color: "var(--color-accent)",
              border: "1px solid var(--color-border-accent)", fontWeight: 600,
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span style={{
          fontSize: "9.5px", fontWeight: 700, textTransform: "capitalize",
          color: PRIORITY_CFG[task.priority].color, background: PRIORITY_CFG[task.priority].bg,
          border: `1px solid ${PRIORITY_CFG[task.priority].color}30`,
          borderRadius: "4px", padding: "1px 6px",
        }}>{task.priority}</span>
        <div style={{ flex: 1 }} />
        {task.due_date && (
          <span style={{
            fontSize: "10px", fontWeight: 500,
            color: overdue ? "#ef4444" : "var(--color-text-dim)",
            background: overdue ? "rgba(239,68,68,0.08)" : "none",
            padding: "1px 5px", borderRadius: "4px",
          }}>{overdue ? "⚠ " : ""}{fmtDate(task.due_date)}</span>
        )}
        {task.assignee_name && (
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 700, color: "#022C22", flexShrink: 0,
          }}>
            {task.assignee_name[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK DETAIL MODAL
───────────────────────────────────────────── */
function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const col = COLUMNS.find(c => c.id === task.status);
  const overdue = isOverdue(task.due_date) && task.status !== "done";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "480px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)", animation: "modalIn 0.18s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{
                fontSize: "9.5px", fontWeight: 700, textTransform: "capitalize",
                color: PRIORITY_CFG[task.priority].color, background: PRIORITY_CFG[task.priority].bg,
                border: `1px solid ${PRIORITY_CFG[task.priority].color}30`,
                borderRadius: "4px", padding: "2px 7px",
              }}>{task.priority} priority</span>
              {col && (
                <span style={{
                  fontSize: "9.5px", fontWeight: 700, color: col.accent,
                  background: col.bg, border: `1px solid ${col.accent}35`,
                  borderRadius: "4px", padding: "2px 7px",
                }}>{col.label}</span>
              )}
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.4 }}>{task.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "22px", lineHeight: 1, marginLeft: "12px" }}>×</button>
        </div>

        {task.description && (
          <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--color-divider)" }}>
            {task.description}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { label: "Assignee",   value: task.assignee_name },
            { label: "Created by", value: task.creator_name  },
            ...(task.due_date ? [{ label: "Due date", value: fmtDate(task.due_date) ?? "", warn: overdue }] : []),
            { label: "Created",    value: new Date(task.created_at).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-dim)", width: "88px", flexShrink: 0, letterSpacing: "0.04em" }}>{row.label}</span>
              <span style={{ fontSize: "13px", color: row.warn ? "#ef4444" : "var(--color-text-muted)", fontWeight: row.warn ? 600 : 400 }}>
                {row.warn ? "⚠ " : ""}{row.value}
              </span>
            </div>
          ))}
        </div>

        {(task.tags ?? []).length > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-divider)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Tags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {(task.tags ?? []).map(tag => (
                <span key={tag} style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "999px",
                  background: "var(--color-accent-dim)", color: "var(--color-accent)",
                  border: "1px solid var(--color-border-accent)", fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD TASK INLINE FORM
───────────────────────────────────────────── */
function AddTaskForm({
  userName, onAdd, onCancel,
}: {
  userName: string;
  onAdd: (f: { title: string; description: string; priority: Priority; assignee_name: string; due_date: string; tags: string }) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({ title: "", description: "", priority: "medium" as Priority, assignee_name: "", due_date: "", tags: "" });
  return (
    <div style={{
      background: "var(--color-surface2)", border: "1px solid var(--color-border-accent)",
      borderRadius: "12px", padding: "14px", marginBottom: "10px",
      display: "flex", flexDirection: "column", gap: "9px",
      boxShadow: "0 4px 16px rgba(16,185,129,0.08)",
    }}>
      <input autoFocus placeholder="Task title…" value={f.title}
        onChange={e => setF(p => ({ ...p, title: e.target.value }))}
        onKeyDown={e => { if (e.key === "Enter" && f.title.trim()) onAdd(f); if (e.key === "Escape") onCancel(); }}
        style={{ width: "100%", padding: "8px 10px", fontSize: "13px", fontFamily: "inherit", borderRadius: "8px", boxSizing: "border-box" }}
      />
      <textarea placeholder="Description (optional)" value={f.description} rows={2}
        onChange={e => setF(p => ({ ...p, description: e.target.value }))}
        style={{ width: "100%", padding: "8px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: "8px", resize: "none", boxSizing: "border-box" }}
      />
      {/* Priority row */}
      <div style={{ display: "flex", gap: "5px" }}>
        {(["low", "medium", "high"] as Priority[]).map(p => (
          <button key={p} onClick={() => setF(prev => ({ ...prev, priority: p }))}
            style={{
              flex: 1, padding: "5px", borderRadius: "7px", fontSize: "10px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
              background: f.priority === p ? PRIORITY_CFG[p].bg : "var(--color-surface)",
              border: `1px solid ${f.priority === p ? PRIORITY_CFG[p].color + "55" : "var(--color-border)"}`,
              color: f.priority === p ? PRIORITY_CFG[p].color : "var(--color-text-dim)",
              transition: "all 0.12s",
            }}
          >{p}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "7px" }}>
        <input placeholder={`Assignee`} value={f.assignee_name}
          onChange={e => setF(p => ({ ...p, assignee_name: e.target.value }))}
          style={{ flex: 1, padding: "7px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: "7px" }}
        />
        <input type="date" value={f.due_date}
          onChange={e => setF(p => ({ ...p, due_date: e.target.value }))}
          style={{ flex: 1, padding: "7px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: "7px" }}
        />
      </div>
      <input placeholder="Tags (comma separated)" value={f.tags}
        onChange={e => setF(p => ({ ...p, tags: e.target.value }))}
        style={{ width: "100%", padding: "7px 10px", fontSize: "12px", fontFamily: "inherit", borderRadius: "7px", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => { if (f.title.trim()) onAdd(f); }} className="btn-primary" style={{ flex: 1, padding: "8px", fontSize: "12px" }}>
          Add Task
        </button>
        <button onClick={onCancel} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "12px" }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AI BREAKDOWN MODAL
───────────────────────────────────────────── */
function AIModal({
  onClose, onImport, projectTitle,
}: {
  onClose: () => void;
  onImport: (tasks: { title: string; description: string; priority: Priority }[]) => void;
  projectTitle: string;
}) {
  const [idea, setIdea]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ title: string; description: string; priority: Priority }[] | null>(null);
  const [error, setError]     = useState("");

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a senior project manager. Break down the following idea into 4–8 concrete, actionable tasks for the project "${projectTitle}".

Project idea: ${idea}

Respond ONLY with a valid JSON array. No preamble, no markdown fences. Format:
[{ "title": "...", "description": "...", "priority": "low"|"medium"|"high" }, ...]`,
          }],
        }),
      });
      const data = await res.json();
      const text = (data.content ?? []).map((c: { type: string; text?: string }) => c.text ?? "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      setError("Failed to generate. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(2,6,23,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "560px",
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px var(--color-border-accent)",
        animation: "modalIn 0.18s ease",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg fill="none" stroke="var(--color-accent)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>AI Task Breakdown</h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginTop: "2px" }}>Convert a project idea into actionable tasks</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "22px", lineHeight: 1, marginLeft: "12px" }}>×</button>
        </div>

        <textarea
          value={idea} onChange={e => setIdea(e.target.value)} rows={4}
          placeholder={`e.g. "Build a user authentication system with login, registration, and password reset"`}
          style={{
            width: "100%", padding: "12px 14px", fontSize: "13.5px",
            fontFamily: "inherit", borderRadius: "10px", resize: "vertical",
            boxSizing: "border-box", lineHeight: 1.6, marginBottom: "14px",
          }}
        />

        <button onClick={generate} disabled={loading || !idea.trim()} className="btn-primary"
          style={{ width: "100%", padding: "11px", fontSize: "13.5px", marginBottom: "18px", opacity: idea.trim() ? 1 : 0.5, transition: "opacity 0.15s" }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ width: "14px", height: "14px", border: "2px solid #022C22", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Generating tasks…
            </span>
          ) : "✦  Generate Tasks"}
        </button>

        {error && (
          <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "14px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        {result && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {result.length} tasks generated
              </p>
              <button onClick={() => { onImport(result); onClose(); }} className="btn-primary" style={{ padding: "7px 16px", fontSize: "12px" }}>
                Import all → board
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.map((t, i) => (
                <div key={i} style={{
                  background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                  borderRadius: "10px", padding: "13px 14px",
                  animation: `fadeUp 0.2s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                    <span style={{
                      fontSize: "9.5px", fontWeight: 700, textTransform: "capitalize",
                      color: PRIORITY_CFG[t.priority]?.color ?? "var(--color-text-dim)",
                      background: PRIORITY_CFG[t.priority]?.bg ?? "var(--color-surface2)",
                      border: `1px solid ${PRIORITY_CFG[t.priority]?.color ?? "var(--color-border)"}30`,
                      borderRadius: "4px", padding: "1px 6px",
                    }}>{t.priority}</span>
                    <span style={{ fontSize: "10.5px", color: "var(--color-text-dim)" }}>Task {i + 1}</span>
                  </div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>{t.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYTICS BAR
───────────────────────────────────────────── */
function AnalyticsBar({ tasks }: { tasks: Task[] }) {
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "done").length;
  const inprog   = tasks.filter(t => t.status === "inprogress").length;
  const review   = tasks.filter(t => t.status === "review").length;
  const overdue  = tasks.filter(t => isOverdue(t.due_date) && t.status !== "done").length;
  const highPrio = tasks.filter(t => t.priority === "high" && t.status !== "done").length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "24px" }}>
      {/* Progress — spans 2 cols */}
      <div className="stat-card" style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "12px", padding: "15px 18px", transition: "all 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Overall Progress</span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-accent)", letterSpacing: "-0.5px" }}>{pct}%</span>
        </div>
        <div style={{ height: "6px", background: "var(--color-surface2)", borderRadius: "999px", overflow: "hidden", marginBottom: "7px" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))",
            width: `${pct}%`, transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: "0 0 10px rgba(16,185,129,0.4)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>{done} of {total} tasks done</span>
          {review > 0 && <span style={{ fontSize: "11px", color: "#3B82F6" }}>{review} in review</span>}
        </div>
      </div>

      {[
        { label: "In Progress", value: inprog,   color: "#f59e0b", icon: "◑" },
        { label: "Overdue",     value: overdue,  color: "#ef4444", icon: "⚠" },
        { label: "High Prio",   value: highPrio, color: "#ef4444", icon: "↑" },
        { label: "Total",       value: total,    color: "var(--color-accent)", icon: "≡" },
      ].map(s => (
        <div key={s.label} className="stat-card" style={{
          background: "var(--color-card-bg)",
          border: `1px solid ${s.value > 0 && s.label !== "Total" ? s.color + "25" : "var(--color-border)"}`,
          borderRadius: "12px", padding: "15px 16px", transition: "all 0.2s",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "15px", color: s.value > 0 ? s.color : "var(--color-text-dim)" }}>{s.icon}</span>
            <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px", color: s.value > 0 ? s.color : "var(--color-text-primary)" }}>{s.value}</span>
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--color-text-dim)" }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function TasksPage() {
  const [projects, setProjects]           = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [userId, setUserId]               = useState<string | null>(null);
  const [userName, setUserName]           = useState("");
  const [loading, setLoading]             = useState(true);
  const [showAddFor, setShowAddFor]       = useState<Status | null>(null);
  const [draggedTask, setDraggedTask]     = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol]     = useState<Status | null>(null);
  const [openTask, setOpenTask]           = useState<Task | null>(null);
  const [showAI, setShowAI]               = useState(false);
  const [filter, setFilter]               = useState<Priority | "all">("all");

  /* ── init ── */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");
      const { data: pd } = await supabase.from("projects").select("id, title").order("created_at", { ascending: false });
      setProjects(pd ?? []);
      if (pd?.length) setActiveProject(pd[0]);
      setLoading(false);
    };
    init();
  }, []);

  /* ── load + realtime ── */
  const loadTasks = async (pid: string) => {
    const { data } = await supabase.from("tasks").select("*").eq("project_id", pid).order("created_at", { ascending: true });
    setTasks(data ?? []);
  };

  useEffect(() => {
    if (!activeProject) return;
    loadTasks(activeProject.id);
    const ch = supabase.channel(`tasks:${activeProject.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${activeProject.id}` },
        () => loadTasks(activeProject.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeProject]);

  /* ── CRUD ── */
  const addTask = async (
    status: Status,
    f: { title: string; description: string; priority: Priority; assignee_name: string; due_date: string; tags: string }
  ) => {
    if (!f.title.trim() || !activeProject || !userId) return;
    await supabase.from("tasks").insert({
      project_id: activeProject.id, title: f.title.trim(),
      description: f.description.trim(), status, priority: f.priority,
      assignee_name: f.assignee_name.trim() || userName,
      creator_id: userId, creator_name: userName,
      due_date: f.due_date || null,
      tags: f.tags ? f.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
    setShowAddFor(null);
  };

  const moveTask = async (taskId: string, newStatus: Status) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const importAITasks = async (aiTasks: { title: string; description: string; priority: Priority }[]) => {
    if (!activeProject || !userId) return;
    for (const t of aiTasks) {
      await supabase.from("tasks").insert({
        project_id: activeProject.id, title: t.title, description: t.description,
        status: "todo", priority: t.priority,
        assignee_name: userName, creator_id: userId, creator_name: userName,
      });
    }
    loadTasks(activeProject.id);
  };

  /* ── drag ── */
  const onDragStart = (task: Task) => setDraggedTask(task);
  const onDragOver  = (e: React.DragEvent, col: Status) => { e.preventDefault(); setDragOverCol(col); };
  const onDrop      = async (e: React.DragEvent, col: Status) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== col) await moveTask(draggedTask.id, col);
    setDraggedTask(null); setDragOverCol(null);
  };
  const onDragEnd   = () => { setDraggedTask(null); setDragOverCol(null); };

  const filtered = (status: Status) =>
    tasks.filter(t => t.status === status && (filter === "all" || t.priority === filter));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-dim)", fontSize: "14px", padding: "20px" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading tasks…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes menuIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        .task-card:hover {
          border-color: var(--color-border-hover) !important;
          box-shadow: 0 4px 18px rgba(16,185,129,0.10);
          transform: translateY(-2px);
        }
        .stat-card:hover {
          border-color: var(--color-border-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(16,185,129,0.10);
        }
        .col-zone { transition: background 0.15s, border-color 0.15s; }
        .menu-item:hover        { background: var(--color-accent-dim) !important; color: var(--color-text-primary) !important; }
        .menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .filter-btn.active      { background: var(--color-accent-dim) !important; border-color: var(--color-border-accent) !important; color: var(--color-accent) !important; }
        .filter-btn:hover       { border-color: var(--color-border-hover) !important; color: var(--color-text-primary) !important; }
        .add-col-btn:hover      { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .ai-trigger:hover       { background: var(--color-accent-hover) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.35) !important; }
      `}</style>

      {/* Modals */}
      {openTask && <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />}
      {showAI && <AIModal onClose={() => setShowAI(false)} onImport={importAITasks} projectTitle={activeProject?.title ?? "Project"} />}

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "7px" }}>
          Task Management
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text-primary)" }}>
            Kanban Board
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Project picker */}
            <select
              value={activeProject?.id ?? ""}
              onChange={e => { const p = projects.find(x => x.id === e.target.value); if (p) setActiveProject(p); }}
              style={{
                background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                borderRadius: "9px", padding: "8px 12px",
                color: "var(--color-text-primary)", fontSize: "13px",
                outline: "none", cursor: "pointer", fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>

            {/* Priority filter */}
            <div style={{ display: "flex", gap: "4px" }}>
              {(["all", "high", "medium", "low"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`filter-btn${filter === f ? " active" : ""}`}
                  style={{
                    padding: "6px 11px", borderRadius: "7px",
                    background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-dim)", fontSize: "11.5px", fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", textTransform: "capitalize",
                  }}
                >{f}</button>
              ))}
            </div>

            {/* AI button */}
            <button onClick={() => setShowAI(true)} className="btn-primary ai-trigger"
              style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", fontSize: "13px", transition: "all 0.15s" }}>
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              AI Breakdown
            </button>
          </div>
        </div>
        {activeProject && (
          <p style={{ fontSize: "13px", color: "var(--color-text-dim)", marginTop: "5px" }}>
            {tasks.length} tasks · {tasks.filter(t => t.status === "done").length} completed
            {filter !== "all" && ` · Showing ${filter} priority`}
          </p>
        )}
      </div>

      {/* ── ANALYTICS ── */}
      {activeProject && tasks.length > 0 && <AnalyticsBar tasks={tasks} />}

      {/* ── KANBAN ── */}
      {activeProject ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", alignItems: "start" }}>
          {COLUMNS.map(col => {
            const colTasks = filtered(col.id);
            const isOver   = dragOverCol === col.id;

            return (
              <div key={col.id} className="col-zone"
                onDragOver={e => onDragOver(e, col.id)}
                onDrop={e => onDrop(e, col.id)}
                style={{
                  background: isOver ? col.bg : "var(--color-surface2)",
                  border: `1px solid ${isOver ? col.accent + "45" : "var(--color-border)"}`,
                  borderRadius: "14px", padding: "14px", minHeight: "240px",
                }}
              >
                {/* Col header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ fontSize: "14px", color: col.accent }}>{col.icon}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, color: col.accent,
                      background: `${col.accent}18`, border: `1px solid ${col.accent}30`,
                      borderRadius: "999px", padding: "1px 7px",
                    }}>{colTasks.length}</span>
                  </div>
                  <button onClick={() => setShowAddFor(showAddFor === col.id ? null : col.id)}
                    className="add-col-btn"
                    style={{
                      width: "24px", height: "24px", borderRadius: "6px",
                      background: "var(--color-surface)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-dim)", fontSize: "16px",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >+</button>
                </div>

                {/* Inline add form */}
                {showAddFor === col.id && (
                  <AddTaskForm
                    userName={userName}
                    onAdd={f => addTask(col.id, f)}
                    onCancel={() => setShowAddFor(null)}
                  />
                )}

                {/* Task cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {colTasks.map(task => (
                    <div key={task.id} draggable onDragStart={() => onDragStart(task)} onDragEnd={onDragEnd}>
                      <TaskCard
                        task={task} userId={userId}
                        isDragging={draggedTask?.id === task.id}
                        onDelete={() => deleteTask(task.id)}
                        onMove={s => moveTask(task.id, s)}
                        onOpen={() => setOpenTask(task)}
                      />
                    </div>
                  ))}
                </div>

                {/* Empty state */}
                {colTasks.length === 0 && showAddFor !== col.id && (
                  <div style={{
                    textAlign: "center", padding: "28px 10px",
                    color: "var(--color-text-dim)", fontSize: "12px",
                    border: `2px dashed ${isOver ? col.accent + "40" : "var(--color-border)"}`,
                    borderRadius: "10px", transition: "border-color 0.15s",
                  }}>
                    {isOver ? `Drop here` : `No tasks yet`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-dim)", fontSize: "14px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "6px" }}>No projects found.</p>
          <p style={{ fontSize: "12px" }}>Create a project in Discover first.</p>
        </div>
      )}
    </>
  );
}
