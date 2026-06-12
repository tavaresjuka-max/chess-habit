// Atualização do PWA com um toque: em vez do autoUpdate silencioso (que só
// aplicava melhorias depois de fechar e reabrir duas vezes), o app avisa
// quando há versão nova e troca na hora.

import { useRegisterSW } from 'virtual:pwa-register/react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="reload-prompt" role="status" aria-live="polite">
      <p>O app melhorou desde a última visita.</p>
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          Atualizar agora
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setNeedRefresh(false);
          }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
