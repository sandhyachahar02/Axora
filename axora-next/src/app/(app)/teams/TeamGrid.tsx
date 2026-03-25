import { TEAMS } from "@/lib/data";

export function TeamGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
      {TEAMS.map((team) => (
        <div
          key={team.id}
          className="bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 text-center"
        >
          {/* Avatar stack */}
          <div className="flex justify-center mb-[14px]">
            {team.avatarColors.map((color, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-surface"
                style={{
                  background: color,
                  marginLeft: i === 0 ? 0 : "-8px",
                }}
              />
            ))}
          </div>

          <h3 className="font-display text-[0.95rem] font-semibold mb-1">{team.name}</h3>
          <p className="text-[0.8rem] text-text-muted">{team.memberCount} members</p>
        </div>
      ))}
    </div>
  );
}
