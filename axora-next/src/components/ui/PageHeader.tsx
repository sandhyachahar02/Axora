import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-7">
      <h1 className="font-display text-[1.7rem] font-bold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}
