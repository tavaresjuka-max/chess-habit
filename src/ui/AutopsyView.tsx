import { useEffect, useState } from 'react';
import { buildAutopsyReport, type AutopsyError, type AutopsyReport, type AutopsySeverity } from '../domain/autopsy/autopsyReport';
import { buildAutopsyPendingItems, detectHighConfidenceThemeTag } from '../domain/method/pendingItems';
import { weaknessTitleByTag } from '../domain/weakness/weaknessTitles';
import { fetchGameForAutopsy, parseGameRef, type AutopsyFetchResult } from '../infra/lichess/autopsyClient';
import { fetchRecentChesscomGames, type ChesscomGameSummary } from '../infra/chesscom/chesscomGames';
import { detectChesscomRef } from '../infra/lichess/chesscomRefDetection';
import { importPgnToLichess } from '../infra/lichess/importClient';
import { isAllowedLichessUrl } from '../infra/lichess/urlPolicy';
import { loadAllPendingItems, savePendingItem } from '../infra/storage/appData';
import { TavarezAvatar } from './art/TavarezAvatar';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'perspective'; exportJson: unknown; report: AutopsyReport }
  | { kind: 'cards'; report: AutopsyReport }
  | { kind: 'no-analysis'; gameId: string; fromChesscom?: boolean }
  | { kind: 'error'; message: string; retryable: boolean }
  | { kind: 'chesscom-picking'; username: string; games: ChesscomGameSummary[] }
  | { kind: 'chesscom-importing' }
  | { kind: 'chesscom-request-analysis'; gameId: string; url: string }
  | { kind: 'chesscom-error'; message: string; retryable: boolean; showManualFallback?: boolean };

// Rótulos honestos para os resultados brutos do chess.com — só 'win' vira
// "Vitória"; qualquer outro valor (checkmated, resigned, timeout, agreed,
// ...) é mostrado cru em vez de arriscar uma tradução errada.
function describeChesscomResult(result: string): string {
  return result === 'win' ? 'Vitória' : `Resultado: ${result}`;
}

const SEVERITY_LABEL: Record<AutopsySeverity, string> = {
  blunder: 'Capote',
  mistake: 'Erro grave',
  inaccuracy: 'Imprecisão',
};

/**
 * Converte centissegundos (formato do `clocks` do Lichess) em segundos
 * inteiros para exibição no badge de pressão de tempo (GRUPO CLOCKS).
 * Arredonda para baixo — "9s" é mais honesto que "10s" quando sobravam 9.4s.
 */
function formatClockSeconds(clockCentis: number | undefined): string {
  if (clockCentis === undefined) {
    return '';
  }
  return String(Math.floor(clockCentis / 100));
}

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
  // ON-C: username público do chess.com salvo no perfil local — permite o
  // atalho "usar {username}" e resolve o caso de link de partida do
  // chess.com (a API pública não busca partida por ID, só por usuário).
  chesscomUsername?: string;
  // GRUPO A3: navega para Ajustes → Dados quando o aluno clica no lembrete de
  // backup após agendar o treino. Opcional para não quebrar quem renderiza a
  // view isolada (ex.: testes existentes sem essa navegação).
  onNavigateToSettings?: () => void;
};

