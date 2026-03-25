import { STATS } from "@/lib/data";
import type { Stat } from "@/types";
import { clsx } from "clsx";

const colorMap: Record<Stat["color"], { icon: string; corner: string; delta: string }> = {
  purple: {
    icon: "bg-[rgba(99,91,255,0.15)]",
    corner: "bg-primary",
    delta: "text-success",
  },
  blue: {
    icon: "bg-[rgba(63,208,255,0.12)]",
    corner: "bg-secondary",
    delta: "text-success",
  },
  green: {
    icon: "bg-[rgba(52,211,153,0.12)]",
    corner: "bg-success",
    delta: "text-success",
  },
  pink: {
    icon: "bg-[rgba(255,92,138,0.1)]",
    corner: "bg-accent",
    delta: "text-text-muted",
  },
};

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
      {STATS.map((stat) => {
        const c = colorMap[stat.color];
        return (
          <div
            key={stat.id}
            className="relative bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-[22px] overflow-hidden transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-px cursor-default group"
          >
            {/* Corner accent */}
            <div
              className={clsx(
                "absolute top-0 right-0 w-[60px] h-[60px] rounded-bl-[60px] rounded-tr-2xl opacity-[0.08] transition-opacity duration-200 group-hover:opacity-[0.14]",
                c.corner
              )}
            />
            {/* Icon */}
            <div className={clsx("w-9 h-9 rounded-[10px] flex items-center justify-center text-base mb-4", c.icon)}>
              {stat.icon}
            </div>
            {/* Value */}
            <div className="font-display text-[2rem] font-extrabold tracking-[-0.04em] leading-none mb-[6px]">
              {stat.value}
            </div>
            {/* Label */}
            <div className="text-[0.82rem] text-text-muted">{stat.label}</div>
            {/* Delta */}
            <div className={clsx("text-[0.75rem] mt-2 flex items-center gap-1", c.delta)}>
              {stat.delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
