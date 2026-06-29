import { Component, type ReactNode } from 'react';
import { recordGlobalError } from '../infra/storage/appData';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error) {
    // Reutiliza o sink de erros do app (opt-in, Fase 1). Mantém console como
    // fallback caso a gravação falhe ou a flag esteja desligada.
    console.error('[ErrorBoundary]', error);
    void recordGlobalError({
      kind: 'error',
      message: error.message,
      ...(error.stack !== undefined ? { stack: error.stack } : {}),
    });
  }
  render() {
    if (this.state.error) {
      return this.props.fallback ?? <p role="alert">Algo quebrou. Recarregue a página.</p>;
    }
    return this.props.children;
  }
}
