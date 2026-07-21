import { NavLink } from "react-router-dom";
import { getWorkerBottomNavItems } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-2 text-[11px] font-medium transition sm:min-h-[3.25rem] sm:text-xs ${
    isActive ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
  }`;

export function WorkerBottomNav() {
  const items = getWorkerBottomNavItems();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur safe-area-pb safe-area-px"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1 py-1 md:max-w-2xl lg:max-w-3xl">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
