"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,5,0.7)] backdrop-blur-xl transition-all duration-200 ${
        scrolled ? "h-14" : "h-[68px]"
      }`}
    >
      {/* Logo */}
    <img
  src="/axora-logo.png"
  alt="Axora"
  className="h-8 w-auto object-contain"
/>
      {/* Links */}
      <ul className="hidden md:flex gap-8 list-none">
        {["Features", "How it works", "Customers"].map((item) => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase().replace(/\s+/g, "")}`}
              className="text-text-muted text-sm hover:text-text-primary transition-colors duration-200"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>

      {/* CTAs + Theme toggle */}
      <div className="flex items-center gap-3">

        {/* Theme toggle button */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
            title={`Current: ${theme} — click to switch`}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,91,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,91,255,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            {theme === "dark" && (
              <svg fill="none" stroke="#a89fff" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {theme === "light" && (
              <svg fill="none" stroke="#f59e0b" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            )}
            {theme === "system" && (
              <svg fill="none" stroke="#60a5fa" strokeWidth={1.7} viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            )}
          </button>
        )}

        <Link href="/login">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="primary" size="sm">Get started free</Button>
        </Link>
      </div>
    </nav>
  );
}
