import { TASKS } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import type { Task } from "@/types";

const tagStyles: Record<Task["tagColor"], string> = {
  purple: "bg-[rgba(99,91,255,0.15)] text-[#9b95ff]",
  blue:   "bg-[rgba(63,208,255,0.12)] text-[#6be0ff]",
  green:  "bg-[rgba(52,211,153,0.12)] text-success",
};

export function TasksCard() {
  return (
    <Card className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-[18px]">
        <h2 className="font-display text-[0.95rem] font-semibold">My Tasks</h2>
        <button className="text-[0.78rem] text-primary hover:text-[#9b95ff] transition-colors duration-200 cursor-pointer">
          See all →
        </button>
      </div>

      <ul className="flex flex-col gap-[10px]">
        {TASKS.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 px-[14px] py-3 bg-elevated border border-[rgba(255,255,255,0.06)] rounded-[10px] transition-all duration-200 hover:border-[rgba(255,255,255,0.12)]"
          >
            {/* Check circle */}
            <div
              className={clsx(
                "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 text-[9px]",
                task.done
                  ? "bg-[rgba(52,211,153,0.2)] border-success text-success"
                  : "border-text-dim"
              )}
            >
              {task.done && "✓"}
            </div>

            {/* Label */}
            <span
              className={clsx(
                "text-[0.85rem] flex-1",
                task.done ? "line-through text-text-dim" : "text-text-primary"
              )}
            >
              {task.label}
            </span>

            {/* Tag */}
            <span
              className={clsx(
                "text-[0.72rem] px-2 py-[2px] rounded-full font-medium",
                tagStyles[task.tagColor]
              )}
            >
              {task.tag}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
