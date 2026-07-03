import { PLATFORM_LABEL, getAppPlatform } from "../lib/platform";

export function PlatformBadge() {
  const platform = getAppPlatform();
  if (platform === "web") return null;

  return (
    <span className="rounded-full border border-border bg-neutral-900 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
      {PLATFORM_LABEL[platform]}
    </span>
  );
}
