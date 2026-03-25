export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] px-12 py-8 flex items-center justify-between text-text-dim text-[0.82rem]">
      <div className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-text-primary">
        <div className="w-[22px] h-[22px] rounded-[5px] bg-gradient-primary flex items-center justify-center text-[11px]">✦</div>
        Axora
      </div>
      <div className="flex gap-6">
        {["Privacy","Terms","Status","Blog"].map((link) => (
          <a key={link} href="#" className="text-text-muted hover:text-text-primary transition-colors duration-200">
            {link}
          </a>
        ))}
      </div>
      <span>© 2025 Axora, Inc.</span>
    </footer>
  );
}
