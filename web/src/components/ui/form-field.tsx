import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#56657d]">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[10.5px] leading-4 text-[#95a1b2]">{hint}</span>
      )}
    </label>
  );
}