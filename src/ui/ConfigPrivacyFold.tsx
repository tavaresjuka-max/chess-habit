import { toast } from 'sonner';
import { Fold } from './Fold';
import { PRIVACY_SUMMARY } from '../config/appIdentity';

type ConfigPrivacyFoldProps = {
  consentedAt?: string;
  adoptedAt?: string;
  researchOptIn?: boolean;
  onToggleResearchOptIn?: (enabled: boolean) => Promise<void>;
};

export function ConfigPrivacyFold({
  consentedAt,
  adoptedAt,
  researchOptIn,
  onToggleResearchOptIn,
}: ConfigPrivacyFoldProps) {
  async function handleToggleResearchOptIn(nextEnabled: boolean) {
    if (onToggleResearchOptIn === undefined) {
      return;
    }
    try {
      await onToggleResearchOptIn(nextEnabled);
      toast.success(
        nextEnabled ? 'Participação na pesquisa ativada.' : 'Participação na pesquisa desligada.',
      );
    } catch {
      toast.error('Não foi possível mudar a participação na pesquisa.');
    }
  }

  return (
    <Fold concept="dados" title="Privacidade e consentimento">
      <div className="data-zone">
        <ul className="privacy-list">
          {PRIVACY_SUMMARY.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {consentedAt !== undefined ? (
          <p className="config-hint">
            Consentimento registrado em:{' '}
            {new Date(consentedAt).toLocaleString('pt-BR')}.
          </p>
        ) : (
          <p className="config-hint">
            Consentimento ainda não registrado — concluiu o onboarding em um
            app anterior a esta versão.
          </p>
        )}
        {adoptedAt !== undefined ? (
          <p className="config-hint">
            Usuário desde: {new Date(adoptedAt).toLocaleString('pt-BR')}.
          </p>
        ) : null}
        <div className="error-capture-zone">
          <label className="field field-inline">
            <input
              type="checkbox"
              checked={researchOptIn === true}
              disabled={onToggleResearchOptIn === undefined}
              onChange={(event) => {
                void handleToggleResearchOptIn(event.target.checked);
              }}
            />
            <span>Participar da medição de eficácia em agregado (anônimo)</span>
          </label>
          <p className="config-hint">
            Seus dados continuam só no seu aparelho. Só uma contagem agregada anônima sai —
            nunca identificação pessoal. Você pode mudar esta opção a qualquer momento.
          </p>
        </div>
        <p>
          <a
            href="/docs/privacy/privacy-and-data.md"
            target="_blank"
            rel="noopener noreferrer"
            className="link-button"
          >
            Política de privacidade completa
          </a>
        </p>
        <p className="config-hint">
          Para apagar todos os dados locais (incluindo histórico de consentimento) use o
          botão &ldquo;Apagar tudo&rdquo; na seção &ldquo;Dados locais&rdquo; acima.
        </p>
      </div>
    </Fold>
  );
}
