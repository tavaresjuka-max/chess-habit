import { useState } from 'react';
import { buildAutopsyReport, type AutopsyError, type AutopsyReport, type AutopsySeverity } from '../domain/autopsy/autopsyReport';
import { fetchGameForAutopsy, parseGameRef } from '../infra/lichess/autopsyClient';
import { isAllowedLichessUrl } from '../infra/lichess/urlPolicy';
import { TavarezAvatar } from './art/TavarezAvatar';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'perspective'; exportJson: unknown; report: AutopsyReport }
  | { kind: 'cards'; report: AutopsyReport }
  | { kind: 'no-analysis'; gameId: string }
  | { kind: 'error'; message: string; retryable: boolean };

const SEVERITY_LABEL: Record<AutopsySeverity, string> = {
  blunder: 'Capote',
  mistake: 'Erro grave',
  inaccuracy: 'Imprecisão',
};

/**
 * Pré-seleciona o lado do usuário quando o username do perfil local bate com
 * um dos jogadores da partida (case-insensitive — o Lichess normaliza nomes
 * mas o export pode vir com capitalização diferente do perfil salvo).
 */
function autoDetectPerspective(
  report: AutopsyReport,
  lichessUsername: string | undefined,
): 'white' | 'black' | undefined {
  const normalized = (lichessUsername ?? '').trim().toLowerCase();
  if (normalized === '') {
    return undefined;
  }

  if (report.white.trim().toLowerCase() === normalized) {
    return 'white';
  }

  if (report.black.trim().toLowerCase() === normalized) {
    return 'black';
  }

  return undefined;
}

type AutopsyViewProps = {
  lichessUsername?: string;
};

