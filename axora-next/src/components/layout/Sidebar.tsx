"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { NAV_ITEMS } from "@/lib/data";
import { clsx } from "clsx";
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
  const { theme, setTheme, resolvedTheme } = useTheme();
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

  // ── Resolved theme for conditional inline styles ──
  const isDark = !mounted || resolvedTheme === "dark";

  const sidebarBg    = isDark ? "rgba(15,15,16,0.95)"  : "rgba(255,255,255,0.97)";
  const borderColor  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const dropdownBg   = isDark ? "rgba(15,15,16,0.98)"  : "rgba(255,255,255,0.99)";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const dropdownShadow = isDark
    ? "0 -8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
    : "0 -8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)";
  const textPrimary  = isDark ? "#fff"                  : "#111";
  const textMuted    = isDark ? "rgba(230,230,230,0.4)" : "rgba(0,0,0,0.4)";
  const textSub      = isDark ? "rgba(230,230,230,0.6)" : "rgba(0,0,0,0.55)";
  const hoverBg      = isDark ? "rgba(255,255,255,0.05)": "rgba(0,0,0,0.05)";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)": "rgba(0,0,0,0.07)";
  const themeBtnBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)";
  const themeBtnBg   = isDark ? "rgba(255,255,255,0.03)"  : "rgba(0,0,0,0.03)";

  return (
    <aside
      style={{
        background: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
      }}
      className="fixed top-0 left-0 h-full w-[220px] flex flex-col px-3 py-5 z-50 backdrop-blur-2xl"
    >
      {/* Logo */}

<div
  style={{ borderBottom: `1px solid ${borderColor}` }}
  className="flex items-center px-[10px] pb-5 mb-2"
>
  <Link href="/" prefetch={true}>
 <img
  src="/axora-logo.png"
  alt="Axora"
  className="h-9 w-auto object-contain"
/>
  </Link>
</div>
      {/* Main nav */}
      {/* Main nav */}
<div className="mt-5 overflow-y-auto flex-1 scrollbar-none">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] px-[10px] mb-[6px]" style={{ color: textMuted }}>
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} prefetch={true}>
              <div
                className="flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-sm font-normal mb-[2px] transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? "rgba(99,91,255,0.14)" : "transparent",
                  color: isActive ? "#a89fff" : textSub,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = hoverBg;
                    (e.currentTarget as HTMLDivElement).style.color = textPrimary;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.color = textSub;
                  }
                }}
              >
                {icons[item.icon]}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-white text-[0.7rem] px-[6px] py-[1px] rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recents */}
      <div className="mt-5">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] px-[10px] mb-[6px]" style={{ color: textMuted }}>
          Recents
        </p>
        {["Axora v2 Launch", "Design System"].map((item) => (
          <div
            key={item}
            className="flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-[0.82rem] transition-all duration-200 cursor-pointer mb-[2px]"
            style={{ color: textSub }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = hoverBg;
              (e.currentTarget as HTMLDivElement).style.color = textPrimary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
              (e.currentTarget as HTMLDivElement).style.color = textSub;
            }}
          >
            {icons.clock}
            {item}
          </div>
        ))}
      </div>

      {/* User section with dropdown */}
      <div
        className="mt-auto pt-4"
        style={{ borderTop: `1px solid ${borderColor}` }}
        ref={dropdownRef}
      >
        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            bottom: "70px",
            left: "12px",
            right: "12px",
            background: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            borderRadius: "14px",
            padding: "14px",
            boxShadow: dropdownShadow,
            backdropFilter: "blur(20px)",
            zIndex: 100,
          }}>
            {/* User info */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "12px", paddingBottom: "12px",
              borderBottom: `1px solid ${dividerColor}`,
            }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "linear-gradient(135deg, #635BFF, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", fontWeight: 700, color: "#fff", flexShrink: 0,
                boxShadow: "0 0 14px rgba(99,91,255,0.4)",
              }}>
                {initials}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: "11px", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userEmail}
                </div>
                {role && (
                  <div style={{
                    display: "inline-block", marginTop: "3px",
                    fontSize: "9px", fontWeight: 600,
                    color: "rgba(99,91,255,0.9)",
                    background: "rgba(99,91,255,0.12)",
                    border: "1px solid rgba(99,91,255,0.25)",
                    borderRadius: "4px", padding: "1px 6px",
                    letterSpacing: "0.04em",
                  }}>
                    {role}
                  </div>
                )}
              </div>
            </div>

            {/* View Profile */}
            <Link
              href="/profile"
              prefetch={true}
              onClick={() => setShowDropdown(false)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 10px", borderRadius: "8px",
                color: textSub, fontSize: "13px",
                textDecoration: "none", marginBottom: "2px",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = hoverBg;
                (e.currentTarget as HTMLAnchorElement).style.color = textPrimary;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = textSub;
              }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                <circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/>
              </svg>
              View Profile
            </Link>

            {/* Theme switcher */}
            <div style={{ marginBottom: "8px" }}>
              <div style={{
                padding: "6px 10px 6px",
                fontSize: "10px", fontWeight: 600,
                color: textMuted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                Theme
              </div>
              <div style={{ display: "flex", gap: "4px", padding: "0 2px" }}>
                {mounted && THEMES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      padding: "7px 4px",
                      borderRadius: "8px",
                      border: theme === t.value
                        ? "1px solid rgba(99,91,255,0.5)"
                        : `1px solid ${themeBtnBorder}`,
                      background: theme === t.value
                        ? "rgba(99,91,255,0.14)"
                        : themeBtnBg,
                      color: theme === t.value ? "#a89fff" : textSub,
                      fontSize: "10px",
                      fontWeight: theme === t.value ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: dividerColor, marginBottom: "8px" }} />

            {/* Logout */}
            <div
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 10px", borderRadius: "8px",
                color: "rgba(239,68,68,0.8)", fontSize: "13px",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(239,68,68,0.08)";
                (e.currentTarget as HTMLDivElement).style.color = "#ef4444";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
                (e.currentTarget as HTMLDivElement).style.color = "rgba(239,68,68,0.8)";
              }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </div>
          </div>
        )}

        {/* User row */}
        <div
          onClick={() => setShowDropdown(v => !v)}
          className="flex items-center gap-[10px] px-[10px] py-2 rounded-[10px] transition-all duration-200 cursor-pointer"
          style={{ color: textPrimary }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = hoverBg}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
        >
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[0.85rem] font-medium" style={{ color: textPrimary }}>
              {displayName}
            </div>
            <div className="text-[0.75rem]" style={{ color: textMuted }}>Pro plan</div>
          </div>
          <svg
            className="ml-auto w-3 h-3"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{
              color: textMuted,
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </aside>
  );
}
