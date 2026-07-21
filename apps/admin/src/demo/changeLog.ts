export type DemoChangeAction =
  | "worker.create"
  | "worker.update"
  | "worker.delete"
  | "user.role"
  | "event.delete"
  | "invitation.create"
  | "invitation.revoke";

export interface DemoChangeEntry {
  id: string;
  at: string;
  action: DemoChangeAction;
  targetId: string;
  targetLabel?: string;
  actorNombre?: string;
  detail?: string;
}

export const MAX_CHANGE_LOG = 200;

export function appendChangeLog(
  log: DemoChangeEntry[],
  entry: Omit<DemoChangeEntry, "id" | "at">,
): DemoChangeEntry[] {
  const row: DemoChangeEntry = {
    ...entry,
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  return [row, ...log].slice(0, MAX_CHANGE_LOG);
}
