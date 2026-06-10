# Prompts de Design Visual — Rotina (Professor Lemos)

Data: 2026-06-10. Status: **plano para aprovação do dono** antes de gerar/integrar.

## O que o "Claude design" consegue e não consegue

- **Consegue (muito bem)**: gerar **SVG vetorial** — mascote em estilo flat, medalhas,
  ícones, ilustrações de estado vazio. SVG é o formato ideal para o app: escala sem perder
  qualidade, pesa poucos KB, aceita as cores do nosso design system (tema claro/escuro
  automático) e é 100% original (clean-room).
- **Não consegue**: imagem fotográfica/ilustração pintada (raster). Claude não gera
  pixels. Para um Professor Lemos "pintado" estilo ilustração de livro, seria preciso um
  gerador de imagem (Ideogram, Midjourney etc.) — com cuidado de licença e SEM estilo
  copiado de marca.
- **Recomendação**: estilo **flat geométrico vetorial** para tudo. Combina com o app,
  funciona nos dois temas, e o Claude entrega sozinho.

## Paleta oficial (colar junto com cada prompt)

- Verde profundo: `#1f3f36` (primário), `#2c5446`, `#122a22`
- Papel quente: `#f5f3ec`, superfície `#fffdf9`
- Âmbar/ouro: `#d6c48b`, `#7a5b16` (conquistas)
- Ardósia: `#2e4b67`, `#2e6f95` (marcos)
- Tinta: `#16201c`
- Regra: nada de paleta do Lichess/Chess.com; sem emoji; tom sóbrio e adulto.

---

## PROMPT 1 — Mascote: Professor Lemos

```
Crie um SVG original (viewBox 0 0 240 240) de um mascote chamado "Professor Lemos":
um cavalo de xadrez antropomorfizado em estilo flat geométrico minimalista, visto de
perfil 3/4, usando óculos redondos finos e uma gravata-borboleta discreta. Expressão
calma e atenta de professor experiente — sóbrio, nunca infantil ou caricato demais.

Estilo: formas geométricas limpas, sem gradientes complexos (no máximo 1 gradiente
sutil), sem contornos pretos grossos, cantos levemente arredondados.
Cores: corpo em verde profundo #1f3f36 com detalhes #2c5446 e #122a22; fundo
transparente; óculos e detalhes em papel quente #f5f3ec; um único acento âmbar #d6c48b
(na gravata-borboleta).
Requisitos técnicos: SVG válido e enxuto (sem raster embutido), legível em 32px e em
240px, sem texto dentro da imagem. Entregue só o código SVG.
Depois gere 2 variações: (a) apenas a cabeça em medalhão circular para avatar;
(b) versão monocromática 1 cor para usar como ícone.
```

## PROMPT 2 — Medalhas das 5 conquistas (spec de badges em rascunho)

```
Crie um conjunto coeso de 5 medalhas SVG (viewBox 0 0 120 120 cada) para um app de
treino de xadrez, estilo flat geométrico sóbrio, formato medalhão circular com borda
dupla e fita curta em baixo. Sem texto dentro do SVG, sem emoji, sem brilho exagerado.

Identidade comum: borda externa âmbar #d6c48b, interior papel #f5f3ec, símbolo central
em verde profundo #1f3f36, fita em #2c5446. Cada medalha muda apenas o símbolo central:

1. "Retorno de Ouro" — uma seta circular retornando a um quadrado de tabuleiro.
2. "Primeira Hora" — uma ampulheta minimalista com um peão dentro da areia.
3. "Tratador de Pendências" — um nó sendo desfeito / cadeado abrindo sobre uma casa
   de tabuleiro.
4. "Semana Inteira" — 5 quadrados de tabuleiro em sequência, o último marcado.
5. "Calibrado" — uma bússola cuja agulha é um cavalo de xadrez.

Entregue os 5 SVGs separados e uma 6ª versão "apagada" (cinza neutro #9aa39c) para
estado não conquistado. Código enxuto, legível em 28px.
```

## PROMPT 3 — Selos dos 3 Diplomas (Peão, Torre, Rei)

```
Crie 3 selos SVG (viewBox 0 0 140 140) em estilo de diploma/lacre de cera flat
geométrico, sóbrios e adultos, para marcos de um curso de xadrez:

1. Diploma do Peão — silhueta geométrica de peão.
2. Diploma da Torre — silhueta geométrica de torre.
3. Diploma do Rei — silhueta geométrica de rei com coroa simples.

Formato: lacre circular serrilhado (12-16 dentes suaves), borda dupla.
Cores: lacre em verde profundo #1f3f36, silhueta da peça em papel #f5f3ec, anel
interno âmbar #d6c48b. Fundo transparente, sem texto, legível em 32px.
Entregue também a variação "em progresso": mesmo selo com preenchimento só no
contorno (outline) nas mesmas cores.
```

## PROMPT 4 — Ícone do app (PWA)

```
Crie um ícone de app SVG (viewBox 0 0 512 512, cantos arredondados de 96px) para um
app de treino de xadrez chamado Rotina: um cavalo de xadrez geométrico minimalista
(podendo reaproveitar a cabeça do mascote) centralizado sobre fundo em gradiente
sutil de #2c5446 para #122a22, com a peça em #f5f3ec e um ponto de acento âmbar
#d6c48b. Margem de segurança maskable (peça dentro de 80% centrais). Sem texto.
Entregue também versão monocromática para favicon.
```

## PROMPT 5 — Ilustrações de estado vazio (3)

```
Crie 3 ilustrações SVG horizontais (viewBox 0 0 280 140) em flat geométrico
minimalista, mesmas cores (#1f3f36, #2c5446, #f5f3ec, acento #d6c48b), fundo
transparente, sem texto:

1. "Sem treinos ainda" — tabuleiro vazio visto em ângulo com uma única peça pronta
   para começar.
2. "Sem dados de progresso" — gráfico de barras estilizado onde as barras são peças
   de xadrez de alturas diferentes.
3. "Pendências em dia" — xícara de café ao lado de um relógio de xadrez pausado.

Estilo calmo, espaços negativos generosos, legível em 200px de largura.
```

---

## Como integrar depois (eu faço por aqui)

1. Você cola cada prompt no claude.ai (artifacts mostram o preview na hora), itera até
   gostar, e me traz os SVGs aprovados (ou cola aqui no chat).
2. Eu coloco em `src/assets/`, conecto: mascote no TutorCard e loading, selos na tela
   Progresso (diplomas), ícone na PWA, estados vazios nas telas.
3. Medalhas só entram na UI depois que você aprovar a spec de badges (decisão C-3).

Alternativa: eu mesmo gero os SVGs aqui no repositório com os mesmos prompts — sem
preview visual imediato, mas com integração direta e iteração por feedback seu.
