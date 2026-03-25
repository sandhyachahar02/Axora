"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";

type Project = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: string;
  team_size: number;
  creator_name: string;
  creator_id: string;
};

type ProjectFile = {
  id: string;
  project_id: string;
  uploader_id: string;
  uploader_name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
};

const FILE_ICONS: Record<string, string> = {
  image: "🖼️",
  pdf: "📄",
  doc: "📝",
  code: "💻",
  default: "📎",
};

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return FILE_ICONS.image;
  if (type?.includes("pdf")) return FILE_ICONS.pdf;
  if (type?.includes("word") || type?.includes("document")) return FILE_ICONS.doc;
  if (type?.includes("javascript") || type?.includes("python") || type?.includes("text/plain")) return FILE_ICONS.code;
  return FILE_ICONS.default;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");

      const { data } = await supabase
        .from("projects").select("*").order("created_at", { ascending: false });
      setProjects(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const loadFiles = async (projectId: string) => {
    const { data } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setFiles(data ?? []);
  };

  // Real-time file updates
  useEffect(() => {
    if (!activeProject) return;
    loadFiles(activeProject.id);

    const channel = supabase
      .channel(`files:${activeProject.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "project_files",
        filter: `project_id=eq.${activeProject.id}`,
      }, () => {
        loadFiles(activeProject.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeProject]);

  const uploadFile = async (file: File) => {
    if (!activeProject || !userId) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${activeProject.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(path);

    await supabase.from("project_files").insert({
      project_id: activeProject.id,
      uploader_id: userId,
      uploader_name: userName,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
    });

    setUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    for (const file of selectedFiles) {
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      await uploadFile(file);
    }
  };

  const deleteFile = async (file: ProjectFile) => {
    const path = file.file_url.split("/project-files/")[1];
    await supabase.storage.from("project-files").remove([path]);
    await supabase.from("project_files").delete().eq("id", file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
  };

  if (loading) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading projects...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px" }}>
          Project Hub
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Projects</h1>
        <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "6px" }}>
          Select a project to manage files and collaborate
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: activeProject ? "300px 1fr" : "1fr", gap: "16px" }}>

        {/* Project list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {projects.length === 0 && (
            <p style={{ color: "rgba(230,230,230,0.3)", fontSize: "13px" }}>
              No projects yet. Go to Discover to create one.
            </p>
          )}
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => setActiveProject(project)}
              style={{
                padding: "16px",
                background: activeProject?.id === project.id ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.02)",
                border: activeProject?.id === project.id ? "1px solid rgba(99,91,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                {project.title}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(230,230,230,0.4)", marginBottom: "8px" }}>
                {project.creator_name} · {project.difficulty}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {(project.skills ?? []).slice(0, 3).map(skill => (
                  <span key={skill} style={{
                    fontSize: "10px", padding: "2px 7px",
                    background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)",
                    borderRadius: "999px", color: "#a89fff",
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Files panel */}
        {activeProject && (
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                  📁 {activeProject.title}
                </h2>
                <p style={{ fontSize: "11px", color: "rgba(230,230,230,0.3)", marginTop: "2px" }}>
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {uploading && (
                  <span style={{ fontSize: "12px", color: "rgba(99,91,255,0.7)" }}>⏳ Uploading...</span>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "7px 14px",
                    background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                    border: "none", borderRadius: "8px",
                    color: "#fff", fontSize: "12.5px", fontWeight: 600,
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.6 : 1,
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(99,91,255,0.3)",
                  }}
                >
                  + Upload Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                margin: "12px 20px",
                padding: "20px",
                border: `2px dashed ${dragOver ? "rgba(99,91,255,0.6)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px",
                textAlign: "center",
                background: dragOver ? "rgba(99,91,255,0.06)" : "transparent",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <p style={{ fontSize: "13px", color: dragOver ? "#a89fff" : "rgba(230,230,230,0.3)" }}>
                {dragOver ? "Drop files here" : "Drag & drop files here or click to upload"}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(230,230,230,0.2)", marginTop: "4px" }}>
                Any file type supported · Max 50MB per file
              </p>
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
              {files.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "rgba(230,230,230,0.2)", fontSize: "13px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
                  No files yet — upload something to get started
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {files.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "22px", flexShrink: 0 }}>{getFileIcon(file.file_type)}</span>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.file_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(230,230,230,0.3)", marginTop: "2px" }}>
                          {formatSize(file.file_size)} · {file.uploader_name} · {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "5px 10px", borderRadius: "6px",
                            background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)",
                            color: "#a89fff", fontSize: "11px", textDecoration: "none",
                            transition: "all 0.15s",
                          }}
                        >
                          Download ↗
                        </a>
                        {file.uploader_id === userId && (
                          <button
                            onClick={() => deleteFile(file)}
                            style={{
                              padding: "5px 10px", borderRadius: "6px",
                              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                              color: "#ef4444", fontSize: "11px", cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
