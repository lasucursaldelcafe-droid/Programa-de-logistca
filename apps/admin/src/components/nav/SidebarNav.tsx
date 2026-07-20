import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { NavLinkItem, NavSection } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

const STORAGE_KEY = "spe-nav-expanded-v1";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
    isActive
      ? "bg-accent/15 font-medium text-accent shadow-[inset_3px_0_0_0] shadow-accent"
      : "text-neutral-400 hover:bg-neutral-800/80 hover:text-white"
  }`;

interface SidebarNavProps {
  sections: NavSection[];
  onNavigate?: () => void;
}

function loadExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveExpanded(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function SidebarNav({ sections, onNavigate }: SidebarNavProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const saved = loadExpanded();
    const initial: Record<string, boolean> = {};
    for (const section of sections) {
      const hasActive = section.items.some((item) =>
        item.end
          ? location.pathname === item.to
          : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      );
      initial[section.id] = saved[section.id] ?? hasActive ?? section.id === "inicio";
    }
    return initial;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const section of sections) {
        const hasActive = section.items.some((item) =>
          item.end
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
        );
        if (hasActive && !next[section.id]) {
          next[section.id] = true;
          changed = true;
        }
      }
      if (changed) saveExpanded(next);
      return changed ? next : prev;
    });
  }, [location.pathname, sections]);

  const toggle = useCallback((sectionId: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      saveExpanded(next);
      return next;
    });
  }, []);

  const sectionList = useMemo(() => sections, [sections]);

  return (
    <nav className="space-y-1" aria-label="Menú principal">
      {sectionList.map((section) => {
        const isOpen = expanded[section.id] ?? false;
        const singleItem = section.items.length === 1 && section.id === "inicio";

        if (singleItem) {
          return (
            <ul key={section.id} className="mb-2">
              <li>
                <SidebarNavItem item={section.items[0]!} onNavigate={onNavigate} />
              </li>
            </ul>
          );
        }

        return (
          <div key={section.id} className="border-b border-border/40 pb-1 last:border-0">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 transition hover:bg-neutral-800/50 hover:text-neutral-300"
              aria-expanded={isOpen}
            >
              <span>{section.title}</span>
              <NavIcon
                name="chevron"
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <ul className="mt-0.5 space-y-0.5 pb-2 pl-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SidebarNavItem item={item} onNavigate={onNavigate} indent />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarNavItem({
  item,
  onNavigate,
  indent = false,
}: {
  item: NavLinkItem;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  const isExternal = item.external === true;

  if (isExternal) {
    return (
      <a
        href={item.to}
        target="_blank"
        rel="noreferrer"
        className={`${itemClass({ isActive: false })} ${indent ? "ml-2" : ""}`}
        onClick={onNavigate}
      >
        <NavIcon name={item.icon} className="h-4 w-4" />
        <span className="truncate">{item.label}</span>
      </a>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `${itemClass({ isActive })} ${indent ? "ml-2" : ""}`}
      onClick={onNavigate}
    >
      <NavIcon name={item.icon} className="h-4 w-4" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}
