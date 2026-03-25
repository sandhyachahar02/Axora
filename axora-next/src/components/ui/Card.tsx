import { clsx } from "clsx";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl transition-all duration-200",
        hover && "hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-px hover:shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
