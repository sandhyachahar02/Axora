import { clsx } from "clsx";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 font-body font-medium rounded-[10px] cursor-pointer border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap",
        {
          // variants
          "bg-primary text-white border-transparent shadow-primary hover:bg-[#7269ff] hover:-translate-y-px hover:shadow-primary-hover":
            variant === "primary",
          "bg-transparent text-text-muted border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary hover:border-[rgba(255,255,255,0.12)]":
            variant === "ghost",
          "bg-[rgba(255,255,255,0.04)] text-text-primary border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-px":
            variant === "outline",
          // sizes
          "px-4 py-[7px] text-sm": size === "sm",
          "px-5 py-[9px] text-sm": size === "md",
          "px-7 py-[13px] text-base rounded-xl": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
