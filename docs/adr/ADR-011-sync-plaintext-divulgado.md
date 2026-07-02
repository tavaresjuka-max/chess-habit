# ADR-011: Sync Sem E2EE, Divulgado (Nao E Vulnerabilidade)

## Status

Aceito (registrado 2026-07-02 por instrucao do dono, para zerar pendencias de documentacao; a decisao
original e de 2026-06-28/2026-06-30).

## Contexto

O Chess Habit tem sincronizacao multi-aparelho opcional (P4/P5): login via Lichess OAuth, progresso
enviado a um backend Cloudflare Workers + D1. O payload do blob trafega e persiste no servidor **sem
criptografia ponta-a-ponta (E2EE) real** — ou seja, e legivel pelo operador do servidor, no mesmo modelo
de conta que apps como Anki ou Duolingo usam para dado de estudo.

O campo de wire que carrega esse payload se chama `ciphertext` (`POST /blobs`, `src/infra/sync/syncClient.ts`).
Esse nome e **historico** e pode sugerir, erroneamente, que ha criptografia de ponta-a-ponta. Nao ha: e
transporte cifrado em transito (HTTPS) e cifragem em repouso do proprio Cloudflare (nivel de
infraestrutura), nao E2EE com chave do usuario. A revisao de seguranca de 2026-06-30 (`docs/review` /
memoria `security-review-2026-06-30`) classificou isso como **decisao divulgada, nao vulnerabilidade
ativa** — o footgun real era so o nome do campo sugerir E2EE. O simbolo interno ja foi renomeado para
`payload` em `syncClient.ts` (o campo de wire `ciphertext` fica porque e a chave JSON do contrato HTTP
existente; mudar quebraria compatibilidade sem necessidade).

Este ADR nao introduz uma decisao nova — **registra formalmente** uma decisao ja vigente e ja documentada
em `docs/privacy/privacy-and-data.md` (secao "Estado atual (beta publico)" e "Riscos A Revisar"), para que
fique rastreavel como ADR e nao apenas como nota de privacidade.

## Decisao

Manter o sync **sem E2EE real**, como modelo de "conta normal" (dado legivel pelo operador do servidor),
pelos seguintes motivos:

- O dado sincronizado e de **baixa sensibilidade**: progresso de estudo de xadrez (planos, sinais
  derivados, fraquezas, missoes) — nao e dado financeiro, de saude ou PII sensivel.
- Tokens OAuth do Lichess **nunca** saem do aparelho (ficam fora do backup e fora do sync).
- PGN completo de partidas **nunca** e persistido; apenas sinais derivados.
- Mitigacoes aplicadas: autenticacao real (token Lichess validado em `/api/account`), isolamento por
  `userId`, HTTPS em transito, cifragem em repouso do Cloudflare, acesso ao console restrito ao operador.
- O usuario pode desligar o sync, exportar (backup local) ou apagar (local + `DELETE /blobs` no servidor)
  a qualquer momento.
- Construir E2EE real (chave derivada do usuario, servidor cego ao conteudo) tem custo de engenharia alto
  para o beta pessoal/fechado atual e nao muda o calculo de risco enquanto o publico for pequeno e
  conhecido.

## Consequencias

**Ganha:** sync simples de operar, depurar e dar suporte; sem risco de perda de dados por chave perdida
(problema classico de E2EE mal implementado); custo de engenharia baixo; compativel com o modelo mental
de apps de estudo comparaveis (Anki, Duolingo).

**Perde/risco residual aceito conscientemente:** um vazamento do banco do servidor (D1) exporia dado real
de progresso de todos os usuarios sincronizados — nao apenas metadados. O operador (dono do projeto) tem
acesso de leitura ao dado de qualquer usuario que sincronizou. Isso e aceitavel **apenas enquanto o
publico for pequeno, conhecido e ciente do trade-off** (comunicado via este ADR + `privacy-and-data.md` +
`termos-de-servico.md`).

## Gatilho De Revisita (Obrigatorio)

Esta decisao **deve ser reavaliada antes de abrir o app/coorte a estranhos** (lancamento publico amplo,
fora do circulo pessoal/beta fechado atual). Nesse ponto, avaliar:

- Implementar E2EE real (chave derivada no cliente, servidor cego ao payload); ou
- Manter o modelo atual, mas com consentimento explicito e mais visivel no onboarding/ToS sobre a
  legibilidade do dado pelo operador; ou
- Segmentar por sensibilidade (ex.: permitir sync "so localmente cifrado" como opcao avancada).

Nao lancar publicamente sem revisitar este ADR.

## Fontes

- `docs/privacy/privacy-and-data.md` — secoes "Estado atual (beta publico)" e "Riscos A Revisar".
- `src/infra/sync/syncClient.ts` — campo de wire `ciphertext`, simbolo interno `payload` (comentarios
  no proprio arquivo explicam a divergencia de nome).
- Memoria do dono: `security-review-2026-06-30` (3 agentes, nenhuma vulnerabilidade ativa bloqueante;
  plaintext-sync classificado como decisao divulgada, nao vuln; footgun so no nome do campo).
- `docs/legal/termos-de-servico.md` — comunica o trade-off ao usuario final.
