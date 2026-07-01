# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
