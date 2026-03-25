import { SectionLabel } from "@/components/ui/SectionLabel";
import { FEATURES } from "@/lib/data";
import { clsx } from "clsx";

const iconBg = {
  purple: "bg-[rgba(99,91,255,0.15)]",
  blue:   "bg-[rgba(63,208,255,0.12)]",
  pink:   "bg-[rgba(255,92,138,0.1)]",
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-[120px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>✦ Features</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] mb-4">
            Everything your team<br />needs, nothing it doesn't
          </h2>
          <p className="text-text-muted text-[1.05rem] font-light max-w-md mx-auto">
            Replace six tools with one. Axora's AI-first design keeps your team focused, not context-switching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className="scroll-reveal group relative bg-surface border border-[rgba(255,255,255,0.06)] rounded-[20px] p-8 overflow-hidden
                         hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-[2px] hover:shadow-card transition-all duration-200"
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[rgba(99,91,255,0.04)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className={clsx("relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-xl", iconBg[f.color])}>
                {f.icon}
              </div>
              <h3 className="relative font-display text-[1.05rem] font-semibold tracking-tight mb-[10px]">{f.title}</h3>
              <p className="relative text-text-muted text-sm leading-[1.65] font-light">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
