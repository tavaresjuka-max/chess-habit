import { useState } from 'react';
import { toast } from 'sonner';

// O convite de calibração é opcional. Quando o usuário escolhe "Agora não", o
// dispensar PERSISTE neste aparelho (antes era estado de componente e voltava a
// cada reload/troca de aba). Pode recalibrar quando quiser em Configurações.
const CALIBRATION_INVITE_DISMISSED_KEY = 'chesshabit:calibration-invite-dismissed';

type CalibrationInviteProps = {
  // PROD-3: convite não-bloqueante para calibrar (usuário sem contas e sem calibração).
  show: boolean;
  onStartCalibration?: () => void;
};

export function CalibrationInvite({ show, onStartCalibration }: CalibrationInviteProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(CALIBRATION_INVITE_DISMISSED_KEY) === 'true';
    } catch {
      // Sem localStorage (modo privado/iframe): o convite só não persiste o dispensar.
      return false;
    }
  });

  if (!show || dismissed) {
    return null;
  }

  return (
    <div className="calibration-invite" role="note" aria-label="Convite para calibrar o nível">
      <p>Quer ajustar seu nível? Uma calibração rápida (≈2 min) deixa o plano no ponto certo.</p>
      <div className="calibration-invite-actions">
        <button
          type="button"
          onClick={() => {
            onStartCalibration?.();
          }}
        >
          Ajustar nível
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(CALIBRATION_INVITE_DISMISSED_KEY, 'true');
            } catch {
              // Sem localStorage o dispensar vale só nesta sessão; não quebra nada.
            }
            toast('Quando quiser ajustar seu nível, é só ir em Configurações.');
          }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
