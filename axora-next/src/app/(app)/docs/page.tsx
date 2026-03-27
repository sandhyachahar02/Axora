"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { supabase } from "@/supabase/client";

type Doc = {
  id: string;
  title: string;
  content: string;
  creator_id: string;
  creator_name: string;
  editable_by: "anyone" | "creator";
  created_at: string;
  updated_at: string;
};

type DocVersion = {
  id: string;
  document_id: string;
  content: string;
  saved_by: string;
  saved_by_name: string;
  created_at: string;
};

type DocFile = {
  id: string;
  document_id: string;
  name: string;
  url: string;
  size: number;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
};

type Panel = "editor" | "versions" | "files";

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btn = (active: boolean) => ({
    padding: "4px 9px",
    borderRadius: "6px",
    border: "none",
    background: active ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.05)",
    color: active ? "#a89fff" : "rgba(230,230,230,0.55)",
    fontSize: "12.5px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "3px",
      padding: "8px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(0,0,0,0.15)",
    }}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive("bold"))}><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive("italic"))}><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} style={btn(editor.isActive("strike"))}><s>S</s></button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 3px" }} />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={btn(editor.isActive("heading", { level: 1 }))}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btn(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btn(editor.isActive("heading", { level: 3 }))}>H3</button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 3px" }} />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn(editor.isActive("bulletList"))}>• List</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btn(editor.isActive("orderedList"))}>1. List</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btn(editor.isActive("blockquote"))}>❝</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} style={btn(editor.isActive("codeBlock"))}>{"</>"}</button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 3px" }} />
      <button onClick={() => editor.chain().focus().undo().run()} style={btn(false)}>↩</button>
      <button onClick={() => editor.chain().focus().redo().run()} style={btn(false)}>↪</button>
    </div>
  );
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [panel, setPanel] = useState<Panel>("editor");

  // Version history
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);

  // File uploads
  const [files, setFiles] = useState<DocFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI summarizer
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDocRef = useRef<Doc | null>(null);
  const userNameRef = useRef<string>("");
  const userIdRef = useRef<string | null>(null);

  useEffect(() => { activeDocRef.current = activeDoc; }, [activeDoc]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const saveVersion = useCallback(async (content: string, docId: string) => {
    const uid = userIdRef.current;
    const uname = userNameRef.current;
    if (!uid) return;
    await supabase.from("document_versions").insert({
      document_id: docId,
      content,
      saved_by: uid,
      saved_by_name: uname,
    });
  }, []);

  const debounceSave = useCallback((content: string) => {
    const doc = activeDocRef.current;
    if (!doc) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (versionTimeoutRef.current) clearTimeout(versionTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await supabase.from("documents")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", doc.id);
      setSaving(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);

    // Save version every 30 seconds of inactivity
    versionTimeoutRef.current = setTimeout(() => {
      saveVersion(content, doc.id);
    }, 30000);
  }, [saveVersion]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style: "outline: none; min-height: 400px; padding: 28px 36px; color: #e6e6e6; font-size: 15px; line-height: 1.85; font-family: var(--font-dm-sans);",
      },
    },
    onUpdate: ({ editor }) => {
      debounceSave(editor.getHTML());
    },
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      userIdRef.current = session.user.id;

      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      const name = profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous";
      setUserName(name);
      userNameRef.current = name;

      const { data } = await supabase
        .from("documents").select("*").order("updated_at", { ascending: false });
      setDocs(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  // Real-time sync
  useEffect(() => {
    if (!activeDoc) return;
    const channel = supabase
      .channel(`doc:${activeDoc.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "documents",
        filter: `id=eq.${activeDoc.id}`,
      }, (payload) => {
        const updated = payload.new as Doc;
        if (updated.updated_at !== activeDoc.updated_at) {
          const currentPos = editor?.state.selection.from;
          editor?.commands.setContent(updated.content);
          if (currentPos) editor?.commands.setTextSelection(currentPos);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeDoc, editor]);

  const loadVersions = async (docId: string) => {
    setVersionsLoading(true);
    const { data } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", docId)
      .order("created_at", { ascending: false })
      .limit(20);
    setVersions(data ?? []);
    setVersionsLoading(false);
  };

  const loadFiles = async (docId: string) => {
    setFilesLoading(true);
    const { data } = await supabase
      .from("document_files")
      .select("*")
      .eq("document_id", docId)
      .order("created_at", { ascending: false });
    setFiles(data ?? []);
    setFilesLoading(false);
  };

  const openDoc = (doc: Doc) => {
    setActiveDoc(doc);
    activeDocRef.current = doc;
    setTitleInput(doc.title);
    setLastSaved(null);
    setSummary(null);
    setShowSummary(false);
    setPanel("editor");
    editor?.commands.setContent(doc.content || "<p>Start writing...</p>");
    loadVersions(doc.id);
    loadFiles(doc.id);
  };

  const createDoc = async () => {
    if (!userId) return;
    const { data } = await supabase.from("documents").insert({
      title: "Untitled Document",
      content: "<p>Start writing...</p>",
      creator_id: userId,
      creator_name: userName,
      editable_by: "anyone",
    }).select().single();
    if (data) {
      setDocs(prev => [data, ...prev]);
      openDoc(data);
    }
  };

  const saveTitle = async () => {
    if (!activeDoc || !titleInput.trim()) return;
    await supabase.from("documents").update({ title: titleInput }).eq("id", activeDoc.id);
    setActiveDoc(prev => prev ? { ...prev, title: titleInput } : null);
    setDocs(prev => prev.map(d => d.id === activeDoc.id ? { ...d, title: titleInput } : d));
    setEditingTitle(false);
  };

  const toggleEditable = async () => {
    if (!activeDoc || activeDoc.creator_id !== userId) return;
    const newVal = activeDoc.editable_by === "anyone" ? "creator" : "anyone";
    await supabase.from("documents").update({ editable_by: newVal }).eq("id", activeDoc.id);
    setActiveDoc(prev => prev ? { ...prev, editable_by: newVal } : null);
    setDocs(prev => prev.map(d => d.id === activeDoc.id ? { ...d, editable_by: newVal } : d));
  };

  const deleteDoc = async (docId: string) => {
    await supabase.from("documents").delete().eq("id", docId);
    setDocs(prev => prev.filter(d => d.id !== docId));
    if (activeDoc?.id === docId) {
      setActiveDoc(null);
      editor?.commands.setContent("");
    }
  };

  const restoreVersion = async (version: DocVersion) => {
    if (!activeDoc) return;
    setRestoringVersion(true);
    await supabase.from("documents")
      .update({ content: version.content, updated_at: new Date().toISOString() })
      .eq("id", activeDoc.id);
    editor?.commands.setContent(version.content);
    setRestoringVersion(false);
    setPanel("editor");
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !activeDoc || !userId) return;
    const file = e.target.files[0];
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${activeDoc.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("document-files")
      .upload(path, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("document-files")
      .getPublicUrl(path);

    const { data } = await supabase.from("document_files").insert({
      document_id: activeDoc.id,
      name: file.name,
      url: publicUrl,
      size: file.size,
      uploaded_by: userId,
      uploaded_by_name: userName,
    }).select().single();

    if (data) setFiles(prev => [data, ...prev]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    await supabase.from("document_files").delete().eq("id", fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const summarizeDoc = async () => {
    if (!editor || !activeDoc) return;
    const text = editor.getText();
    if (!text.trim() || text.trim() === "Start writing...") {
      alert("Write something first before summarizing!");
      return;
    }

    setSummarizing(true);
    setShowSummary(true);
    setSummary(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Summarize this document in 3-5 concise bullet points. Be specific and extract the key insights:\n\n${text.slice(0, 4000)}`,
          }],
        }),
      });

      const data = await response.json();
      setSummary(data.content?.[0]?.text ?? "Could not generate summary.");
    } catch {
      setSummary("Failed to summarize. Please try again.");
    }
    setSummarizing(false);
  };

  const canEdit = activeDoc
    ? activeDoc.editable_by === "anyone" || activeDoc.creator_id === userId
    : false;

  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [canEdit, editor]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return "🖼️";
    if (["pdf"].includes(ext ?? "")) return "📕";
    if (["doc", "docx"].includes(ext ?? "")) return "📝";
    if (["xls", "xlsx"].includes(ext ?? "")) return "📊";
    if (["zip", "rar", "tar"].includes(ext ?? "")) return "🗜️";
    if (["mp4", "mov", "avi"].includes(ext ?? "")) return "🎬";
    return "📎";
  };

  if (loading) return (
    <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px", padding: "40px" }}>
      Loading documents...
    </div>
  );

  return (
    <div>
      <style>{`
        .ProseMirror h1 { font-size: 28px; font-weight: 700; color: #fff; margin: 20px 0 8px; }
        .ProseMirror h2 { font-size: 22px; font-weight: 600; color: #fff; margin: 16px 0 6px; }
        .ProseMirror h3 { font-size: 18px; font-weight: 600; color: #e6e6e6; margin: 12px 0 4px; }
        .ProseMirror p { margin: 6px 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
        .ProseMirror li { margin: 3px 0; color: #e6e6e6; }
        .ProseMirror blockquote { border-left: 3px solid rgba(99,91,255,0.5); padding-left: 14px; margin: 10px 0; color: rgba(230,230,230,0.6); font-style: italic; }
        .ProseMirror code { background: rgba(99,91,255,0.12); border: 1px solid rgba(99,91,255,0.2); border-radius: 4px; padding: 1px 5px; font-size: 13px; color: #a89fff; }
        .ProseMirror pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px 16px; margin: 10px 0; overflow-x: auto; }
        .ProseMirror pre code { background: none; border: none; padding: 0; color: #e6e6e6; }
        .ProseMirror strong { color: #fff; }
        .ProseMirror em { color: rgba(230,230,230,0.8); }
        .doc-sidebar-item:hover { background: rgba(255,255,255,0.04) !important; }
        .panel-tab:hover { background: rgba(255,255,255,0.06) !important; }
        .version-item:hover { background: rgba(255,255,255,0.04) !important; }
        .file-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px" }}>
          Knowledge Hub
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Documents</h1>
        <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "6px" }}>
          Collaborative notes, project docs, and file uploads — all in one place.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "14px", height: "calc(100vh - 180px)" }}>

        {/* Sidebar */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={createDoc}
              style={{
                width: "100%", padding: "9px",
                background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                border: "none", borderRadius: "9px",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(99,91,255,0.25)",
              }}
            >
              + New Document
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {docs.length === 0 && (
              <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.25)", textAlign: "center", padding: "20px 10px" }}>
                No documents yet.
              </p>
            )}
            {docs.map(doc => (
              <div
                key={doc.id}
                className="doc-sidebar-item"
                onClick={() => openDoc(doc)}
                style={{
                  padding: "9px 11px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: activeDoc?.id === doc.id ? "rgba(99,91,255,0.12)" : "transparent",
                  border: activeDoc?.id === doc.id ? "1px solid rgba(99,91,255,0.25)" : "1px solid transparent",
                  marginBottom: "2px",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500, color: activeDoc?.id === doc.id ? "#a89fff" : "rgba(230,230,230,0.7)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📄 {doc.title}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(230,230,230,0.25)" }}>
                  {doc.creator_name} · {new Date(doc.updated_at).toLocaleDateString()}
                </div>
                {doc.creator_id === userId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    style={{
                      position: "absolute", top: "8px", right: "7px",
                      background: "none", border: "none",
                      color: "rgba(239,68,68,0.5)", fontSize: "11px",
                      cursor: "pointer", opacity: 0, transition: "opacity 0.15s",
                      padding: "2px 4px",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {activeDoc ? (
            <>
              {/* Top toolbar */}
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: "10px",
                background: "rgba(0,0,0,0.1)",
                flexWrap: "wrap",
              }}>
                {/* Title */}
                {editingTitle ? (
                  <input
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={e => e.key === "Enter" && saveTitle()}
                    autoFocus
                    style={{
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,91,255,0.3)",
                      borderRadius: "6px", padding: "4px 8px", color: "#fff",
                      fontSize: "14px", fontWeight: 600, outline: "none",
                      fontFamily: "inherit", flex: 1, minWidth: "120px",
                    }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    title="Click to rename"
                    style={{ fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "text", flex: 1, minWidth: "80px" }}
                  >
                    {activeDoc.title}
                  </h2>
                )}

                {/* AI Summarize */}
                <button
                  onClick={summarizeDoc}
                  disabled={summarizing}
                  style={{
                    padding: "5px 11px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                    cursor: summarizing ? "not-allowed" : "pointer", fontFamily: "inherit",
                    background: showSummary ? "rgba(99,91,255,0.2)" : "rgba(99,91,255,0.1)",
                    border: "1px solid rgba(99,91,255,0.3)",
                    color: "#a89fff", opacity: summarizing ? 0.6 : 1,
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  ✨ {summarizing ? "Summarizing..." : "AI Summary"}
                </button>

                {/* Permission toggle */}
                {activeDoc.creator_id === userId && (
                  <button
                    onClick={toggleEditable}
                    style={{
                      padding: "5px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit",
                      background: activeDoc.editable_by === "anyone" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                      border: `1px solid ${activeDoc.editable_by === "anyone" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                      color: activeDoc.editable_by === "anyone" ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {activeDoc.editable_by === "anyone" ? "🌐 Anyone" : "🔒 Only me"}
                  </button>
                )}

                {/* Save status */}
                <span style={{ fontSize: "11px", color: "rgba(230,230,230,0.25)", whiteSpace: "nowrap" }}>
                  {saving ? "⏳ Saving..." : lastSaved ? `✓ ${lastSaved}` : ""}
                </span>

                {/* Live dot */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
                  <span style={{ fontSize: "10px", color: "rgba(230,230,230,0.25)" }}>Live</span>
                </div>
              </div>

              {/* Panel tabs */}
              <div style={{
                display: "flex", gap: "2px",
                padding: "6px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(0,0,0,0.08)",
              }}>
                {([
                  { key: "editor", label: "✏️ Editor" },
                  { key: "files", label: `📎 Files${files.length > 0 ? ` (${files.length})` : ""}` },
                  { key: "versions", label: `🕐 History${versions.length > 0 ? ` (${versions.length})` : ""}` },
                ] as { key: Panel; label: string }[]).map(tab => (
                  <button
                    key={tab.key}
                    className="panel-tab"
                    onClick={() => setPanel(tab.key)}
                    style={{
                      padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: panel === tab.key ? 600 : 400,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: panel === tab.key ? "rgba(99,91,255,0.15)" : "transparent",
                      color: panel === tab.key ? "#a89fff" : "rgba(230,230,230,0.4)",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* AI Summary banner */}
              {showSummary && (
                <div style={{
                  margin: "12px 16px 0",
                  padding: "14px 16px",
                  background: "rgba(99,91,255,0.08)",
                  border: "1px solid rgba(99,91,255,0.2)",
                  borderRadius: "10px",
                  position: "relative",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(99,91,255,0.8)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    ✨ AI Summary
                  </div>
                  {summarizing ? (
                    <div style={{ fontSize: "13px", color: "rgba(230,230,230,0.4)" }}>Generating summary...</div>
                  ) : (
                    <div style={{ fontSize: "13.5px", color: "rgba(230,230,230,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {summary}
                    </div>
                  )}
                  <button
                    onClick={() => setShowSummary(false)}
                    style={{
                      position: "absolute", top: "10px", right: "12px",
                      background: "none", border: "none", color: "rgba(230,230,230,0.3)",
                      cursor: "pointer", fontSize: "14px",
                    }}
                  >✕</button>
                </div>
              )}

              {/* Panel content */}
              <div style={{ flex: 1, overflowY: "auto" }}>

                {/* Editor panel */}
                {panel === "editor" && (
                  <>
                    {!canEdit && (
                      <div style={{ padding: "8px 16px", background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.12)", fontSize: "12px", color: "#f59e0b" }}>
                        🔒 View only — only the creator can edit this document
                      </div>
                    )}
                    {canEdit && <MenuBar editor={editor} />}
                    <EditorContent editor={editor} />
                  </>
                )}

                {/* Files panel */}
                {panel === "files" && (
                  <div style={{ padding: "20px" }}>
                    <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>File Attachments</h3>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={uploadFile}
                        style={{ display: "none" }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                          padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                          cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit",
                          background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.3)",
                          color: "#a89fff", opacity: uploading ? 0.6 : 1,
                        }}
                      >
                        {uploading ? "Uploading..." : "↑ Upload File"}
                      </button>
                    </div>

                    {filesLoading ? (
                      <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.3)" }}>Loading files...</p>
                    ) : files.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "10px" }}>📎</div>
                        <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.3)" }}>No files attached yet. Upload your first file!</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {files.map(file => (
                          <div
                            key={file.id}
                            className="file-item"
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "11px 14px", borderRadius: "10px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              transition: "all 0.15s",
                            }}
                          >
                            <span style={{ fontSize: "22px" }}>{getFileIcon(file.name)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "13px", fontWeight: 500, color: "#a89fff", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                              >
                                {file.name}
                              </a>
                              <div style={{ fontSize: "11px", color: "rgba(230,230,230,0.3)", marginTop: "2px" }}>
                                {formatFileSize(file.size)} · {file.uploaded_by_name} · {new Date(file.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "4px 10px", borderRadius: "6px", fontSize: "11px",
                                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(230,230,230,0.5)", textDecoration: "none",
                              }}
                            >
                              Open
                            </a>
                            {file.uploaded_by === userId && (
                              <button
                                onClick={() => deleteFile(file.id, file.url)}
                                style={{
                                  background: "none", border: "none",
                                  color: "rgba(239,68,68,0.4)", fontSize: "13px",
                                  cursor: "pointer", padding: "4px",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = "rgba(239,68,68,0.8)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.4)")}
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Version history panel */}
                {panel === "versions" && (
                  <div style={{ padding: "20px" }}>
                    <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Version History</h3>
                      <button
                        onClick={() => {
                          if (editor && activeDoc) {
                            saveVersion(editor.getHTML(), activeDoc.id).then(() => loadVersions(activeDoc.id));
                          }
                        }}
                        style={{
                          padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 500,
                          cursor: "pointer", fontFamily: "inherit",
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(230,230,230,0.5)",
                        }}
                      >
                        Save Snapshot
                      </button>
                    </div>
                    <p style={{ fontSize: "11px", color: "rgba(230,230,230,0.25)", marginBottom: "14px" }}>
                      Versions are auto-saved every 30s of inactivity. Click "Restore" to roll back.
                    </p>

                    {versionsLoading ? (
                      <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.3)" }}>Loading history...</p>
                    ) : versions.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🕐</div>
                        <p style={{ fontSize: "13px", color: "rgba(230,230,230,0.3)" }}>No versions saved yet. Keep writing!</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {versions.map((v, i) => (
                          <div
                            key={v.id}
                            className="version-item"
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "11px 14px", borderRadius: "10px",
                              background: i === 0 ? "rgba(99,91,255,0.07)" : "rgba(255,255,255,0.02)",
                              border: i === 0 ? "1px solid rgba(99,91,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ fontSize: "20px" }}>📋</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13px", fontWeight: 500, color: i === 0 ? "#a89fff" : "rgba(230,230,230,0.7)" }}>
                                {i === 0 ? "Latest version" : `Version ${versions.length - i}`}
                              </div>
                              <div style={{ fontSize: "11px", color: "rgba(230,230,230,0.3)", marginTop: "2px" }}>
                                {v.saved_by_name} · {new Date(v.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                            {i !== 0 && (
                              <button
                                onClick={() => restoreVersion(v)}
                                disabled={restoringVersion}
                                style={{
                                  padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 500,
                                  cursor: restoringVersion ? "not-allowed" : "pointer", fontFamily: "inherit",
                                  background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)",
                                  color: "#a89fff", opacity: restoringVersion ? 0.5 : 1,
                                }}
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "40px" }}>📄</div>
              <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.3)" }}>Select a document or create a new one</p>
              <button
                onClick={createDoc}
                style={{
                  padding: "9px 20px", background: "rgba(99,91,255,0.12)",
                  border: "1px solid rgba(99,91,255,0.25)", borderRadius: "9px",
                  color: "#a89fff", fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                + Create Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
