"use client";

import { useState, useRef, useEffect } from "react";
import { CHAT_CHANNELS, CHAT_MESSAGES } from "@/lib/data";
import type { ChatMessage } from "@/types";
import { clsx } from "clsx";

export function ChatLayout() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [channels, setChannels] = useState(CHAT_CHANNELS);
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "Alex Rivera",
      initials: "A",
      avatarGradient: "linear-gradient(135deg,#635BFF,#3FD0FF)",
      time: now,
      text,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchChannel = (id: string) => {
    setActiveChannel(id);
    // Clear unread badge on switch
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, unread: undefined } : ch))
    );
  };

  const currentChannel = channels.find((c) => c.id === activeChannel);

  return (
    <div
      className="flex bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden"
      style={{ height: "calc(100vh - 60px - 72px - 60px)" }}
    >
      {/* ── Channel sidebar ── */}
      <aside className="w-[220px] border-r border-[rgba(255,255,255,0.06)] flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.06)] font-display text-[0.88rem] font-semibold">
          Channels
        </div>
        <nav className="p-[10px] flex-1 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch.id)}
              className={clsx(
                "w-full flex items-center gap-[9px] px-[10px] py-2 rounded-[8px] text-[0.85rem] transition-all duration-200 mb-[2px] text-left",
                activeChannel === ch.id
                  ? "bg-[rgba(99,91,255,0.12)] text-[#a89fff]"
                  : "text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary"
              )}
            >
              <span className="opacity-60 text-[0.9rem]">#</span>
              <span className="flex-1">{ch.name}</span>
              {ch.unread && (
                <span className="w-[18px] h-[18px] bg-primary text-white rounded-full flex items-center justify-center text-[0.65rem] font-semibold">
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Message area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-[14px] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-[10px] text-[0.88rem] font-medium">
          <span className="text-text-muted text-base">#</span>
          <span className="font-display">{currentChannel?.name}</span>
          <span className="text-text-dim text-[0.78rem] ml-2">· 3 members online</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 items-start">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold text-white"
                style={{ background: msg.avatarGradient }}
              >
                {msg.initials}
              </div>

              {/* Content */}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[0.85rem] font-medium text-text-primary">{msg.author}</span>
                  <span className="text-[0.72rem] text-text-dim">{msg.time}</span>
                </div>
                <p className="text-[0.88rem] text-text-muted leading-relaxed font-light">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-[10px] bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-[14px] py-[10px] focus-within:border-[rgba(99,91,255,0.4)] transition-colors duration-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${currentChannel?.name ?? "general"}...`}
              className="flex-1 bg-transparent border-none outline-none text-text-primary text-[0.88rem] placeholder:text-text-dim font-light"
            />
            <button
              onClick={sendMessage}
              className="w-[30px] h-[30px] bg-primary hover:bg-[#7269ff] rounded-[8px] flex items-center justify-center text-white transition-all duration-200 hover:-translate-y-px flex-shrink-0"
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
