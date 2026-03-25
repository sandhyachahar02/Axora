import { SectionLabel } from "@/components/ui/SectionLabel";
import { STEPS } from "@/lib/data";

export function HowItWorksSection() {
  return (
    <section
      id="howitworks"
      className="relative z-10 py-[120px] px-6"
      style={{ background: "linear-gradient(180deg,transparent,rgba(99,91,255,0.03),transparent)" }}
    >
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>✦ How it works</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] mb-4">
            Up and running in minutes
          </h2>
          <p className="text-text-muted text-[1.05rem] font-light max-w-md mx-auto">
            No complex onboarding. No training sessions. Axora is designed to feel intuitive from day one.
          </p>
        </div>

        <div className="flex flex-col gap-[2px]">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="scroll-reveal flex gap-8 items-start p-8 bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl
                         hover:border-[rgba(255,255,255,0.12)] hover:translate-x-1 transition-all duration-200"
            >
              <div className="font-display text-[2.5rem] font-extrabold text-[rgba(99,91,255,0.2)] min-w-[48px] leading-none tracking-[-0.04em]">
                {step.number}
              </div>
              <div>
                <h3 className="font-display text-[1.1rem] font-semibold mb-2">{step.title}</h3>
                <p className="text-text-muted text-sm font-light leading-[1.65]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
