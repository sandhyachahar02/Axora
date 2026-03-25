import { ACTIVITY_ITEMS } from "@/lib/data";
import { Card } from "@/components/ui/Card";

export function ActivityCard() {
  return (
    <Card className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-[18px]">
        <h2 className="font-display text-[0.95rem] font-semibold">Recent Activity</h2>
        <button className="text-[0.78rem] text-primary hover:text-[#9b95ff] transition-colors duration-200 cursor-pointer">
          See all →
        </button>
      </div>

      <ul className="flex flex-col gap-[14px]">
        {ACTIVITY_ITEMS.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {/* Icon dot */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border"
              style={{
                background: item.iconColor ?? "rgba(99,91,255,0.15)",
                borderColor: item.iconColor
                  ? item.iconColor.replace("0.1", "0.2")
                  : "rgba(99,91,255,0.2)",
              }}
            >
              {item.icon}
            </div>

            {/* Content */}
            <p
              className="text-[0.85rem] text-text-muted leading-snug flex-1"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />

            {/* Time */}
            <span className="text-[0.75rem] text-text-dim flex-shrink-0">{item.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