export function AutopsyView({ lichessUsername, chesscomUsername, onNavigateToSettings }: AutopsyViewProps) {
  const [gameRefInput, setGameRefInput] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });
  const [revealedByPly, setRevealedByPly] = useState<Record<number, boolean>>({});
  // Treinar estes erros (GRUPO A2, 2026-07-02): injeta os erros da autópsia como
  // pending items na MESMA fila SM-2. scheduledGameIds rastreia quais gameId já
  // têm pendência (nesta sessão OU de sessões anteriores, carregado do storage)
  // para desabilitar o botão / mostrar "Já agendado" sem reinjetar.
  const [scheduledGameIds, setScheduledGameIds] = useState<Set<string>>(new Set());
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadScheduledGameIds() {
      const items = await loadAllPendingItems();
      if (cancelled) {
        return;
      }
      const gameIds = items
        .filter((item) => item.source === 'autopsy' && item.gameId !== undefined)
        .map((item) => item.gameId)
        .filter((gameId): gameId is string => gameId !== undefined);

      setScheduledGameIds(new Set(gameIds));
    }

    void loadScheduledGameIds();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTrainTheseErrors(report: AutopsyReport) {
    setScheduling(true);

    try {
      const existingItems = await loadAllPendingItems();
      const newItems = buildAutopsyPendingItems(report.errors, report.gameId, existingItems);

      for (const item of newItems) {
        await savePendingItem(item);
      }

      setScheduledGameIds((current) => new Set(current).add(report.gameId));
    } finally {
      setScheduling(false);
    }
  }

  // Extraído de handleSubmit para ser reaproveitado pelo fluxo chess.com
  // (handleRequestAnalysisRecheck chama a MESMA lógica de finalização depois
  // de reconsultar o export). `options.fromChesscom` só muda a copy do
  // estado `no-analysis` (frase extra de paciência).
  function applyAutopsyFetchResult(result: AutopsyFetchResult, options?: { fromChesscom?: boolean }) {
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
      setState({ kind: 'no-analysis', gameId: result.gameId, fromChesscom: options?.fromChesscom });
      return;
    }

    // result.kind === 'ok': tentamos as duas perspectivas para decidir se
    // pulamos a escolha manual (perfil bate com um lado) e para checar se há
    // erros de análise disponíveis de fato.
    const reportWhite = buildAutopsyReport(result.exportJson, 'white');

    if (!reportWhite.analysisAvailable) {
      setState({ kind: 'no-analysis', gameId: result.gameId, fromChesscom: options?.fromChesscom });
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

  async function handleSubmit() {
    // ON-C: detecta chess.com ANTES do parseGameRef do Lichess — a
    // ambiguidade de ids de 8 chars é resolvida por detectChesscomRef (que
    // consulta parseGameRef primeiro e devolve null se for uma referência
    // Lichess válida).
    const chesscomRef = detectChesscomRef(gameRefInput);

    if (chesscomRef !== null) {
      if (chesscomRef.kind === 'chesscom-username') {
        void startChesscomFlow(chesscomRef.username);
        return;
      }

      // chesscom-game-url: a API pública do chess.com não busca partida por
      // ID, só por username — usamos o username já salvo no perfil se
      // houver; senão pedimos, sem tratar como falha genérica.
      const savedUsername = (chesscomUsername ?? '').trim();
      if (savedUsername !== '') {
        void startChesscomFlow(savedUsername);
        return;
      }

      setState({
        kind: 'chesscom-error',
        message:
          'Para trazer uma partida do chess.com, preciso do seu nome de usuário (username) lá — cole o username em vez do link direto da partida.',
        retryable: false,
      });
      return;
    }

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
    applyAutopsyFetchResult(result);
  }

  // ---- fluxo chess.com assistido (ON-C) ----

  async function startChesscomFlow(username: string) {
    const clean = username.trim();

    setState({ kind: 'loading' });
    setRevealedByPly({});

    const result = await fetchRecentChesscomGames(clean);

    if (result.kind === 'ok') {
      setState({ kind: 'chesscom-picking', username: clean, games: result.games });
      return;
    }

    if (result.kind === 'private-or-not-found') {
      setState({
        kind: 'chesscom-error',
        message: 'Não encontrei esse perfil no chess.com — confira se o nome está certo e se o perfil é público.',
        retryable: false,
      });
      return;
    }

    if (result.kind === 'no-recent-games') {
      setState({
        kind: 'chesscom-error',
        message: 'Não achei partidas recentes nesse perfil do chess.com.',
        retryable: false,
      });
      return;
    }

    if (result.kind === 'rate-limited') {
      setState({
        kind: 'chesscom-error',
        message: 'O chess.com pediu para esperar um pouco. Tente de novo em alguns instantes.',
        retryable: true,
      });
      return;
    }

    setState({
      kind: 'chesscom-error',
      message: 'Não consegui falar com o chess.com agora. Confira sua conexão e tente de novo.',
      retryable: true,
    });
  }

  async function handlePickChesscomGame(game: ChesscomGameSummary) {
    setState({ kind: 'chesscom-importing' });

    const result = await importPgnToLichess(game.pgn);

    if (result.kind === 'ok') {
      setState({ kind: 'chesscom-request-analysis', gameId: result.gameId, url: result.url });
      return;
    }

    if (result.kind === 'rate-limited') {
      setState({
        kind: 'chesscom-error',
        message: 'O Lichess pediu para esperar um pouco para importar. Tente de novo em alguns instantes.',
        retryable: true,
      });
      return;
    }

    if (result.kind === 'invalid-pgn') {
      setState({
        kind: 'chesscom-error',
        message: 'Não consegui importar essa partida (formato inesperado).',
        retryable: false,
        showManualFallback: true,
      });
      return;
    }

    setState({
      kind: 'chesscom-error',
      message: 'Não consegui falar com o Lichess para importar agora. Confira sua conexão e tente de novo.',
      retryable: true,
    });
  }

  async function handleRequestAnalysisRecheck(gameId: string) {
    setState({ kind: 'loading' });
    const result = await fetchGameForAutopsy(gameId);
    applyAutopsyFetchResult(result, { fromChesscom: true });
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
          <h2 id="autopsy-title">Autópsia</h2>
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
          chesscomUsername={chesscomUsername}
          onUseChesscomUsername={() => {
            void startChesscomFlow(chesscomUsername ?? '');
          }}
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
          {state.fromChesscom === true ? (
            <p className="config-hint">
              Às vezes o Lichess demora alguns segundos para processar — tente de novo em instantes.
            </p>
          ) : null}
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

      {state.kind === 'chesscom-picking' ? (
        <div className="autopsy-chesscom-picking">
          <p>Escolha a partida:</p>
          <ul className="autopsy-chesscom-game-list">
            {state.games.map((game) => (
              <li key={game.url}>
                <button
                  type="button"
                  className="autopsy-chesscom-game-button"
                  onClick={() => {
                    void handlePickChesscomGame(game);
                  }}
                >
                  <span>{new Date(game.endTime * 1000).toLocaleDateString('pt-BR')}</span>
                  <span>Você jogou de {game.userColor === 'white' ? 'brancas' : 'pretas'}</span>
                  <span>contra {game.userColor === 'white' ? game.black : game.white}</span>
                  <span>{describeChesscomResult(game.result)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={handleReset}>
              Colar outro link
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === 'chesscom-importing' ? (
        <p role="status" aria-live="polite" className="autopsy-loading">
          Importando sua partida para o Lichess…
        </p>
      ) : null}

      {state.kind === 'chesscom-request-analysis' ? (
        <div className="autopsy-chesscom-request-analysis">
          <p>
            Importei sua partida para o Lichess. Toque em <strong>Solicitar análise</strong> lá e
            volte — eu continuo daqui.
          </p>
          {isAllowedLichessUrl(state.url) ? (
            <a
              className="button-link secondary-link"
              href={state.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir a partida importada no Lichess (abre em nova aba)"
            >
              Abrir a partida no Lichess
            </a>
          ) : null}
          <p className="config-hint">
            Se o Lichess pedir login para analisar, é a deixa para criar sua conta grátis — te
            espero.
          </p>
          <div className="button-row">
            <button
              type="button"
              onClick={() => {
                void handleRequestAnalysisRecheck(state.gameId);
              }}
            >
              Já pedi a análise
            </button>
            <button type="button" className="secondary-button" onClick={handleReset}>
              Colar outro link
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === 'chesscom-error' ? (
        <div className="autopsy-chesscom-error">
          <p role="alert" className="autopsy-error">
            {state.message} {state.retryable ? 'Pode tentar de novo.' : null}
          </p>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={handleReset}>
              {state.retryable ? 'Tentar de novo' : 'Colar outro link'}
            </button>
          </div>
          {state.showManualFallback === true ? (
            <details className="autopsy-manual-fallback" open>
              <summary>outra forma de trazer a partida</summary>
              <p className="config-hint">
                Se preferir, cole o PGN da sua partida em lichess.org/paste, importe lá, e depois
                volte para colar o link da partida importada aqui.
              </p>
              <a
                className="button-link secondary-link"
                href="https://lichess.org/paste"
                target="_blank"
                rel="noreferrer"
              >
                Abrir lichess.org/paste
              </a>
            </details>
          ) : null}
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
          alreadyScheduled={scheduledGameIds.has(state.report.gameId)}
          scheduling={scheduling}
          onTrainTheseErrors={() => {
            void handleTrainTheseErrors(state.report);
          }}
          {...(onNavigateToSettings === undefined ? {} : { onNavigateToSettings })}
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
  chesscomUsername,
  onUseChesscomUsername,
}: {
  gameRefInput: string;
  onChangeGameRefInput: (value: string) => void;
  onSubmit: () => void;
  errorMessage: string | undefined;
  retryable: boolean;
  chesscomUsername?: string;
  onUseChesscomUsername: () => void;
}) {
  const hasChesscomUsername = (chesscomUsername ?? '').trim() !== '';

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
        {hasChesscomUsername ? (
          <button
            type="button"
            className="secondary-button"
            onClick={onUseChesscomUsername}
            aria-label={`Usar seu perfil do chess.com ${chesscomUsername ?? ''}`}
          >
            usar {chesscomUsername}
          </button>
        ) : null}
      </div>

      <details className="autopsy-manual-fallback">
        <summary>outra forma de trazer a partida</summary>
        <p className="config-hint">
          Se preferir, cole o PGN da sua partida em lichess.org/paste, importe lá, e depois volte
          para colar o link da partida importada aqui.
        </p>
        <a
          className="button-link secondary-link"
          href="https://lichess.org/paste"
          target="_blank"
          rel="noreferrer"
        >
          Abrir lichess.org/paste
        </a>
      </details>
    </div>
  );
}

function AutopsyCards({
  report,
  revealedByPly,
  onReveal,
  onReset,
  alreadyScheduled,
  scheduling,
  onTrainTheseErrors,
  onNavigateToSettings,
}: {
  report: AutopsyReport;
  revealedByPly: Record<number, boolean>;
  onReveal: (ply: number) => void;
  onReset: () => void;
  alreadyScheduled: boolean;
  scheduling: boolean;
  onTrainTheseErrors: () => void;
  onNavigateToSettings?: () => void;
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

      {alreadyScheduled ? (
        <>
          <p role="status" className="autopsy-scheduled-confirmation">
            Agendei. Eles voltam em 1 dia — e eu pergunto de novo antes de mostrar a resposta.
          </p>
          <p className="config-hint">
            Seu progresso fica só neste aparelho.{' '}
            {onNavigateToSettings === undefined ? (
              'Faça um backup em Ajustes → Dados.'
            ) : (
              <>
                Faça um backup em{' '}
                <button type="button" className="link-button" onClick={onNavigateToSettings}>
                  Ajustes → Dados
                </button>
                .
              </>
            )}
          </p>
        </>
      ) : null}

      <div className="button-row">
        <button type="button" disabled={alreadyScheduled || scheduling} onClick={onTrainTheseErrors}>
          {alreadyScheduled ? 'Já agendado' : 'Treinar estes erros'}
        </button>
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
  // GRUPO TAGS (2026-07-02): classificador heurístico de temas (spike D1) — só
  // confidence 'high' vira sugestão na UI (ver detectHighConfidenceThemeTag).
  // Sugestão honesta, não veredito: sem estatística, sem "você é fraco em X".
  const themeTag = detectHighConfidenceThemeTag(error);

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

      {themeTag === undefined ? null : (
        <p className="autopsy-theme-hint">
          Isso tem cara de {weaknessTitleByTag[themeTag]}. Eu conheço esse padrão — está no seu
          currículo.
        </p>
      )}

      {error.timePressure === true ? (
        <p className="autopsy-time-pressure config-hint">
          Você tinha {formatClockSeconds(error.clockCentisAtError)}s no relógio — parte do erro é
          gestão de tempo, não só tática.
        </p>
      ) : null}

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
