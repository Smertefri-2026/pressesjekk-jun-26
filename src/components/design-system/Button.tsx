import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "dark" | "danger-outline";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-red-500 text-white hover:bg-red-600",
  secondary: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100",
  dark: "bg-slate-950 text-white hover:bg-slate-800",
  "danger-outline": "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-3 text-sm",
  md: "px-5 py-4 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-xl text-center font-black transition disabled:cursor-not-allowed disabled:opacity-60";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Remøy AI Design System — Button.
 * Standardiserer primær/sekundær/mørk-knapp-mønstrene fra PresseSjekk (17+
 * dupliserte varianter med sprikende hover-farge - her rettet til én
 * konsekvent hover per variant, jf. "rett åpenbare inkonsistenser").
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonAsButton;

  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
