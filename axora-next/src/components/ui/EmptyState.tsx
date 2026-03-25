import { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-surface border border-[rgba(255,255,255,0.06)] rounded-[18px] flex items-center justify-center text-3xl mb-5">
        {icon}
      </div>
      <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
      <p className="text-text-muted text-sm font-light mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  );
}
