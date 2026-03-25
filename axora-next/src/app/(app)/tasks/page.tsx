"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee_name: string;
  creator_id: string;
  creator_name: string;
  created_at: string;
};

type Project = {
  id: string;
  title: string;
};

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#635BFF", bg: "rgba(99,91,255,0.08)" },
  { id: "inprogress", label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { id: "review", label: "Review", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { id: "done", label: "Done", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assignee_name: "" });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");

      const { data: projectsData } = await supabase
        .from("projects").select("id, title").order("created_at", { ascending: false });
      setProjects(projectsData ?? []);
      if (projectsData && projectsData.length > 0) {
        setActiveProject(projectsData[0]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadTasks = async (projectId: string) => {
    const { data } = await supabase
      .from("tasks").select("*").eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setTasks(data ?? []);
  };

  useEffect(() => {
    if (!activeProject) return;
    loadTasks(activeProject.id);

    const channel = supabase
      .channel(`tasks:${activeProject.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "tasks",
        filter: `project_id=eq.${activeProject.id}`,
      }, () => { loadTasks(activeProject.id); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeProject]);

  const addTask = async (status: string) => {
    if (!newTask.title.trim() || !activeProject || !userId) return;

    await supabase.from("tasks").insert({
      project_id: activeProject.id,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status,
      priority: newTask.priority,
      assignee_name: newTask.assignee_name.trim() || userName,
      creator_id: userId,
      creator_name: userName,
    });

    setNewTask({ title: "", description: "", priority: "medium", assignee_name: "" });
    setShowAddTask(null);
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task["status"] } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Drag handlers
  const onDragStart = (task: Task) => setDraggedTask(task);
  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const onDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== colId) {
      await moveTask(draggedTask.id, colId);
    }
    setDraggedTask(null);
    setDragOverCol(null);
  };
  const onDragEnd = () => {
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  if (loading) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading tasks...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px" }}>
          Task Management
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Kanban Board</h1>

          {/* Project selector */}
          <select
            value={activeProject?.id ?? ""}
            onChange={e => {
              const p = projects.find(p => p.id === e.target.value);
              if (p) setActiveProject(p);
            }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "9px", padding: "8px 12px",
              color: "#fff", fontSize: "13px",
              outline: "none", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} style={{ background: "#0d0d12" }}>{p.title}</option>
            ))}
          </select>
        </div>

        {activeProject && (
          <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "4px" }}>
            {tasks.length} tasks · {getTasksByStatus("done").length} completed
          </p>
        )}
      </div>

      {/* Kanban columns */}
      {activeProject ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          alignItems: "start",
        }}>
          {COLUMNS.map(col => {
            const colTasks = getTasksByStatus(col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={e => onDragOver(e, col.id)}
                onDrop={e => onDrop(e, col.id)}
                style={{
                  background: isOver ? col.bg : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isOver ? col.color + "50" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "14px",
                  padding: "14px",
                  minHeight: "200px",
                  transition: "all 0.15s",
                }}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(230,230,230,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      color: col.color,
                      background: `${col.color}18`,
                      border: `1px solid ${col.color}30`,
                      borderRadius: "999px", padding: "1px 6px",
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddTask(showAddTask === col.id ? null : col.id)}
                    style={{
                      width: "22px", height: "22px", borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(230,230,230,0.5)", fontSize: "14px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Add task form */}
                {showAddTask === col.id && (
                  <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(99,91,255,0.25)",
                    borderRadius: "10px", padding: "12px",
                    marginBottom: "10px",
                    display: "flex", flexDirection: "column", gap: "8px",
                  }}>
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTask.title}
                      onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      autoFocus
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "7px", padding: "7px 10px", color: "#fff",
                        fontSize: "13px", outline: "none", fontFamily: "inherit", width: "100%",
                      }}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newTask.description}
                      onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                      rows={2}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "7px", padding: "7px 10px", color: "#fff",
                        fontSize: "12px", outline: "none", fontFamily: "inherit",
                        resize: "none", width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["low", "medium", "high"].map(p => (
                        <button
                          key={p}
                          onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                          style={{
                            flex: 1, padding: "4px",
                            borderRadius: "5px", fontSize: "10px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            background: newTask.priority === p ? `${PRIORITY_COLORS[p]}20` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${newTask.priority === p ? PRIORITY_COLORS[p] + "50" : "rgba(255,255,255,0.07)"}`,
                            color: newTask.priority === p ? PRIORITY_COLORS[p] : "rgba(230,230,230,0.4)",
                            textTransform: "capitalize",
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder={`Assignee (default: ${userName})`}
                      value={newTask.assignee_name}
                      onChange={e => setNewTask(p => ({ ...p, assignee_name: e.target.value }))}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "7px", padding: "7px 10px", color: "#fff",
                        fontSize: "12px", outline: "none", fontFamily: "inherit", width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => addTask(col.id)}
                        style={{
                          flex: 1, padding: "7px",
                          background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                          border: "none", borderRadius: "7px",
                          color: "#fff", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setShowAddTask(null)}
                        style={{
                          padding: "7px 10px",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "7px", color: "rgba(230,230,230,0.4)",
                          fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Task cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task)}
                      onDragEnd={onDragEnd}
                      style={{
                        background: draggedTask?.id === task.id ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${draggedTask?.id === task.id ? "rgba(99,91,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: "10px", padding: "12px",
                        cursor: "grab",
                        opacity: draggedTask?.id === task.id ? 0.5 : 1,
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                    >
                      {/* Priority dot */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                          <span style={{ fontSize: "9px", color: PRIORITY_COLORS[task.priority], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {task.priority}
                          </span>
                        </div>
                        {task.creator_id === userId && (
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{
                              background: "none", border: "none",
                              color: "rgba(239,68,68,0.4)", fontSize: "11px",
                              cursor: "pointer", padding: "0 2px", lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#fff", marginBottom: "6px", lineHeight: 1.4 }}>
                        {task.title}
                      </p>

                      {task.description && (
                        <p style={{ fontSize: "11.5px", color: "rgba(230,230,230,0.4)", marginBottom: "8px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {task.description}
                        </p>
                      )}

                      {/* Move buttons */}
                      <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
                        {COLUMNS.filter(c => c.id !== task.status).map(c => (
                          <button
                            key={c.id}
                            onClick={() => moveTask(task.id, c.id)}
                            style={{
                              padding: "2px 7px", borderRadius: "4px",
                              background: `${c.color}12`, border: `1px solid ${c.color}25`,
                              color: c.color, fontSize: "9px", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                              textTransform: "uppercase", letterSpacing: "0.04em",
                            }}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>

                      {/* Assignee */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%",
                          background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "8px", fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {task.assignee_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "rgba(230,230,230,0.35)" }}>
                          {task.assignee_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {colTasks.length === 0 && !showAddTask && (
                  <div style={{ textAlign: "center", padding: "20px 10px", color: "rgba(230,230,230,0.15)", fontSize: "12px" }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>
          No projects found. Create one in Discover first.
        </p>
      )}
    </div>
  );
}
