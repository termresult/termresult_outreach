import type { ReactNode } from "react";
import { BRAND, hexToRgba } from "@/lib/color";

export function IconBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl"
      style={{
        backgroundColor: hexToRgba(BRAND, 0.08),
        border: `1px solid ${hexToRgba(BRAND, 0.15)}`,
        color: BRAND,
      }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  icon,
  value,
  label,
  hint,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <IconBox>{icon}</IconBox>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-slate-100 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex justify-center">
        <IconBox>{icon}</IconBox>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
