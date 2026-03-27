"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";

type Message = {
  id: string;
  room_id: string;
  user_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  reactions?: Record<string, string[]>;
  file_url?: string;
  file_name?: string;
};

type Room = {
  id: string;
  name: string;
  type?: "channel" | "dm" | "group";
  members?: number;
};

const EMOJI_REACTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "👀"];

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Anonymous");
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: "summary" | "tasks"; content: string } | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");
      const { data: roomsData } = await supabase
        .from("chat_rooms").select("*").order("created_at", { ascending: true });
      const roomList = roomsData ?? [];
      setRooms(roomList);
      if (roomList.length > 0) setActiveRoom(roomList[0]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages").select("*")
        .eq("room_id", activeRoom.id)
        .order("created_at", { ascending: true }).limit(100);
      setMessages(data ?? []);
    };
    loadMessages();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel(`room:${activeRoom.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `room_id=eq.${activeRoom.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom || !userId) return;
    const content = input.trim();
    setInput("");
    await supabase.from("chat_messages").insert({
      room_id: activeRoom.id, user_id: userId, sender_name: userName, content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !userId) return;
    const { data } = await supabase.from("chat_rooms")
      .insert({ name: newRoomName.trim().toLowerCase().replace(/\s+/g, "-"), created_by: userId })
      .select().single();
    if (data) {
      setRooms(prev => [...prev, data]);
      setActiveRoom(data);
      setNewRoomName(""); setShowNewRoom(false);
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const users = reactions[emoji] ?? [];
      reactions[emoji] = users.includes(userId!)
        ? users.filter(u => u !== userId)
        : [...users, userId!];
      if (reactions[emoji].length === 0) delete reactions[emoji];
      return { ...m, reactions };
    }));
    setShowEmojiFor(null);
  };

  const handleAI = async (type: "summary" | "tasks") => {
    if (!messages.length) return;
    setAiLoading(true); setShowAiPanel(true); setAiResult(null);
    const transcript = messages.slice(-30).map(m => `${m.sender_name}: ${m.content}`).join("\n");
    const prompt = type === "summary"
      ? `Summarize this chat discussion concisely in 3-5 bullet points:\n\n${transcript}`
      : `Extract all action items and tasks from this chat as a numbered list. Be specific:\n\n${transcript}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c: { type: string; text?: string }) => c.text ?? "").join("") ?? "No result.";
      setAiResult({ type, content: text });
    } catch {
      setAiResult({ type, content: "Failed to process. Please try again." });
    }
    setAiLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom || !userId) return;
    const ext = file.name.split(".").pop();
    const path = `chat/${activeRoom.id}/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage.from("attachments").upload(path, file);
    if (uploadData) {
      const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("chat_messages").insert({
        room_id: activeRoom.id, user_id: userId, sender_name: userName,
        content: `📎 ${file.name}`,
        file_url: urlData.publicUrl, file_name: file.name,
      });
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toDateString() === new Date().toDateString() ? "Today" : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-dim)", fontSize: "14px", padding: "20px" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading chat...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .msg-enter { animation: fadeIn 0.18s ease; }
        .ai-panel { animation: slideIn 0.22s ease; }
        .emoji-picker { animation: fadeIn 0.12s ease; }
        .room-item:hover { background: var(--color-accent-dim) !important; }
        .room-item.active { background: var(--color-accent-dim) !important; border-left-color: var(--color-accent) !important; }
        .room-item.active span { color: var(--color-accent) !important; font-weight: 500; }
        .chat-input-wrap:focus-within { border-color: var(--color-accent) !important; box-shadow: 0 0 0 3px var(--color-accent-dim) !important; }
        .msg-action-btn { opacity: 0; transition: opacity 0.12s; }
        .msg-row:hover .msg-action-btn { opacity: 1; }
        .send-btn-active { background: var(--color-accent) !important; box-shadow: 0 4px 14px rgba(16,185,129,0.35) !important; }
        .send-btn-active:hover { background: var(--color-accent-hover) !important; transform: translateY(-1px); }
        .ai-btn:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .tool-btn:hover { background: var(--color-accent-dim) !important; color: var(--color-accent) !important; }
        .reaction-chip:hover { border-color: var(--color-accent) !important; background: var(--color-accent-dim) !important; }
        .add-room-btn:hover { background: var(--color-accent-dim) !important; border-color: var(--color-border-hover) !important; color: var(--color-accent) !important; }
        .search-close:hover { color: var(--color-accent) !important; }
        .ai-close:hover { color: var(--color-accent) !important; }
      `}</style>

      <div style={{
        display: "flex", height: "calc(100vh - 64px)",
        borderRadius: "16px", overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: "220px", flexShrink: 0,
          background: "var(--color-sidebar-bg)",
          borderRight: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Channels
              </p>
              <span style={{
                fontSize: "10px", background: "var(--color-accent-dim)", color: "var(--color-accent)",
                border: "1px solid var(--color-border-accent)", borderRadius: "999px", padding: "1px 7px", fontWeight: 600,
              }}>
                {rooms.length}
              </span>
            </div>
          </div>

          {/* Room list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {rooms.map(room => (
              <div key={room.id} onClick={() => setActiveRoom(room)}
                className={`room-item${activeRoom?.id === room.id ? " active" : ""}`}
                style={{
                  padding: "8px 10px", cursor: "pointer",
                  borderLeft: `2px solid ${activeRoom?.id === room.id ? "var(--color-accent)" : "transparent"}`,
                  borderRadius: "0 8px 8px 0",
                  transition: "all 0.15s", display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--color-text-dim)", fontWeight: 400 }}>#</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {room.name}
                </span>
                {activeRoom?.id === room.id && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          {/* New room */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid var(--color-border)" }}>
            {showNewRoom ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <input
                  type="text" placeholder="room-name" value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createRoom()}
                  autoFocus
                  style={{
                    background: "var(--color-input-bg)", border: "1px solid var(--color-input-border)",
                    borderRadius: "7px", padding: "6px 10px",
                    color: "var(--color-text-primary)", fontSize: "12px",
                    outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "5px" }}>
                  <button onClick={createRoom} className="btn-primary" style={{ flex: 1, padding: "5px", fontSize: "11px" }}>Create</button>
                  <button onClick={() => setShowNewRoom(false)} className="btn-secondary" style={{ flex: 1, padding: "5px", fontSize: "11px" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewRoom(true)} className="add-room-btn"
                style={{
                  width: "100%", padding: "7px 10px",
                  background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                  borderRadius: "8px", color: "var(--color-text-dim)", fontSize: "12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add channel
              </button>
            )}
          </div>
        </div>

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

          {/* Header */}
          <div style={{
            padding: "12px 20px", borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", gap: "10px",
            background: "var(--color-surface)", flexShrink: 0,
          }}>
            <span style={{ fontSize: "16px", color: "var(--color-text-dim)", fontWeight: 300 }}>#</span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
              {activeRoom?.name ?? "Select a channel"}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Live indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--color-text-dim)", marginRight: "4px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", animation: "pulse 2s infinite" }} />
                Live
              </div>

              {/* Search toggle */}
              <button onClick={() => setShowSearch(v => !v)} className="tool-btn"
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: showSearch ? "var(--color-accent-dim)" : "var(--color-surface2)",
                  border: "1px solid var(--color-border)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", color: showSearch ? "var(--color-accent)" : "var(--color-text-dim)",
                }}
              >
                <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>

              {/* AI assistant button */}
              <button onClick={() => setShowAiPanel(v => !v)} className="tool-btn"
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
                  background: showAiPanel ? "var(--color-accent-dim)" : "var(--color-surface2)",
                  border: `1px solid ${showAiPanel ? "var(--color-border-accent)" : "var(--color-border)"}`,
                  borderRadius: "8px", cursor: "pointer", transition: "all 0.15s",
                  color: showAiPanel ? "var(--color-accent)" : "var(--color-text-dim)",
                  fontSize: "12px", fontWeight: 500, fontFamily: "inherit",
                }}
              >
                <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                AI Assistant
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div style={{
              padding: "10px 20px", borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface2)", flexShrink: 0,
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <svg fill="none" stroke="var(--color-text-dim)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 14, height: 14, flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus placeholder="Search messages…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "var(--color-text-primary)", fontSize: "13px", fontFamily: "inherit",
                }}
              />
              {searchQuery && (
                <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>
                  {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
                </span>
              )}
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="search-close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}>
                ×
              </button>
            </div>
          )}

          {/* Main flex: messages + AI panel */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-dim)", fontSize: "13px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>{searchQuery ? "🔍" : "💬"}</div>
                  <p style={{ color: "var(--color-text-muted)", marginBottom: "4px" }}>
                    {searchQuery ? `No messages matching "${searchQuery}"` : "No messages yet"}
                  </p>
                  {!searchQuery && <p style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>Be the first to say something!</p>}
                </div>
              )}

              {filteredMessages.map((msg, i) => {
                const isOwn = msg.user_id === userId;
                const prev = filteredMessages[i - 1];
                const showDate = !prev || formatDate(msg.created_at) !== formatDate(prev.created_at);
                const showSender = !prev || prev.user_id !== msg.user_id || showDate;
                const isFile = !!msg.file_url;

                return (
                  <div key={msg.id} className="msg-enter">
                    {showDate && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0 10px" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--color-divider)" }} />
                        <span style={{
                          fontSize: "10px", color: "var(--color-text-dim)",
                          background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                          borderRadius: "999px", padding: "2px 10px",
                        }}>{formatDate(msg.created_at)}</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--color-divider)" }} />
                      </div>
                    )}

                    <div className="msg-row"
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => { setHoveredMsg(null); if (showEmojiFor === msg.id) setShowEmojiFor(null); }}
                      style={{
                        display: "flex", flexDirection: isOwn ? "row-reverse" : "row",
                        alignItems: "flex-end", gap: "8px",
                        marginTop: showSender ? "14px" : "2px",
                        position: "relative",
                      }}
                    >
                      {/* Avatar */}
                      {showSender ? (
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                          background: isOwn
                            ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
                            : "linear-gradient(135deg, #3B82F6, #1d4ed8)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, color: isOwn ? "#022C22" : "#fff",
                          boxShadow: isOwn ? "0 0 10px rgba(16,185,129,0.25)" : "none",
                        }}>
                          {msg.sender_name[0]?.toUpperCase()}
                        </div>
                      ) : <div style={{ width: "30px", flexShrink: 0 }} />}

                      <div style={{ maxWidth: "62%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                        {showSender && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexDirection: isOwn ? "row-reverse" : "row" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: isOwn ? "var(--color-accent)" : "var(--color-text-primary)" }}>
                              {isOwn ? "You" : msg.sender_name}
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>{formatTime(msg.created_at)}</span>
                          </div>
                        )}

                        {/* Message bubble */}
                        {isFile ? (
                          <a href={msg.file_url} target="_blank" rel="noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              padding: "10px 14px",
                              borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                              background: isOwn ? "var(--color-accent-dim)" : "var(--color-surface2)",
                              border: isOwn ? "1px solid var(--color-border-accent)" : "1px solid var(--color-border)",
                              textDecoration: "none", color: "var(--color-accent)",
                              fontSize: "13px", fontWeight: 500,
                            }}
                          >
                            <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 14, height: 14, flexShrink: 0 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            {msg.file_name ?? "Attachment"}
                            <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 11, height: 11, opacity: 0.6 }}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        ) : (
                          <div style={{
                            padding: "9px 14px",
                            borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            background: isOwn ? "var(--color-accent-dim)" : "var(--color-surface2)",
                            border: isOwn
                              ? "1px solid var(--color-border-accent)"
                              : "1px solid var(--color-border)",
                            fontSize: "13.5px", color: "var(--color-text-primary)",
                            lineHeight: 1.55, wordBreak: "break-word",
                            transition: "background 0.15s",
                          }}>
                            {msg.content}
                          </div>
                        )}

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "5px" }}>
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="reaction-chip"
                                style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  padding: "2px 8px", borderRadius: "999px",
                                  background: users.includes(userId!) ? "var(--color-accent-dim)" : "var(--color-surface2)",
                                  border: users.includes(userId!) ? "1px solid var(--color-border-accent)" : "1px solid var(--color-border)",
                                  cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                                  color: users.includes(userId!) ? "var(--color-accent)" : "var(--color-text-muted)",
                                  transition: "all 0.12s",
                                }}
                              >
                                {emoji} <span style={{ fontSize: "11px", fontWeight: 600 }}>{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {!showSender && (
                          <span style={{ fontSize: "10px", color: "var(--color-text-dim)", marginTop: "2px" }}>
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>

                      {/* Hover actions */}
                      {hoveredMsg === msg.id && (
                        <div className="msg-action-btn"
                          style={{
                            display: "flex", alignItems: "center", gap: "3px",
                            position: "absolute", [isOwn ? "left" : "right"]: isOwn ? "42px" : "42px",
                            top: "0", background: "var(--color-elevated)",
                            border: "1px solid var(--color-border)", borderRadius: "8px",
                            padding: "3px 5px", zIndex: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id)}
                              style={{
                                width: "26px", height: "26px", borderRadius: "6px", background: "none",
                                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "14px", transition: "background 0.1s",
                              }}
                              title="React"
                            >😊</button>
                            {showEmojiFor === msg.id && (
                              <div className="emoji-picker" style={{
                                position: "absolute", [isOwn ? "right" : "left"]: "0", bottom: "34px",
                                background: "var(--color-elevated)", border: "1px solid var(--color-border)",
                                borderRadius: "10px", padding: "6px 8px",
                                display: "flex", gap: "4px", zIndex: 20,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                              }}>
                                {EMOJI_REACTIONS.map(e => (
                                  <button key={e} onClick={() => handleReaction(msg.id, e)}
                                    style={{
                                      fontSize: "18px", background: "none", border: "none",
                                      cursor: "pointer", padding: "2px 3px", borderRadius: "5px",
                                      transition: "transform 0.1s",
                                    }}
                                    onMouseEnter={e2 => (e2.currentTarget.style.transform = "scale(1.3)")}
                                    onMouseLeave={e2 => (e2.currentTarget.style.transform = "scale(1)")}
                                  >{e}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Panel */}
            {showAiPanel && (
              <div className="ai-panel" style={{
                width: "280px", flexShrink: 0,
                borderLeft: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "14px 16px", borderBottom: "1px solid var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "6px",
                      background: "var(--color-accent-dim)", border: "1px solid var(--color-border-accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg fill="none" stroke="var(--color-accent)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>AI Assistant</span>
                  </div>
                  <button onClick={() => setShowAiPanel(false)} className="ai-close"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "18px", lineHeight: 1 }}>
                    ×
                  </button>
                </div>

                <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-dim)", marginBottom: "10px", lineHeight: 1.5 }}>
                    Analyze the last 30 messages in this channel
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <button onClick={() => handleAI("summary")} className="ai-btn"
                      style={{
                        padding: "9px 12px", background: "var(--color-surface2)",
                        border: "1px solid var(--color-border)", borderRadius: "9px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        color: "var(--color-text-muted)", fontSize: "12.5px", fontFamily: "inherit",
                        transition: "all 0.15s", textAlign: "left", fontWeight: 500,
                      }}
                    >
                      <span style={{ fontSize: "15px" }}>📋</span>
                      Summarize discussion
                    </button>
                    <button onClick={() => handleAI("tasks")} className="ai-btn"
                      style={{
                        padding: "9px 12px", background: "var(--color-surface2)",
                        border: "1px solid var(--color-border)", borderRadius: "9px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        color: "var(--color-text-muted)", fontSize: "12.5px", fontFamily: "inherit",
                        transition: "all 0.15s", textAlign: "left", fontWeight: 500,
                      }}
                    >
                      <span style={{ fontSize: "15px" }}>✅</span>
                      Convert chat → tasks
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
                  {aiLoading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "24px 0", color: "var(--color-text-dim)" }}>
                      <div style={{ width: "20px", height: "20px", border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontSize: "12px" }}>Analyzing messages…</span>
                    </div>
                  )}
                  {!aiLoading && aiResult && (
                    <div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        marginBottom: "10px",
                      }}>
                        <span style={{ fontSize: "13px" }}>{aiResult.type === "summary" ? "📋" : "✅"}</span>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, color: "var(--color-accent)",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>
                          {aiResult.type === "summary" ? "Summary" : "Action Items"}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "12.5px", color: "var(--color-text-muted)", lineHeight: 1.65,
                        background: "var(--color-surface2)", border: "1px solid var(--color-border)",
                        borderRadius: "10px", padding: "12px 13px",
                        whiteSpace: "pre-wrap",
                      }}>
                        {aiResult.content}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(aiResult.content); }}
                        style={{
                          marginTop: "8px", width: "100%", padding: "6px",
                          background: "none", border: "1px solid var(--color-border)",
                          borderRadius: "7px", color: "var(--color-text-dim)", fontSize: "11px",
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  )}
                  {!aiLoading && !aiResult && (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-dim)", fontSize: "12px" }}>
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
                      <p>Choose an action above to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 20px", borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface)", flexShrink: 0,
          }}>
            <div className="chat-input-wrap" style={{
              display: "flex", alignItems: "flex-end", gap: "8px",
              background: "var(--color-surface2)", border: "1px solid var(--color-border)",
              borderRadius: "12px", padding: "8px 12px", transition: "all 0.15s",
            }}>
              {/* File attach */}
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} className="tool-btn"
                style={{
                  width: "30px", height: "30px", borderRadius: "7px", background: "none",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-text-dim)", transition: "all 0.15s", flexShrink: 0, alignSelf: "flex-end",
                }}
                title="Attach file"
              >
                <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>

              <textarea
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={`Message #${activeRoom?.name ?? "channel"}`}
                rows={1}
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "var(--color-text-primary)", fontSize: "13.5px",
                  fontFamily: "inherit", resize: "none", lineHeight: 1.55,
                  maxHeight: "120px", overflowY: "auto", padding: "4px 0",
                }}
              />

              <button onClick={sendMessage} disabled={!input.trim()}
                className={input.trim() ? "send-btn-active" : ""}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: input.trim() ? "var(--color-accent)" : "var(--color-surface)",
                  border: `1px solid ${input.trim() ? "transparent" : "var(--color-border)"}`,
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", flexShrink: 0,
                }}
              >
                <svg fill="none" stroke={input.trim() ? "#022C22" : "var(--color-text-dim)"} strokeWidth={2} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ fontSize: "10px", color: "var(--color-text-dim)", marginTop: "5px", textAlign: "center" }}>
              Enter to send · Shift+Enter for new line · Hover messages to react
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
