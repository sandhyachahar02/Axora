import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-[120px] pb-20">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-[6px] bg-[rgba(99,91,255,0.1)] border border-[rgba(99,91,255,0.25)] rounded-full text-[0.8rem] text-[#9b95ff] mb-8 animate-fade-up">
        <span className="w-[6px] h-[6px] rounded-full bg-primary animate-pulse2" />
        Now in public beta — join 12,000+ teams
      </div>

      {/* Headline */}
      <h1
        className="font-display font-extrabold leading-[1.05] tracking-[-0.04em] max-w-3xl mb-5"
        style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", animationDelay: "0.1s" }}
      >
        Build Better Teams
        <br />
        <span className="text-gradient-hero">with AI</span>
      </h1>

      {/* Sub */}
      <p
        className="max-w-lg text-text-muted text-[1.1rem] font-light leading-[1.7] mb-10"
        style={{ animation: "fadeUp 0.7s 0.2s ease both" }}
      >
        Axora brings your projects, people, and conversations into one calm,
        intelligent workspace — powered by AI that actually understands your team.
      </p>

      {/* CTAs */}
      <div
        className="flex items-center gap-3"
        style={{ animation: "fadeUp 0.7s 0.3s ease both" }}
      >
        <Link href="/signup">
          <Button variant="primary" size="lg">Get Started Free</Button>
        </Link>
        <a href="#features">
          <Button variant="outline" size="lg">Explore Features</Button>
        </a>
      </div>

      {/* Social proof */}
      <div
        className="mt-16 flex flex-col items-center gap-3"
        style={{ animation: "fadeUp 0.7s 0.4s ease both" }}
      >
        <div className="flex">
          {[
            "linear-gradient(135deg,#635BFF,#3FD0FF)",
            "linear-gradient(135deg,#FF5C8A,#635BFF)",
            "linear-gradient(135deg,#3FD0FF,#635BFF)",
            "linear-gradient(135deg,#FFB347,#FF5C8A)",
          ].map((grad, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: grad, marginLeft: i === 0 ? 0 : "-8px" }}
            >
              {["A", "S", "M", "R"][i]}
            </div>
          ))}
        </div>
        <p className="text-text-muted text-sm">
          Trusted by <strong className="text-text-primary">12,000+</strong> teams at startups and enterprises
        </p>
      </div>

      {/* Dashboard Preview */}
      <div
        className="w-full max-w-[1000px] mt-18 px-6"
        style={{ animation: "fadeUp 0.8s 0.5s ease both", marginTop: "72px" }}
      >
        <div className="relative bg-surface border border-[rgba(255,255,255,0.06)] rounded-[20px] overflow-hidden shadow-card">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(99,91,255,0.4)] to-transparent" />
          {/* Chrome bar */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="w-[10px] h-[10px] rounded-full bg-[rgba(255,92,138,0.5)]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[rgba(255,189,76,0.5)]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[rgba(50,215,75,0.5)]" />
            <div className="flex-1 h-[22px] bg-[rgba(255,255,255,0.04)] rounded-[5px] mx-3 flex items-center justify-center text-[11px] text-text-dim">
              app.axora.io — Dashboard
            </div>
          </div>
          {/* Mini app */}
          <div className="flex h-[420px]">
            {/* Mini sidebar */}
            <div className="w-[180px] bg-[rgba(0,0,0,0.3)] border-r border-[rgba(255,255,255,0.06)] p-4 flex-shrink-0">
              <div className="flex items-center gap-2 font-display text-[13px] font-bold text-text-primary mb-5">
                <div className="w-[22px] h-[22px] rounded-[5px] bg-gradient-primary" />
                Axora
              </div>
              {["◼ Dashboard","◻ Projects","◻ Teams","◻ Chat"].map((item, i) => (
                <div key={item} className={`px-[10px] py-[7px] rounded-lg text-[12px] mb-[2px] ${i === 0 ? "bg-[rgba(99,91,255,0.15)] text-[#9b95ff]" : "text-text-muted"}`}>
                  {item}
                </div>
              ))}
            </div>
            {/* Mini content */}
            <div className="flex-1 p-5 overflow-hidden">
              <div className="font-display text-sm font-bold text-text-primary mb-5">Welcome back, Alex 👋</div>
              <div className="grid grid-cols-4 gap-[10px] mb-5">
                {[["24","Projects"],["8","Members"],["142","Tasks done"],["39","Messages"]].map(([val, label]) => (
                  <div key={label} className="bg-elevated border border-[rgba(255,255,255,0.06)] rounded-[10px] p-3">
                    <div className="font-display text-lg font-bold text-text-primary">{val}</div>
                    <div className="text-[10px] text-text-muted mt-[2px]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                {[
                  [["rgba(99,91,255,0.4)","70%"],["rgba(255,255,255,0.07)","50%"]],
                  [["rgba(63,208,255,0.3)","80%"],["rgba(255,255,255,0.07)","40%"]],
                ].map((lines, ci) => (
                  <div key={ci} className="bg-elevated border border-[rgba(255,255,255,0.06)] rounded-[10px] p-3 h-20">
                    {lines.map(([color, width], li) => (
                      <div key={li} className="h-2 rounded mb-2" style={{ background: color, width }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
