import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section id="cta" className="relative z-10 py-[120px] px-6 text-center">
      <div className="relative max-w-[680px] mx-auto bg-surface border border-[rgba(255,255,255,0.06)] rounded-[28px] px-12 py-[72px] overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(99,91,255,0.15) 0%,transparent 70%)" }} />
        <h2 className="relative font-display text-[2.8rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-4">
          Ready to build<br />
          <span className="text-gradient-primary">better together?</span>
        </h2>
        <p className="relative text-text-muted text-base font-light mb-9">
          Join 12,000+ teams already using Axora. Free forever for small teams.
        </p>
        <div className="relative flex gap-3 justify-center">
         <Link href="/signup">
            <Button variant="primary" size="lg">Start for free</Button>
          </Link>
         <Link href="/login">
            <Button variant="outline" size="lg">View demo</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
