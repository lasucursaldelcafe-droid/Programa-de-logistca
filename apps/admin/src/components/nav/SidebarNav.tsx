import { NavLink } from "react-router-dom";
import type { NavLinkItem, NavSection } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-accent/15 text-accent shadow-[inset_3px_0_0_0] shadow-accent"
      : "text-neutral-400 hover:bg-neutral-800/80 hover:text-white"
  }`;

interface SidebarNavProps {
  sections: NavSection[];
  onNavigate?: () => void;
}

export function SidebarNav({ sections, onNavigate }: SidebarNavProps) {
  return (
    <nav className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <SidebarNavItem item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarNavItem({
  item,
  onNavigate,
}: {
  item: NavLinkItem;
  onNavigate?: () => void;
}) {
  return (
    <NavLink to={item.to} end={item.end} className={itemClass} onClick={onNavigate}>
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  );
}
