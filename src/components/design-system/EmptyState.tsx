import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Remøy AI Design System — EmptyState.
 * Basert på mønsteret som allerede fantes i DocumentOverviewPage.tsx.
 */
export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`rounded-2xl bg-slate-50 p-6 ${className}`}>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-3 max-w-2xl leading-7 text-slate-700">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
