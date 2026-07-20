import { NavLink } from "react-router-dom";
import { getWorkerBottomNavItems } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition ${
    isActive ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
  }`;

export function WorkerBottomNav() {
  const items = getWorkerBottomNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur safe-area-pb">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            <NavIcon name={item.icon} className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
