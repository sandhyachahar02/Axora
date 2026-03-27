"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { NAV_ITEMS } from "@/lib/data";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/context/AuthContext";

const icons: Record<string, React.ReactNode> = {
  grid: (
    <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  list: (
    <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="w-4 h-4">
      <path d="M3 7h18M3 12h18M3 17h18"/>
    </svg>
  ),
  users: (
    <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="w-4 h-4">
      <circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/>
      <path d="M1 20v-1a7 7 0 0 1 14 0v1"/><path d="M17 11a5 5 0 0 1 5 5v1"/>
    </svg>
  ),
  message: (
    <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  clock: (
    <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

const THEMES = [
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { fullName, userEmail } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const getRole = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();
        setRole(profile?.role ?? null);
      }
    };
    getRole();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = fullName
    ? fullName[0].toUpperCase()
    : userEmail
    ? userEmail.split("@")[0][0].toUpperCase()
    : "?";

  const displayName = fullName ?? (userEmail ? userEmail.split("@")[0] : "Loading...");

  return (
    <>
      {/* ── Sidebar styles using CSS variables only ── */}
      <style>{`
        .sidebar-root {
          background: var(--color-sidebar-bg);
          border-right: 1px solid var(--color-border);
        }
        .sidebar-logo-divider {
          border-bottom: 1px solid var(--color-border);
        }
        .sidebar-section-label {
          color: var(--color-text-dim);
        }
        .sidebar-nav-item {
          color: var(--color-text-muted);
          background: transparent;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sidebar-nav-item:hover {
          background: var(--color-accent-dim);
          color: var(--color-text-primary);
        }
        .sidebar-nav-item.active {
          background: var(--color-accent-dim);
          color: var(--color-accent);
          font-weight: 500;
        }
        .sidebar-nav-item.active svg {
          color: var(--color-accent);
        }
        .sidebar-recent-item {
          color: var(--color-text-muted);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sidebar-recent-item:hover {
          background: var(--color-accent-dim);
          color: var(--color-text-primary);
        }
        .sidebar-user-row {
          color: var(--color-text-primary);
          transition: background 0.15s ease;
        }
        .sidebar-user-row:hover {
          background: var(--color-accent-dim);
        }
        .sidebar-user-border {
          border-top: 1px solid var(--color-border);
        }
        /* Dropdown */
        .sidebar-dropdown {
          background: var(--color-elevated);
          border: 1px solid var(--color-border-hover);
          box-shadow: 0 -8px 32px rgba(0,0,0,0.3), 0 0 0 1px var(--color-border);
        }
        .sidebar-dropdown-divider {
          background: var(--color-border);
        }
        .sidebar-dropdown-header {
          border-bottom: 1px solid var(--color-border);
        }
        .sidebar-dropdown-name {
          color: var(--color-text-primary);
          font-size: 13px;
          font-weight: 600;
        }
        .sidebar-dropdown-email {
          color: var(--color-text-muted);
          font-size: 11px;
        }
        .sidebar-dropdown-role {
          color: var(--color-accent);
          background: var(--color-accent-dim);
          border: 1px solid var(--color-border-accent);
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          display: inline-block;
          margin-top: 3px;
        }
        .sidebar-dropdown-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          margin-bottom: 2px;
        }
        .sidebar-dropdown-link:hover {
          background: var(--color-accent-dim);
          color: var(--color-text-primary);
        }
        .sidebar-dropdown-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          color: rgba(239,68,68,0.8);
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-dropdown-logout:hover {
          background: rgba(239,68,68,0.08);
          color: #ef4444;
        }
        /* Theme switcher buttons */
        .theme-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 7px 4px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-size: 10px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .theme-btn:hover {
          border-color: var(--color-border-hover);
          color: var(--color-text-primary);
        }
        .theme-btn.active {
          border-color: var(--color-accent);
          background: var(--color-accent-dim);
          color: var(--color-accent);
          font-weight: 600;
        }
        .theme-label {
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        /* Avatar */
        .sidebar-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #022C22;
          flex-shrink: 0;
        }
        .sidebar-avatar-lg {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: #022C22;
          flex-shrink: 0;
        }
        /* Badge */
        .sidebar-badge {
          background: var(--color-accent);
          color: #022C22;
          font-size: 0.7rem;
          padding: 1px 6px;
          border-radius: 999px;
          font-weight: 700;
        }
         /* Dark theme (default): white text is visible as-is */
.axora-text-logo {
  filter: none;
}

/* Light theme: invert white → dark so it's readable */
.light .axora-text-logo {
  filter: brightness(0) saturate(100%);
}
}
      `}</style>

      <aside className="sidebar-root fixed top-0 left-0 h-full w-[220px] flex flex-col px-3 py-5 z-50 backdrop-blur-2xl">

        {/* ── Logo ── */}
        <div className="sidebar-logo-divider flex items-center px-[10px] pb-5 mb-2">
  <Link href="/" prefetch={true}>
 {/* Logo: icon always keeps color, text turns dark on light theme */}
<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
  <Link href="/">
  <img
    src="/axora-logo-final.png"
    alt="Axora"
    className="axora-logo"
    style={{ height: "32px", width: "auto", objectFit: "contain" }}
  />
</Link>
</div>
  </Link>
</div>

        {/* ── Main nav ── */}
        <div className="mt-5 overflow-y-auto flex-1 scrollbar-none">
          <p className="sidebar-section-label text-[0.7rem] font-medium uppercase tracking-[0.08em] px-[10px] mb-[6px]">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} prefetch={true}>
                <div className={`sidebar-nav-item flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-sm mb-[2px] cursor-pointer${isActive ? " active" : ""}`}>
                  {icons[item.icon]}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge ml-auto">{item.badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Recents ── */}
        <div className="mt-5">
          <p className="sidebar-section-label text-[0.7rem] font-medium uppercase tracking-[0.08em] px-[10px] mb-[6px]">
            Recents
          </p>
          {["Axora v2 Launch", "Design System"].map((item) => (
            <div
              key={item}
              className="sidebar-recent-item flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-[0.82rem] cursor-pointer mb-[2px]"
            >
              {icons.clock}
              {item}
            </div>
          ))}
        </div>

        {/* ── User section ── */}
        <div className="sidebar-user-border mt-auto pt-4" ref={dropdownRef}>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="sidebar-dropdown"
              style={{
                position: "absolute",
                bottom: "70px",
                left: "12px",
                right: "12px",
                borderRadius: "14px",
                padding: "14px",
                backdropFilter: "blur(20px)",
                zIndex: 100,
              }}
            >
              {/* User info */}
              <div className="sidebar-dropdown-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingBottom: "12px" }}>
                <div className="sidebar-avatar-lg">{initials}</div>
                <div style={{ overflow: "hidden" }}>
                  <div className="sidebar-dropdown-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  <div className="sidebar-dropdown-email" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userEmail}
                  </div>
                  {role && <span className="sidebar-dropdown-role">{role}</span>}
                </div>
              </div>

              {/* View Profile */}
              <Link href="/profile" prefetch={true} onClick={() => setShowDropdown(false)} className="sidebar-dropdown-link">
                <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/>
                </svg>
                View Profile
              </Link>

              {/* Theme switcher */}
              <div>
                <div className="theme-label">Theme</div>
                <div style={{ display: "flex", gap: "4px", padding: "0 2px" }}>
                  {mounted && THEMES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`theme-btn${theme === t.value ? " active" : ""}`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="sidebar-dropdown-divider" style={{ height: "1px", margin: "10px 0" }} />

              {/* Logout */}
              <div className="sidebar-dropdown-logout" onClick={handleLogout}>
                <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </div>
            </div>
          )}

          {/* User row */}
          <div
            onClick={() => setShowDropdown(v => !v)}
            className="sidebar-user-row flex items-center gap-[10px] px-[10px] py-2 rounded-[10px] cursor-pointer"
          >
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="text-[0.85rem] font-medium" style={{ color: "var(--color-text-primary)" }}>
                {displayName}
              </div>
              <div className="text-[0.75rem]" style={{ color: "var(--color-text-dim)" }}>Pro plan</div>
            </div>
            <svg
              className="ml-auto w-3 h-3"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              style={{
                color: "var(--color-text-dim)",
                transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}
