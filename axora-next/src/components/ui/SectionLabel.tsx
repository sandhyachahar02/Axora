export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-[5px] bg-surface border border-[rgba(255,255,255,0.06)] rounded-full text-[0.78rem] text-text-muted mb-5 uppercase tracking-widest">
      {children}
    </div>
  );
}
