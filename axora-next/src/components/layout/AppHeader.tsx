"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects":  "Projects",
  "/teams":     "Teams",
  "/chat":      "Chat",
};

export function AppHeader() {
  const pathname = usePathname();
  const current = labels[pathname] ?? "Dashboard";

  return (
    <header className="h-[60px] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-8 bg-[rgba(5,5,5,0.8)] backdrop-blur-2xl sticky top-0 z-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-dim">Axora</span>
        <span className="text-text-dim">›</span>
        <span className="text-text-primary font-medium">{current}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[10px]">
        {/* Search */}
        <button className="w-[34px] h-[34px] rounded-[9px] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary hover:border-[rgba(255,255,255,0.12)] transition-all duration-200">
          <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="w-[15px] h-[15px]">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        {/* Notifications */}
        <button className="w-[34px] h-[34px] rounded-[9px] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary hover:border-[rgba(255,255,255,0.12)] transition-all duration-200">
          <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="w-[15px] h-[15px]">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <Link href="/projects">
          <Button variant="primary" size="sm">+ New</Button>
        </Link>
      </div>
    </header>
  );
}
