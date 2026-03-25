import { SectionLabel } from "@/components/ui/SectionLabel";
import { TESTIMONIALS } from "@/lib/data";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative z-10 py-[120px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>✦ Testimonials</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1]">
            Loved by teams worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="scroll-reveal bg-surface border border-[rgba(255,255,255,0.06)] rounded-[20px] p-7
                         hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-[2px] hover:shadow-sm transition-all duration-200"
            >
              <div className="text-[#fbbf24] text-xs mb-1">★★★★★</div>
              <p className="text-text-muted text-[0.92rem] leading-[1.75] font-light mb-6">
                <span className="block font-display text-[2rem] text-primary leading-none mb-2">"</span>
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0"
                  style={{ background: t.gradient }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{t.name}</div>
                  <div className="text-[0.8rem] text-text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
