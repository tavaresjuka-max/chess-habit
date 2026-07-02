// Banner de instalação do PWA (mesmo padrão visual do ReloadPrompt): aparece
// só quando o Chrome sinaliza que a instalação real (WebAPK) está disponível
// e o aluno ainda não instalou nem dispensou há pouco tempo.

import { useInstallPrompt } from '../app/useInstallPrompt';

export function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) {
    return null;
  }

  return (
    <div className="reload-prompt install-prompt" role="status" aria-live="polite">
      <p>Leve o professor com você: instale o app na sua tela inicial.</p>
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            void promptInstall();
          }}
        >
          Instalar agora
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            dismiss();
          }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
