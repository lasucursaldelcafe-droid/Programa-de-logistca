import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = "h-5 w-5 shrink-0 stroke-current";

export const NavIcons: Record<string, (props: IconProps) => ReactElement> = {
  grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  map: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M9 18l-6-3V6l6 3 6-3 6 3v9l-6-3-6 3z" />
      <path d="M9 6v12M15 3v12" />
    </svg>
  ),
  qr: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2zM18 18h1v1h-1z" />
    </svg>
  ),
  eye: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  flag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M4 21V4" />
      <path d="M4 4h11l-2 4 2 4H4" />
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 11a3 3 0 100-6M19 20c0-2.5-1.5-4.5-3.5-5.5" />
    </svg>
  ),
  mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  wallet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M3 7h15a3 3 0 013 3v7a2 2 0 01-2 2H3V7z" />
      <path d="M3 7V5a2 2 0 012-2h14" />
      <circle cx="17" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  building: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" />
    </svg>
  ),
  receipt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  box: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  ),
  settings: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  plug: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M9 7V3M15 7V3M7 11h10v5a4 4 0 01-4 4h-2a4 4 0 01-4-4v-5z" />
    </svg>
  ),
  help: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 015 1c0 2-2.5 2-2.5 4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  ),
  book: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M4 5a2 2 0 012-2h11v18H6a2 2 0 01-2-2V5z" />
      <path d="M8 7h7M8 11h7M8 15h5" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  ),
  chart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15v-4M12 15V8M16 15v-6" />
    </svg>
  ),
  audit: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={base} {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  list: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M12 3v12M7 8l5 5 5-5M4 21h16" />
    </svg>
  ),
  message: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" className={base} {...p}>
      <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />
    </svg>
  ),
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = NavIcons[name] ?? NavIcons.grid;
  return <Icon className={className} />;
}
