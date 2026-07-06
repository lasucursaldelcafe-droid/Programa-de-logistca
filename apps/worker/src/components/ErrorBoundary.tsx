import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("App Trabajador:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-md rounded-xl border border-alert/40 bg-surface p-6 text-center">
            <h1 className="font-display text-xl font-bold text-white">Error al cargar la app</h1>
            <p className="mt-2 text-sm text-neutral-400">
              {this.state.error.message || "Ocurrió un error inesperado."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
