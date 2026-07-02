# Termos De Servico — Chess Habit

> **Versao 1.0-rascunho — aguardando aprovacao do dono antes do 1o deploy publico.**

## O Que E O Chess Habit

Chess Habit e uma ferramenta gratuita, local-first, para organizar treino de xadrez a partir do seu
historico no Lichess (e opcionalmente Chess.com). Nao e um jogo, nao tem tabuleiro proprio e nao
processa pagamentos.

## Servico Fornecido "Como Esta"

O Chess Habit e oferecido gratuitamente e **sem garantia de resultado**. O app tenta se falsificar, nao
promete eficacia: as missoes, planos e diagnosticos gerados sao heuristicas de estudo, nao promessas de
melhora de rating ou desempenho (ver `docs/specs/falsification-protocol-DECISION.md`). Use por sua conta
e risco; nao ha SLA, suporte garantido ou compromisso de disponibilidade continua.

## Nao Afiliacao

O Chess Habit **nao e oficial, nao e afiliado, endossado ou mantido pelo Lichess** nem pelo Chess.com.
Ele apenas le dados publicos dessas plataformas (via API/OAuth) para montar o diagnostico do jogador.

## Seus Dados

Este documento nao repete a politica de dados — ela vive em
[`docs/privacy/privacy-and-data.md`](../privacy/privacy-and-data.md) e e a fonte de verdade sobre o que
e coletado, onde fica armazenado, e como sincronizacao/exportacao/exclusao funcionam. Resumo essencial:

- Por padrao, os dados de progresso ficam **no seu aparelho** (local-first).
- Sincronizacao entre aparelhos e **opcional** (login via Lichess OAuth); quando ligada, o progresso
  trafega para o nosso servidor para operar o app.
- Voce pode desligar a sincronizacao, exportar um backup ou apagar tudo a qualquer momento na tela de
  Configuracao.

Em caso de duvida ou aparente contradicao entre este documento e a politica de privacidade, a politica de
privacidade prevalece sobre o que for dado tecnico/operacional.

## Propriedade Intelectual

Copyright: **© 2026 Juka Tavarez. Todos os direitos reservados.** O Chess Habit e um app proprietario,
de codigo fechado (nao e software livre/open source). E proibido copiar, redistribuir ou criar obras
derivadas sem autorizacao expressa do titular.

## Idade E Uso Pessoal

O Chess Habit se destina a uso pessoal de estudo de xadrez. Nao ha coleta intencional de dados de
criancas abaixo da idade minima exigida pela plataforma de origem (Lichess/Chess.com) para criar conta
nessas plataformas.

## Alteracoes Nestes Termos

Estes termos podem mudar. Mudancas materiais serao publicadas com uma nova versao datada neste mesmo
arquivo (`docs/legal/termos-de-servico.md`), substituindo a versao anterior.

## Contato

Nao ha canal de contato oficial definido ainda (pendente de dominio proprio — ver
`docs/privacy/privacy-and-data.md`, secao "Riscos A Revisar").
