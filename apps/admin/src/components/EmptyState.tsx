import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { to: string; label: string };
}

/** Estado vacío reutilizable con CTA opcional. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-bg/30 px-6 py-10 text-center">
      <p className="font-medium text-neutral-200">{title}</p>
      {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-4 inline-block rounded-lg border border-accent/40 px-4 py-2 text-sm text-accent hover:bg-accent/10"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
