import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-white p-6 shadow-sm ring-1 ring-slate-200",
        className,
      )}
      {...props}
    />
  );
}
