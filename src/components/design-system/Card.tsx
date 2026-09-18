import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type CardTone = "neutral" | "danger" | "warning" | "success" | "admin";

const toneClasses: Record<CardTone, string> = {
  neutral: "border-slate-200 bg-white",
  danger: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  success: "border-emerald-200 bg-emerald-50",
  admin: "border-violet-200 bg-violet-50",
};

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  tone?: CardTone;
  padding?: "sm" | "md" | "lg";
  children: ReactNode;
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-5 sm:p-7",
  lg: "p-6 sm:p-8",
};

/**
 * Remøy AI Design System — Card.
 * Samler mønsteret "rounded-3xl border ... shadow-sm" som forekom 195+
 * ganger i PresseSjekk (se arkitekturrapport). Samme visuelle uttrykk som
 * det som allerede er i bruk - dette er en uttrekking, ikke en redesign.
 */
export function Card({
  as: Component = "div",
  tone = "neutral",
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={`rounded-3xl border shadow-sm ${toneClasses[tone]} ${paddingClasses[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
