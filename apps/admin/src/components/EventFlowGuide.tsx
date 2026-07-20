import { Link, useLocation } from "react-router-dom";
import {
  EVENT_FLOW_PHASE_LABEL,
  EVENT_OPERATION_FLOW,
  type EventFlowPhase,
  type EventFlowStep,
} from "@spe/shared";
import { Card } from "./ui";

interface EventFlowGuideProps {
  /** Paso actual resaltado (p. ej. pathname o id del paso). */
  currentPath?: string;
  /** Pasos marcados como completados (ids de EVENT_OPERATION_FLOW). */
  completedStepIds?: string[];
  compact?: boolean;
  title?: string;
}

function stepsForPhase(phase: EventFlowPhase): EventFlowStep[] {
  return EVENT_OPERATION_FLOW.filter((step) => step.phase === phase);
}

export function EventFlowGuide({
  currentPath,
  completedStepIds = [],
  compact = false,
  title = "Flujo del evento",
}: EventFlowGuideProps) {
  const location = useLocation();
  const activePath = currentPath ?? location.pathname;

  if (compact) {
    return (
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <ol className="space-y-2">
          {EVENT_OPERATION_FLOW.map((step) => {
            const done = completedStepIds.includes(step.id);
            const active = activePath === step.path || activePath.startsWith(`${step.path}/`);
            return (
              <li key={step.id}>
                <Link
                  to={step.path}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? "border-accent/50 bg-accent/10"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-positive/20 text-positive"
                        : active
                          ? "bg-accent/25 text-accent"
                          : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {done ? "✓" : step.order}
                  </span>
                  <span>
                    <span className="font-medium text-neutral-100">{step.label}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{step.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
    );
  }

  const phases: EventFlowPhase[] = ["preparar", "operar", "cerrar"];

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Sigue este orden: primero prepara el evento, luego opera el día y al final cierra nómina.
        </p>
      </div>
      {phases.map((phase) => (
        <div key={phase}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {EVENT_FLOW_PHASE_LABEL[phase]}
          </p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {stepsForPhase(phase).map((step) => {
              const done = completedStepIds.includes(step.id);
              const active = activePath === step.path || activePath.startsWith(`${step.path}/`);
              return (
                <li key={step.id}>
                  <Link
                    to={step.path}
                    className={`flex h-full items-start gap-3 rounded-xl border p-3 text-sm transition ${
                      active
                        ? "border-accent/50 bg-accent/10"
                        : "border-border/80 hover:border-accent/30"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-positive/20 text-positive"
                          : active
                            ? "bg-accent text-bg"
                            : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {done ? "✓" : step.order}
                    </span>
                    <span>
                      <span className="font-medium text-neutral-100">{step.label}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">{step.description}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </Card>
  );
}

/** Calcula pasos completados según datos del tenant (heurística simple). */
export function computeEventFlowProgress(input: {
  hasEvents: boolean;
  setupComplete: boolean;
  workersCount: number;
  pendingInvitations: number;
  shiftsForEvent: number;
}): string[] {
  const done: string[] = [];
  if (input.hasEvents && input.setupComplete) {
    done.push("asistente");
  } else if (input.hasEvents) {
    done.push("asistente");
  }
  if (input.workersCount > 0) done.push("personal");
  if (input.pendingInvitations === 0 && input.workersCount > 0) done.push("cuentas");
  if (input.shiftsForEvent > 0) done.push("operacion");
  return done;
}
