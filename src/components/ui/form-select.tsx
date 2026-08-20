import type { SelectHTMLAttributes } from "react";

export function FormSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}
    />
  );
}
