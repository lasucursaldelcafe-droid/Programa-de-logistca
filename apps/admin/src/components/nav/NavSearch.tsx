import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NavLinkItem, NavSection } from "../../config/navigation";
import { NavIcon } from "./NavIcons";

export interface SearchableNavItem {
  to: string;
  label: string;
  icon: string;
  section: string;
  keywords: string;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function flattenNavSections(sections: NavSection[]): SearchableNavItem[] {
  const seen = new Set<string>();
  const items: SearchableNavItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.external) continue;
      const key = item.to.split("?")[0] ?? item.to;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        to: item.to,
        label: item.label,
        icon: item.icon,
        section: section.title,
        keywords: normalize(`${item.label} ${section.title} ${key}`),
      });
    }
  }
  return items;
}

function filterItems(items: SearchableNavItem[], query: string): SearchableNavItem[] {
  const q = normalize(query);
  if (!q) return items.slice(0, 12);
  return items
    .filter((item) => item.keywords.includes(q) || normalize(item.label).includes(q))
    .slice(0, 20);
}

interface NavSearchProps {
  sections: NavSection[];
  /** Compacto para el header móvil */
  compact?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function NavSearch({ sections, compact = false, onNavigate, className = "" }: NavSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allItems = useMemo(() => flattenNavSections(sections), [sections]);
  const results = useMemo(() => filterItems(allItems, query), [allItems, query]);

  const goTo = useCallback(
    (item: Pick<NavLinkItem, "to">) => {
      navigate(item.to);
      setQuery("");
      setOpen(false);
      onNavigate?.();
    },
    [navigate, onNavigate],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const showPanel = open && (query.trim().length > 0 || compact);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label className="sr-only" htmlFor="spe-nav-search">
        Buscar opciones del menú
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
          <NavIcon name="search" className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          id="spe-nav-search"
          type="search"
          value={query}
          placeholder={compact ? "Buscar…" : "Buscar opciones…"}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              e.preventDefault();
              goTo(results[activeIndex]!);
            }
          }}
          className={`w-full rounded-lg border border-border bg-bg py-2 pl-8 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40 ${
            compact ? "py-1.5 text-xs" : ""
          }`}
        />
        {!compact && (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline">
            Ctrl K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface-elevated shadow-xl"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-neutral-500">Ninguna opción coincide.</p>
          ) : (
            <ul className="py-1">
              {results.map((item, index) => (
                <li key={`${item.to}-${item.label}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-accent/15 text-accent"
                        : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item)}
                  >
                    <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                    <span className="hidden max-w-[40%] truncate text-xs text-neutral-500 sm:inline">
                      {item.section}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
