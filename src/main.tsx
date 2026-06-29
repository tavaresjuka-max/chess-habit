import '@fontsource-variable/inter/index.css';
// Serif display do "gabinete": títulos com cara de livro de estudo.
import '@fontsource-variable/fraunces/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { APP_NAME } from './config/appIdentity';
import { recordGlobalError } from './infra/storage/appData';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './index.css';

document.title = `${APP_NAME} - treino de xadrez`;

// Captura mínima de erros (opt-in, Fase 1): se o usuário ligou o toggle na
// Config, erros não tratados e rejections vazadas vão para o errorLog local
// (exportável). Falha de gravação nunca quebra o app (recordGlobalError já
// envolve tudo em try/catch silencioso). Registrados antes do render para
// pegar também erros de inicialização.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    void recordGlobalError({
      kind: 'error',
      message: event.message,
      ...(event.error instanceof Error && event.error.stack !== undefined
        ? { stack: event.error.stack }
        : {}),
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;

    void recordGlobalError({
      kind: 'unhandledrejection',
      message,
      ...(stack === undefined ? {} : { stack }),
    });
  });
}

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
