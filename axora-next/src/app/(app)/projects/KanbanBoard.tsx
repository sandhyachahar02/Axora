import { KANBAN_COLUMNS } from "@/lib/data";

export function KanbanBoard() {
  return (
    <div className="grid grid-cols-3 gap-[14px]">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.id}
          className="bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-4"
        >
          {/* Column header */}
          <div className="flex items-center justify-between mb-[14px]">
            <span className="text-[0.82rem] font-semibold text-text-muted uppercase tracking-[0.06em]">
              {col.title}
            </span>
            <span className="text-[0.75rem] text-text-dim bg-elevated px-[7px] py-[2px] rounded-full">
              {col.cards.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2">
            {col.cards.map((card) => (
              <div
                key={card.id}
                className="bg-elevated border border-[rgba(255,255,255,0.06)] rounded-[10px] p-[14px]"
              >
                <p className="text-[0.85rem] text-text-primary mb-2">{card.title}</p>
                <span className="text-[0.72rem] px-[7px] py-[2px] rounded-full bg-[rgba(99,91,255,0.12)] text-[#9b95ff]">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
