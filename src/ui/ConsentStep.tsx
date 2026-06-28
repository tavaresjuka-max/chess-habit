import { useState } from 'react';
import { PRIVACY_SUMMARY } from '../config/appIdentity';

type ConsentStepProps = {
  onAccept: (researchOptIn: boolean) => Promise<void>;
};

/**
 * Tela de consentimento informado (Fase 3 — D5).
 * Aparece como passo 'consent' no onboarding, logo após 'welcome'.
 * Não bloqueia usuários já onboardados: quem passou sem ver esta tela pode
 * ajustar as preferências a qualquer momento no fold "Privacidade e consentimento"
 * da Config.
 */
export function ConsentStep({ onAccept }: ConsentStepProps) {
  const [researchOptIn, setResearchOptIn] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    try {
      await onAccept(researchOptIn);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="consent-title">
      <h1 id="consent-title">Seus dados e sua privacidade</h1>

      <ul className="privacy-list">
        {PRIVACY_SUMMARY.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p>
        Para saber se o método funciona, medimos sua evolução (ritmo de rating, acurácia) de
        forma anônima e agregada. Você pode sair disso, exportar ou apagar tudo a qualquer
        momento.
      </p>
      <p className="config-hint">
        A biblioteca de conteúdo cresce conforme a eficácia é comprovada — esse é o acordo
        honesto.
      </p>
      <p>
        <a
          href="/docs/privacy/privacy-and-data.md"
          target="_blank"
          rel="noopener noreferrer"
          className="link-button"
        >
          Ver política de privacidade completa
        </a>
      </p>

      <div className="error-capture-zone">
        <label className="field field-inline">
          <input
            type="checkbox"
            checked={researchOptIn}
            onChange={(event) => {
              setResearchOptIn(event.target.checked);
            }}
          />
          <span>Participar da medição de eficácia em agregado (anônimo)</span>
        </label>
        <p className="config-hint">
          Seus dados continuam só no seu aparelho. Só uma contagem agregada anônima sai — nunca
          identificação pessoal.
        </p>
      </div>

      <div className="button-row">
        <button type="button" disabled={busy} onClick={() => void handleAccept()}>
          Aceitar e continuar
        </button>
      </div>
    </section>
  );
}
