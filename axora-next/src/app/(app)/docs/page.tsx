"use client";

import { useEffect, useState, useCallback } from "react";
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

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnStyle = (active: boolean) => ({
    padding: "4px 8px",
    borderRadius: "6px",
    border: "none",
    background: active ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.05)",
    color: active ? "#a89fff" : "rgba(230,230,230,0.6)",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "4px",
      padding: "10px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.02)",
    }}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive("bold"))}><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive("italic"))}><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} style={btnStyle(editor.isActive("strike"))}><s>S</s></button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={btnStyle(editor.isActive("heading", { level: 1 }))}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btnStyle(editor.isActive("heading", { level: 3 }))}>H3</button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive("bulletList"))}>• List</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive("orderedList"))}>1. List</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive("blockquote"))}>❝</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} style={btnStyle(editor.isActive("codeBlock"))}>{"</>"}</button>
      <div style={{ width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().undo().run()} style={btnStyle(false)}>↩</button>
      <button onClick={() => editor.chain().focus().redo().run()} style={btnStyle(false)}>↪</button>
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

  const editor = useEditor({
  extensions: [StarterKit],
  content: "",
  immediatelyRender: false,
  editorProps: {
      attributes: {
        style: "outline: none; min-height: 400px; padding: 24px 32px; color: #e6e6e6; font-size: 15px; line-height: 1.8; font-family: var(--font-dm-sans);",
      },
    },
    onUpdate: ({ editor }) => {
      if (activeDoc) {
        debounceSave(editor.getHTML());
      }
    },
  });

  // Debounced save
  let saveTimeout: ReturnType<typeof setTimeout>;
  const debounceSave = useCallback((content: string) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (!activeDoc) return;
      setSaving(true);
      await supabase
        .from("documents")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", activeDoc.id);
      setSaving(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
  }, [activeDoc]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");

      const { data } = await supabase
        .from("documents").select("*").order("updated_at", { ascending: false });
      setDocs(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  // Subscribe to real-time document updates
  useEffect(() => {
    if (!activeDoc) return;

    const channel = supabase
      .channel(`doc:${activeDoc.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "documents",
        filter: `id=eq.${activeDoc.id}`,
      }, (payload) => {
        const updated = payload.new as Doc;
        // Only update if change came from another user
        if (updated.updated_at !== activeDoc.updated_at) {
          const currentPos = editor?.state.selection.from;
        
        editor?.commands.setContent(updated.content);
          if (currentPos) editor?.commands.setTextSelection(currentPos);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeDoc, editor]);

  const openDoc = (doc: Doc) => {
    setActiveDoc(doc);
    setTitleInput(doc.title);
    setLastSaved(null);
    editor?.commands.setContent(doc.content || "<p>Start writing...</p>");
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

  const canEdit = activeDoc
    ? activeDoc.editable_by === "anyone" || activeDoc.creator_id === userId
    : false;

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [canEdit, editor]);

  if (loading) return <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading documents...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(99,91,255,0.7)", marginBottom: "8px" }}>
          Live Collaboration
        </p>
        <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Documents</h1>
        <p style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)", marginTop: "6px" }}>
          Real-time collaborative editing — changes sync instantly across all users
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", height: "calc(100vh - 180px)" }}>

        {/* Doc list sidebar */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={createDoc}
              style={{
                width: "100%", padding: "9px",
                background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                border: "none", borderRadius: "9px",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(99,91,255,0.3)",
              }}
            >
              + New Document
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {docs.length === 0 && (
              <p style={{ fontSize: "12px", color: "rgba(230,230,230,0.25)", textAlign: "center", padding: "20px 10px" }}>
                No documents yet. Create one!
              </p>
            )}
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => openDoc(doc)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  background: activeDoc?.id === doc.id ? "rgba(99,91,255,0.12)" : "transparent",
                  border: activeDoc?.id === doc.id ? "1px solid rgba(99,91,255,0.25)" : "1px solid transparent",
                  marginBottom: "3px",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500, color: activeDoc?.id === doc.id ? "#a89fff" : "rgba(230,230,230,0.7)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📄 {doc.title}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(230,230,230,0.25)" }}>
                  {doc.creator_name} · {new Date(doc.updated_at).toLocaleDateString()}
                </div>
                {doc.creator_id === userId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "none", border: "none",
                      color: "rgba(239,68,68,0.5)", fontSize: "12px",
                      cursor: "pointer", opacity: 0, transition: "opacity 0.15s",
                      padding: "2px 4px",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor area */}
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
              {/* Doc toolbar */}
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: "10px",
                background: "rgba(255,255,255,0.02)",
              }}>
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
                      fontFamily: "inherit", flex: 1,
                    }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    style={{ fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "text", flex: 1 }}
                  >
                    {activeDoc.title}
                  </h2>
                )}

                {/* Permission toggle */}
                {activeDoc.creator_id === userId && (
                  <button
                    onClick={toggleEditable}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit",
                      background: activeDoc.editable_by === "anyone" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                      border: `1px solid ${activeDoc.editable_by === "anyone" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                      color: activeDoc.editable_by === "anyone" ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {activeDoc.editable_by === "anyone" ? "🌐 Anyone can edit" : "🔒 Only me"}
                  </button>
                )}

                {/* Save status */}
                <span style={{ fontSize: "11px", color: "rgba(230,230,230,0.25)" }}>
                  {saving ? "⏳ Saving..." : lastSaved ? `✓ Saved ${lastSaved}` : ""}
                </span>

                {/* Live indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                  <span style={{ fontSize: "10px", color: "rgba(230,230,230,0.3)" }}>Live</span>
                </div>
              </div>

              {/* Toolbar */}
              {canEdit && <MenuBar editor={editor} />}

              {/* Editor */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {!canEdit && (
                  <div style={{ padding: "8px 16px", background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.15)", fontSize: "12px", color: "#f59e0b" }}>
                    🔒 View only — only the creator can edit this document
                  </div>
                )}
                <style>{`
                  .ProseMirror h1 { font-size: 28px; font-weight: 700; color: #fff; margin: 16px 0 8px; }
                  .ProseMirror h2 { font-size: 22px; font-weight: 600; color: #fff; margin: 14px 0 6px; }
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
                `}</style>
                <EditorContent editor={editor} />
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
