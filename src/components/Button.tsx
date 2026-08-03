import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "quiet" | "choice" | "reveal" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  children: ReactNode;
}

const base =
  "tap-target inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-55 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_2px_0_0_color-mix(in_oklab,var(--primary)_70%,black)] hover:bg-[color-mix(in_oklab,var(--primary)_88%,black)] active:translate-y-[1px]",
  quiet:
    "bg-secondary text-secondary-foreground border-2 border-border hover:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--accent))]",
  choice:
    "bg-card text-foreground border-2 border-border text-left justify-start hover:border-primary hover:bg-[color-mix(in_oklab,var(--card)_85%,var(--accent))]",
  reveal:
    "bg-transparent underline underline-offset-4 decoration-2 text-foreground hover:text-primary",
  ghost: "bg-transparent text-muted-foreground hover:text-foreground",
};

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        base,
        variants[variant],
        size === "lg" ? "px-8 py-5 text-xl min-h-[4rem]" : "px-5 py-3.5 text-base",
        className,
      )}
    />
  );
}
