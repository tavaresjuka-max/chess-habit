# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Trabalho em `master` acima da 0.1.0 (ainda não versionado nem deployado).

### Added
- Contratos de recuperação cega (blind retrieval) — base pedagógica para fechar o loop de recuperação.
- `ErrorBoundary` global + timeout nos fetches de OAuth (resiliência).
- Redesign **action-first** da tela Hoje (F1–F5): Hoje passa a ser só ação; metas, trilha e sync migram para Progresso.

### Changed
- Paleta "verde-elevação": fim das ilhas beges, botão primário verde, chrome do Hoje sem ouro.
- Arte premium integrada: retrato grande do herói + diagramas de conceito unificados em SVG.
- Escala tipográfica declarada e paleta do herói tokenizada (fim dos hex soltos no bloco do hero).
- Aba "Config" renomeada para "Ajustes".
- Constantes de revisão espaçada unificadas na fonte única `pedagogyConstants`.
- Licença: de AGPL-3.0 para **proprietário/fechado**.

### Fixed
- Robustez de dados: fallback do SR quando o item pendente some do estado + validação de campos de confiança no restore (integridade da coorte de pesquisa).
- Anti-race na regeneração de plano: relê `weaknesses` do storage em vez de usar cópia stale.
- Empilhamento do herói em telas estreitas estendido até ~520px (era 430px).
- Tokens CSS indefinidos (`--accent`, `--ink`, `--ink-400`, `--surface-2`) eliminados; ARIA de progresso diferenciado (fim do progressbar duplicado).
- "Agora não" do convite de calibração agora persiste entre sessões.
- Ritmo vertical e vãos mortos da tela Hoje apertados.

### Security
- Endurece o modo local (guarda contra sync acidental), remove `mode` da resposta de `/health` e marca explicitamente o sync como plaintext no servidor.

## [0.1.0] - 2026-06-29

Versão inicial retroativa — ferramenta pessoal de treino de xadrez com Lichess/Chess.com.

### Added
- Diagnóstico de fraquezas via API pública do Chess.com e Lichess.
- Método 5 trilhas (Abertura, Tática, Final, Resistência, Constância) com revisão espaçada adaptativa (SR/SM-2).
- Sessões de tutor com envelope de tempo, blocos de treino e feedback de dificuldade.
- Backend Cloudflare Workers + D1 para sync multi-dispositivo opt-in em modelo conta-normal (dados legíveis no servidor, sem tokens no servidor).
- PWA offline-first (Vite + vite-plugin-pwa) com export/import de backup local.
- OAuth Lichess opt-in (escopos mínimos: `puzzle:read`).
- Gate de CI: lint + testes + coverage + build (GitHub Actions).
