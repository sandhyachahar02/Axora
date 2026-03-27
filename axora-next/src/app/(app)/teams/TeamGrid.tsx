"use client";

import { useState } from "react";
import { TEAMS } from "@/lib/data";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface Team {
  id: number | string;
  name: string;
  memberCount: number;
  avatarColors: string[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   TeamCard
───────────────────────────────────────────────────────────────────────────── */
function TeamCard({ team, index }: { team: Team; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="team-card"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Top accent line */}
      <div className="team-card-accent-line" style={{ opacity: hovered ? 0.9 : 0.3 }} />

      {/* Glow blob */}
      <div className="team-card-glow" style={{ opacity: hovered ? 0.08 : 0.02 }} />

      <div className="team-card-body">

        {/* Avatar stack */}
        <div className="team-avatar-stack">
          {team.avatarColors.slice(0, 5).map((color, i) => {
            const total = Math.min(team.avatarColors.length, 5);
            const spreadPx = Math.min(total - 1, 4) * 20;
            const startX = -spreadPx / 2;
            return (
              <div
                key={i}
                className="team-avatar"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`,
                  left: startX + i * 20,
                  zIndex: i,
                  transform: hovered ? `translateY(${i % 2 === 0 ? -2 : 1}px)` : "none",
                  transitionDelay: `${i * 30}ms`,
                }}
              />
            );
          })}
        </div>

        {/* Info */}
        <div className="team-card-info">
          <h3 className="team-card-name">{team.name}</h3>
          <div className="team-member-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{team.memberCount} members</span>
          </div>
        </div>

        {/* CTA row */}
        <div className="team-card-cta">
          <button className={`team-view-btn${hovered ? " hovered" : ""}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            View Team
          </button>

          <button className={`team-invite-btn${hovered ? " hovered" : ""}`} title="Invite member">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </button>
        </div>

      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AI Matcher CTA card
───────────────────────────────────────────────────────────────────────────── */
function AIMatcherCard({ index }: { index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`team-ai-card${hovered ? " hovered" : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className={`team-ai-icon${hovered ? " hovered" : ""}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      <div className="team-ai-text">
        <h3 className={`team-ai-title${hovered ? " hovered" : ""}`}>Find your next crew</h3>
        <p className="team-ai-sub">AI matches you with experts based on your stack and goals.</p>
      </div>

      <span className={`team-ai-cta${hovered ? " hovered" : ""}`}>
        Run AI Matcher
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: hovered ? "translateX(3px)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TeamGrid
───────────────────────────────────────────────────────────────────────────── */
export function TeamGrid() {
  return (
    <>
      <style>{`
        /* ── Animations ── */
        @keyframes teamFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header ── */
        .team-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 28px;
          animation: teamFadeUp 0.4s cubic-bezier(.22,.68,0,1.2) both;
        }
        .team-header-eyebrow {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--color-accent);
          margin-bottom: 6px;
        }
        .team-header-title {
          font-size: 1.55rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.03em;
          color: var(--color-text-primary);
        }
        .team-new-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          color: #022C22;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .team-new-btn:hover {
          box-shadow: 0 6px 24px rgba(16,185,129,0.45);
          transform: translateY(-1px);
        }
        .team-new-btn:active { transform: translateY(0); }

        /* ── Stats strip ── */
        .team-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 28px;
          animation: teamFadeUp 0.45s cubic-bezier(.22,.68,0,1.2) 0.05s both;
        }
        .team-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          background: var(--color-card-bg);
          border: 1px solid var(--color-border);
          transition: border-color 0.2s, transform 0.2s;
        }
        .team-stat-item:hover {
          border-color: var(--color-border-hover);
          transform: translateY(-1px);
        }
        .team-stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
          font-feature-settings: 'tnum';
        }
        .team-stat-label {
          font-size: 0.72rem;
          line-height: 1.35;
          color: var(--color-text-dim);
        }

        /* ── Grid ── */
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        @media (max-width: 640px) {
          .team-grid { grid-template-columns: 1fr; }
          .team-stats { grid-template-columns: repeat(3, 1fr); }
          .team-header { flex-direction: column; align-items: flex-start; }
          .team-new-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .team-stats { grid-template-columns: 1fr; }
          .team-stat-item { padding: 10px 14px; }
        }

        /* ── TeamCard ── */
        .team-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          animation: teamFadeUp 0.5s cubic-bezier(.22,.68,0,1.2) both;
          background: var(--color-card-bg);
          border: 1px solid var(--color-border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .team-card:hover {
          border-color: var(--color-border-hover);
          box-shadow: 0 8px 28px rgba(16,185,129,0.12);
          transform: translateY(-3px);
        }
        .team-card-accent-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
          transition: opacity 0.3s;
        }
        .team-card-glow {
          position: absolute;
          top: -30px; right: -30px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: var(--color-accent);
          filter: blur(40px);
          pointer-events: none;
          transition: opacity 0.4s;
        }
        .team-card-body {
          position: relative;
          z-index: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        /* Avatar stack */
        .team-avatar-stack {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          width: 100%;
        }
        .team-avatar {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.3s ease;
        }

        /* Card info */
        .team-card-info { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .team-card-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .team-member-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          font-size: 0.72rem;
          font-weight: 500;
        }

        /* CTA */
        .team-card-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .team-view-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          transition: all 0.2s;
        }
        .team-view-btn.hovered {
          background: var(--color-accent-dim);
          border-color: var(--color-border-hover);
          color: var(--color-accent);
        }
        .team-invite-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          font-family: inherit;
          cursor: pointer;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .team-invite-btn.hovered {
          background: var(--color-accent-dim);
          border-color: var(--color-border-hover);
          color: var(--color-accent);
        }

        /* ── AI Matcher card ── */
        .team-ai-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          animation: teamFadeUp 0.5s cubic-bezier(.22,.68,0,1.2) both;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 20px;
          gap: 14px;
          min-height: 220px;
          background: var(--color-card-bg);
          border: 1px dashed var(--color-border);
          transition: all 0.3s cubic-bezier(.22,.68,0,1.2);
        }
        .team-ai-card.hovered {
          border-color: var(--color-border-hover);
          background: var(--color-accent-dim);
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(16,185,129,0.1);
        }
        .team-ai-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          transition: all 0.3s;
        }
        .team-ai-icon.hovered {
          background: var(--color-accent-dim);
          border-color: var(--color-border-hover);
          color: var(--color-accent);
          box-shadow: 0 0 20px rgba(16,185,129,0.15);
          transform: scale(1.05);
        }
        .team-ai-text { display: flex; flex-direction: column; gap: 6px; }
        .team-ai-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text-dim);
          transition: color 0.2s;
        }
        .team-ai-title.hovered { color: var(--color-text-primary); }
        .team-ai-sub {
          font-size: 0.75rem;
          line-height: 1.5;
          color: var(--color-text-dim);
          max-width: 170px;
          margin: 0 auto;
        }
        .team-ai-cta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-dim);
          transition: color 0.2s;
        }
        .team-ai-cta.hovered { color: var(--color-accent); }
      `}</style>

      {/* ── Header ── */}
      <div className="team-header">
        <div>
          <p className="team-header-eyebrow">Workspace</p>
          <h2 className="team-header-title font-display">All Teams</h2>
        </div>

        <button className="team-new-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Team
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="team-stats">
        {[
          { label: "Total Teams",       value: TEAMS.length,                          color: "var(--color-accent)"      },
          { label: "Active Now",        value: TEAMS.length,                          color: "var(--color-accent-soft)" },
          { label: "Open Spots",        value: Math.floor(TEAMS.length * 1.4),        color: "var(--color-accent)"      },
        ].map((s) => (
          <div key={s.label} className="team-stat-item">
            <span className="team-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="team-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="team-grid">
        {TEAMS.map((team, i) => (
          <TeamCard key={team.id} team={team} index={i} />
        ))}
        <AIMatcherCard index={TEAMS.length} />
      </div>
    </>
  );
}
