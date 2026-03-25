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
};

type Room = {
  id: string;
  name: string;
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      setUserName(profile?.full_name ?? session.user.email?.split("@")[0] ?? "Anonymous");

      const { data: roomsData } = await supabase
        .from("chat_rooms")
        .select("*")
        .order("created_at", { ascending: true });

      const roomList = roomsData ?? [];
      setRooms(roomList);
      if (roomList.length > 0) {
        setActiveRoom(roomList[0]);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    // Load messages for this room
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", activeRoom.id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages(data ?? []);
    };
    loadMessages();

    // Unsubscribe previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`room:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom || !userId) return;

    const content = input.trim();
    setInput("");

    await supabase.from("chat_messages").insert({
      room_id: activeRoom.id,
      user_id: userId,
      sender_name: userName,
      content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !userId) return;
    const { data } = await supabase
      .from("chat_rooms")
      .insert({ name: newRoomName.trim().toLowerCase().replace(/\s+/g, "-"), created_by: userId })
      .select()
      .single();
    if (data) {
      setRooms(prev => [...prev, data]);
      setActiveRoom(data);
      setNewRoomName("");
      setShowNewRoom(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div style={{ color: "rgba(230,230,230,0.3)", fontSize: "14px" }}>Loading chat...</div>
  );

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 64px)",
      gap: "0",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.02)",
    }}>

      {/* Sidebar — Rooms */}
      <div style={{
        width: "220px",
        flexShrink: 0,
        background: "rgba(15,15,16,0.8)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
      }}>
        <div style={{ padding: "0 16px", marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(230,230,230,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Channels
          </p>
        </div>

        {/* Room list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {rooms.map(room => (
            <div
              key={room.id}
              onClick={() => setActiveRoom(room)}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                background: activeRoom?.id === room.id ? "rgba(99,91,255,0.14)" : "transparent",
                borderLeft: activeRoom?.id === room.id ? "2px solid #635BFF" : "2px solid transparent",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "rgba(230,230,230,0.4)" }}>#</span>
              <span style={{
                fontSize: "13px",
                color: activeRoom?.id === room.id ? "#a89fff" : "rgba(230,230,230,0.5)",
                fontWeight: activeRoom?.id === room.id ? 500 : 400,
              }}>
                {room.name}
              </span>
            </div>
          ))}
        </div>

        {/* New room */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {showNewRoom ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <input
                type="text"
                placeholder="room-name"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createRoom()}
                autoFocus
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(99,91,255,0.3)",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={createRoom} style={{ flex: 1, padding: "4px", background: "rgba(99,91,255,0.2)", border: "1px solid rgba(99,91,255,0.3)", borderRadius: "5px", color: "#a89fff", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                  Create
                </button>
                <button onClick={() => setShowNewRoom(false)} style={{ flex: 1, padding: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "5px", color: "rgba(230,230,230,0.4)", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewRoom(true)}
              style={{
                width: "100%", padding: "6px 8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "7px",
                color: "rgba(230,230,230,0.4)",
                fontSize: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span>
              Add channel
            </button>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Chat header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(15,15,16,0.5)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "16px", color: "rgba(230,230,230,0.4)" }}>#</span>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
            {activeRoom?.name ?? "Select a channel"}
          </span>
          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "rgba(230,230,230,0.3)",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
            Live
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(230,230,230,0.2)", fontSize: "13px" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>💬</div>
              No messages yet — be the first to say something!
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.user_id === userId;
            const prevMsg = messages[i - 1];
            const showDate = !prevMsg || formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
            const showSender = !prevMsg || prevMsg.user_id !== msg.user_id || showDate;

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDate && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    margin: "12px 0 8px",
                  }}>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ fontSize: "11px", color: "rgba(230,230,230,0.3)", whiteSpace: "nowrap" }}>
                      {formatDate(msg.created_at)}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  </div>
                )}

                <div style={{
                  display: "flex",
                  flexDirection: isOwn ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "8px",
                  marginTop: showSender ? "12px" : "2px",
                }}>
                  {/* Avatar */}
                  {showSender && (
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: isOwn ? "linear-gradient(135deg, #635BFF, #3B82F6)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {msg.sender_name[0]?.toUpperCase()}
                    </div>
                  )}
                  {!showSender && <div style={{ width: "32px", flexShrink: 0 }} />}

                  <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                    {showSender && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexDirection: isOwn ? "row-reverse" : "row" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: isOwn ? "#a89fff" : "rgba(230,230,230,0.7)" }}>
                          {isOwn ? "You" : msg.sender_name}
                        </span>
                        <span style={{ fontSize: "10px", color: "rgba(230,230,230,0.25)" }}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div style={{
                      padding: "9px 13px",
                      borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: isOwn ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.06)",
                      border: isOwn ? "1px solid rgba(99,91,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      fontSize: "13.5px",
                      color: "#e6e6e6",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>

                    {!showSender && (
                      <span style={{ fontSize: "10px", color: "rgba(230,230,230,0.2)", marginTop: "2px" }}>
                        {formatTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(15,15,16,0.5)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "12px",
            padding: "10px 14px",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeRoom?.name ?? "channel"}`}
              rows={1}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "#e6e6e6",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "none",
                lineHeight: 1.5,
                maxHeight: "120px",
                overflowY: "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                width: "34px", height: "34px", borderRadius: "8px",
                background: input.trim() ? "linear-gradient(135deg, #635BFF, #3B82F6)" : "rgba(255,255,255,0.06)",
                border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
                boxShadow: input.trim() ? "0 4px 12px rgba(99,91,255,0.3)" : "none",
              }}
            >
              <svg fill="none" stroke={input.trim() ? "#fff" : "rgba(230,230,230,0.3)"} strokeWidth={2} viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize: "10.5px", color: "rgba(230,230,230,0.2)", marginTop: "6px", textAlign: "center" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
