import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-100 text-blue-900",
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-900",
};

export type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

/**
 * Remøy AI Design System — Badge / StatusPill.
 * Samler statuspille-mønsteret (50+ håndrullede varianter i PresseSjekk).
 * Tenkt brukt sammen med domenets egne statustyper (RiskLevel, CaseStatus,
 * refund_status osv.) via en per-side label-funksjon som velger tone.
 */
export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