export function AutopsyView({ lichessUsername }: AutopsyViewProps) {
  const [gameRefInput, setGameRefInput] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });
  const [revealedByPly, setRevealedByPly] = useState<Record<number, boolean>>({});

  async function handleSubmit() {
    const gameId = parseGameRef(gameRefInput);

    if (gameId === null) {
      setState({
        kind: 'error',
        message: 'Não reconheci esse link. Cole o endereço da partida no Lichess (ex.: lichess.org/abcd1234).',
        retryable: false,
      });
      return;
    }

    setState({ kind: 'loading' });
    setRevealedByPly({});

    const result = await fetchGameForAutopsy(gameId);

    if (result.kind === 'not-found') {
      setState({
        kind: 'error',
        message: 'Não encontrei essa partida no Lichess. Confira o link e tente de novo.',
        retryable: false,
      });
      return;
    }

    if (result.kind === 'invalid-ref') {
      setState({
        kind: 'error',
        message: 'Não reconheci esse link. Cole o endereço da partida no Lichess (ex.: lichess.org/abcd1234).',
        retryable: false,
      });
      return;
    }

    if (result.kind === 'rate-limited') {
      setState({
        kind: 'error',
        message: 'O Lichess pediu para esperar um pouco (limite de pedidos). Tente de novo em alguns instantes.',
        retryable: true,
      });
      return;
    }

    if (result.kind === 'network-error') {
      setState({
        kind: 'error',
        message: 'Não consegui falar com o Lichess agora. Confira sua conexão e tente de novo.',
        retryable: true,
      });
      return;
    }

    if (result.kind === 'no-analysis') {
      setState({ kind: 'no-analysis', gameId: result.gameId });
      return;
    }

    // result.kind === 'ok': tentamos as duas perspectivas para decidir se
    // pulamos a escolha manual (perfil bate com um lado) e para checar se há
    // erros de análise disponíveis de fato.
    const reportWhite = buildAutopsyReport(result.exportJson, 'white');

    if (!reportWhite.analysisAvailable) {
      setState({ kind: 'no-analysis', gameId: result.gameId });
      return;
    }

    const detectedSide = autoDetectPerspective(reportWhite, lichessUsername);

    if (detectedSide !== undefined) {
      const report = detectedSide === 'white' ? reportWhite : buildAutopsyReport(result.exportJson, 'black');
      setState({ kind: 'cards', report });
      return;
    }

    setState({ kind: 'perspective', exportJson: result.exportJson, report: reportWhite });
  }

  function handleChoosePerspective(perspective: 'white' | 'black', exportJson: unknown, report: AutopsyReport) {
    const finalReport = perspective === report.perspective ? report : buildAutopsyReport(exportJson, perspective);
    setState({ kind: 'cards', report: finalReport });
  }

  function toggleReveal(ply: number) {
    setRevealedByPly((previous) => ({ ...previous, [ply]: true }));
  }

  function handleReset() {
    setGameRefInput('');
    setState({ kind: 'idle' });
    setRevealedByPly({});
  }

  return (
    <section aria-labelledby="autopsy-title" className="panel">
      <div className="section-heading">
        <div>
          <h1 id="autopsy-title">Autópsia</h1>
          <p>Cole o link da sua última partida; eu mostro o que treinar.</p>
        </div>
      </div>

      {state.kind === 'idle' || state.kind === 'error' ? (
        <AutopsyIntake
          gameRefInput={gameRefInput}
          onChangeGameRefInput={setGameRefInput}
          onSubmit={() => {
            void handleSubmit();
          }}
          errorMessage={state.kind === 'error' ? state.message : undefined}
          retryable={state.kind === 'error' ? state.retryable : false}
        />
      ) : null}

      {state.kind === 'loading' ? (
        <p role="status" aria-live="polite" className="autopsy-loading">
          Buscando a partida no Lichess…
        </p>
      ) : null}

      {state.kind === 'no-analysis' ? (
        <div className="autopsy-no-analysis" role="status">
          <p>
            Essa partida ainda não tem análise do Lichess. Abra a partida lá, peça a análise do
            computador e volte para colar o link de novo.
          </p>
          <div className="button-row">
            {isAllowedLichessUrl(`https://lichess.org/${state.gameId}`) ? (
              <a
                className="button-link secondary-link"
                href={`https://lichess.org/${state.gameId}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir a partida no Lichess (abre em nova aba)"
              >
                Abrir a partida no Lichess
              </a>
            ) : null}
            <button type="button" className="secondary-button" onClick={handleReset}>
              Colar outro link
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === 'perspective' ? (
        <div className="autopsy-perspective" role="group" aria-label="Escolha seu lado na partida">
          <p>De que lado você jogou?</p>
          <div className="button-row">
            <button
              type="button"
              onClick={() => {
                handleChoosePerspective('white', state.exportJson, state.report);
              }}
            >
              Eu joguei de brancas ({state.report.white})
            </button>
            <button
              type="button"
              onClick={() => {
                handleChoosePerspective('black', state.exportJson, state.report);
              }}
            >
              Eu joguei de pretas ({state.report.black})
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === 'cards' ? (
        <AutopsyCards
          report={state.report}
          revealedByPly={revealedByPly}
          onReveal={toggleReveal}
          onReset={handleReset}
        />
      ) : null}
    </section>
  );
}

function AutopsyIntake({
  gameRefInput,
  onChangeGameRefInput,
  onSubmit,
  errorMessage,
  retryable,
}: {
  gameRefInput: string;
  onChangeGameRefInput: (value: string) => void;
  onSubmit: () => void;
  errorMessage: string | undefined;
  retryable: boolean;
}) {
  return (
    <div className="autopsy-intake">
      <p className="tutor-quote">
        <TavarezAvatar size={32} className="tutor-quote-avatar" />
        <span>
          Cole o link da sua última partida do Lichess; eu mostro o que você vai treinar antes de jogar
          a próxima.
        </span>
      </p>

      <label className="field">
        <span>Link ou ID da partida</span>
        <input
          type="text"
          placeholder="https://lichess.org/abcd1234"
          value={gameRefInput}
          onChange={(event) => {
            onChangeGameRefInput(event.target.value);
          }}
        />
      </label>

      {errorMessage === undefined ? null : (
        <p role="alert" className="autopsy-error">
          {errorMessage} {retryable ? 'Pode tentar de novo.' : null}
        </p>
      )}

      <div className="button-row">
        <button type="button" disabled={gameRefInput.trim() === ''} onClick={onSubmit}>
          Fazer autópsia
        </button>
      </div>
    </div>
  );
}

function AutopsyCards({
  report,
  revealedByPly,
  onReveal,
  onReset,
}: {
  report: AutopsyReport;
  revealedByPly: Record<number, boolean>;
  onReveal: (ply: number) => void;
  onReset: () => void;
}) {
  if (report.errors.length === 0) {
    return (
      <div className="autopsy-empty">
        <p>
          Não achei lances graves nessa partida (pelo menos não entre os que o Lichess marcou). Boa
          partida.
        </p>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onReset}>
            Fazer outra autópsia
          </button>
        </div>
      </div>
    );
  }

  const playerName = report.perspective === 'white' ? report.white : report.black;

  return (
    <div className="autopsy-cards">
      <p className="autopsy-cards-intro">
        {playerName}, aqui estão os lances que mais custaram nessa partida.
      </p>

      <ul className="autopsy-card-list">
        {report.errors.map((error) => (
          <AutopsyErrorCard
            key={error.ply}
            error={error}
            revealed={revealedByPly[error.ply] === true}
            onReveal={() => {
              onReveal(error.ply);
            }}
          />
        ))}
      </ul>

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onReset}>
          Fazer outra autópsia
        </button>
      </div>
    </div>
  );
}

function AutopsyErrorCard({
  error,
  revealed,
  onReveal,
}: {
  error: AutopsyError;
  revealed: boolean;
  onReveal: () => void;
}) {
  const sideLabel = error.side === 'white' ? 'brancas' : 'pretas';

  return (
    <li className="autopsy-error-card">
      <div className="autopsy-error-header">
        <span className={`autopsy-severity autopsy-severity-${error.severity}`}>
          {SEVERITY_LABEL[error.severity]}
        </span>
        <span className="autopsy-error-move">
          Lance {error.moveNumber} ({sideLabel}): {error.sanPlayed}
        </span>
      </div>

      <p className="autopsy-retrieval-prompt">Antes de ver a resposta: o que você jogaria aqui?</p>

      {!revealed ? (
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onReveal}>
            Mostrar o melhor lance
          </button>
        </div>
      ) : (
        <p className="autopsy-best-move">
          {error.bestSan === undefined
            ? 'O Lichess não trouxe o melhor lance para esta posição.'
            : `Melhor lance: ${error.bestSan}`}
        </p>
      )}

      {isAllowedLichessUrl(error.lichessUrl) ? (
        <a
          className="button-link secondary-link"
          href={error.lichessUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver o lance ${String(error.moveNumber)} no Lichess (abre em nova aba)`}
        >
          Ver no Lichess
        </a>
      ) : null}
    </li>
  );
}
