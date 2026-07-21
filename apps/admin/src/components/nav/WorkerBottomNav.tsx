import { NavLink } from "react-router-dom";
import { getWorkerBottomNavItems } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[10px] font-medium transition sm:text-[11px] ${
    isActive ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
  }`;

export function WorkerBottomNav() {
  const items = getWorkerBottomNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur safe-area-pb safe-area-px">
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1 py-1.5 md:max-w-2xl lg:max-w-3xl">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
