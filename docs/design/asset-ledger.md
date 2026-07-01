# Ledger de Assets Gerados

Rastreabilidade da arte gerada do app: o que existe, onde vive, e como foi/e regenerada.
Este documento e um **inventario**; a **fonte da verdade da geracao** sao os scripts e o prompt
listados em "Pipeline de geracao".

_Ultima varredura: 2026-07-01. Total em producao: **59 `.webp` (~2,4 MB)** em `public/art/` +
**4 icones PWA (~256 KB)** em `public/`._

## Pipeline de geracao

| Etapa | Script / arquivo | O que faz |
|---|---|---|
| Prompt de design | `prompts/claude-design-assets-2026-06-10.md` | Especificacao de estilo dos ~35 ativos (antique gold engraving, stickers, fundos) + descritor por ativo. |
| Geracao | `scripts/comfy-gerar-assets.py` | Gera selos/medalhas/bandas via ComfyUI local (DreamShaper XL Lightning, 1024x1024); remove fundo branco por flood-fill; salva PNG em `entrega/`. |
| Integracao | `scripts/integrate-m0-assets.mjs` | Converte PNGs (`entrega/m0/` ou `assets/badges-gold/` com `--badges`) para `public/art/*.webp` via Sharp; redimensiona por `ASSET_SPECS`; valida dimensao/tamanho. |
| Limpeza de fundo | `scripts/defundo-assets.mjs` | Remove fundo branco contiguo das bordas (flood-fill), preservando branco interno; backup em `public/art/_backup_defundo/`. |

Regerar um asset: `node scripts/integrate-m0-assets.mjs --only=<nome>` (ou `--badges`).

## Assets em producao — `public/art/` (59 `.webp`)

| Categoria | Qtde | Arquivos (amostra) |
|---|---|---|
| Persona/Tutor (Tavarez) | 9 | `tavarez-hero-retrato(-noite)`, `tavarez-avatar-medalhao`, `tavarez-pose-{aprovando,boas-vindas,celebracao,chamando-de-volta,explicando,pensando}` |
| Molduras / texturas UI | 4 | `moldura-tutorcard`, `pagina-caderno`, `textura-couro`, `textura-papel` |
| Fundos de cena | 2 | `fundo-mesa-dia`, `fundo-mesa-noite` |
| Diplomas (pecas) | 3 | `diploma-{peao,torre,rei}` |
| Bandas / tomos (1-7) | 7 | `banda-1`…`banda-7` (peao → rei coroado) |
| Selos de secao (engraving) | 16 | `selo-{ritmo,plano,diagnostico,avaliacao,conquistas,dados,essencial,habilidades,lichess,linha-base,pendencias,registro,sessao,trava,trilha,metas}` |
| Selos de cera (diplomas 2 os) | 5 | `selo-cera-{peao,cavalo,torre,rei,louro}` |
| Medalhas de conquista | 5 | `medalha-{calibrado,primeira-hora,retorno-de-ouro,semana-inteira,tratador-pendencias}` |
| Estados vazios | 3 | `vazio-{sem-treinos,sem-dados,pendencias-em-dia}` |
| Onboarding / bilhetes | 5 | `boas-vindas-placement`, `boletim-semanal`, `bilhete-tavarez(-noite)`, `loading-tavarez` |

> Nota: a `diploma-cravada.webp` e `selo-cera-cravada.webp` **nao** estao em `public/art/` no `master`
> — vivem apenas na branch parada `codex/m3a-diploma-cravada` (ver memoria de status 2026-07-01).

## Icones PWA — `public/` (4 arquivos, ~256 KB)

Referenciados no `manifest` de `vite.config.ts:42-59`:

| Arquivo | Tamanho | Uso |
|---|---|---|
| `apple-touch-icon.png` | 180x180 | bookmark iOS |
| `icon-192.png` | 192x192 | tela inicial (padrao) |
| `icon-512.png` | 512x512 | splash / listagem |
| `icon-maskable-512.png` | 512x512 | icone adaptativo Android 8+ (`purpose: maskable`) |

## Fontes de desenvolvimento (nao vao para producao)

- `assets/badges-gold/` — **33 PNGs** de origem (`[nn]-selo-*.png`, `[nn]-medalha-*.png`), ~95 MB,
  nao otimizados. Entram no build so via `integrate-m0-assets.mjs --badges` → `.webp`.
- `entrega/` — saidas intermediarias da geracao (PNG antes da conversao).
- `public/art/_backup_defundo/` — backup pre-limpeza-de-fundo (recuperacao).

Esses diretorios sao insumo/backup do pipeline; o que o app carrega e sempre o `.webp` de `public/art/`.
