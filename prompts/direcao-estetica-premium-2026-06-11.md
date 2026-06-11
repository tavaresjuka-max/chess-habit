# Direção Estética Premium — Rotina (Professor Lemos)

Data: 2026-06-11. Status: **propostas para decisão do dono**.
Substitui a abordagem SVG de `claude-design-assets-2026-06-10.md` (que vira fallback).

Premissa nova: **tudo ilustrado** (raster gerado em ferramenta de imagem — Midjourney,
Ideogram, ChatGPT, Gemini etc.), nada vetorial em código. Conceito central:
**"estou tendo aulas com um professor de xadrez"** — o app é o mundo do Professor Lemos.

---

## 1. A grande ideia: o mundo do app é o Gabinete do Lemos

Em vez de "telas com ilustrações soltas", a proposta é um **universo coerente**:

- O app inteiro se passa no **escritório/gabinete do professor** — estante de livros,
  mesa de madeira, relógio de xadrez, luminária, xícara de café.
- A tela **Hoje** é a mesa de estudo: os cards parecem objetos sobre a mesa
  (caderno de treino, bilhete do professor, relógio).
- **Diplomas** são documentos de verdade que o Lemos assina e entrega (pergaminho,
  selo de cera) — dá até para gerar a versão completa para o aluno baixar/compartilhar.
- **Medalhas** são objetos físicos: medalhões de metal com fita, fotografados/pintados.
- O **Lemos reage ao contexto**: cada tipo de mensagem do coach já existente no código
  (boas-vindas, retorno após ausência, correção, progresso) ganha uma **pose própria**
  do personagem. O ilustrado vira funcional, não decorativo.
- **Tema escuro** = o mesmo gabinete **à noite, sob a luz da luminária**. Não é um
  filtro: são pares de imagem dia/noite. Charmoso e resolve o problema técnico do raster.

---

## 2. As três direções estéticas (escolher 1)

### Direção A — "O Gabinete do Professor" (pintura quente de livro) ★ recomendada

Ilustração pintada estilo livro premium para adultos: gouache/óleo digital, pincelada
visível, luz quente de luminária, madeira escura, couro, latão, verde profundo nas
paredes. Referência de sensação: livros ilustrados sofisticados, concept art
aconchegante — nunca infantil.

- **Combina com**: a persona do Lemos (paciente, adulto), o conceito de "aula",
  a paleta atual (verde + papel + âmbar nasceu para isso).
- **Botões/bordas**: molduras de latão envelhecido, couro com relevo, fitas de
  marcador de livro.
- **Tema escuro**: natural (gabinete à noite).
- **Risco**: imagens ricas pedem disciplina de espaço negativo para não poluir
  telas pequenas de celular.

### Direção B — "Atlas Mid-century" (editorial moderno texturizado)

Ilustração estilo capa de livro dos anos 50-60: formas elegantes, textura de
serigrafia/grão de papel, paleta limitada (a do app, exatamente). Sensação de
pôster de design, sofisticado e leve.

- **Combina com**: legibilidade em tamanhos pequenos, peso de arquivo baixo,
  envelhece bem.
- **Risco**: é o mais próximo do "flat" atual — pode frustrar a expectativa de
  "ilustrado/pintado". A textura é o que o diferencia.

### Direção C — "A Velha Academia" (gravura clássica + dourado)

Gravura em metal/água-forte: linhas finas, hachuras, toques de dourado sobre papel
creme e verde profundo. Sensação de diploma antigo, ex-libris, clube de xadrez
centenário. O mais "premium institucional" dos três.

- **Combina com**: diplomas, selos, medalhas — fica espetacular.
- **Risco**: austero demais para a motivação diária (TDAH pede calor e recompensa
  visível); pode ficar cinzento como linguagem do app inteiro.

### Recomendação: **A como direção-mestra, com C reservada aos documentos**

Narrativa coerente: você frequenta o gabinete pintado e quente (A); as conquistas
formais — diplomas, selos — são documentos gravados que o professor entrega (C).
Os dois estilos coexistem no mesmo mundo, como um diploma de verdade coexiste com
a sala onde ele é entregue.

---

## 3. Quem é o Lemos visualmente? (escolher 1)

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **(a) Cavalo antropomórfico professor** ★ | Cavalo senhor de idade, óculos redondos finos, cardigã de lã, gravata-borboleta discreta | Memorável, caloroso sem ser infantil, único, evolui o mascote atual | Precisa de mão firme no prompt para não virar cartoon |
| (b) Peça de cavalo "viva" | A peça de madeira entalhada com óculos, evolução pintada do SVG atual | Continuidade total, sóbrio | Expressividade limitada — poucas poses/emoções possíveis |
| (c) Professor humano sênior | Senhor brasileiro de barba grisalha, óculos, cardigã | "Aula de verdade", realista | Genérico, difícil manter consistência entre gerações de imagem |

A persona escrita do Lemos (sem bronca, sem vergonha, frases curtas) pede um rosto
**expressivo mas contido** — a opção (a) entrega isso melhor.

---

## 4. Inventário completo de assets

| # | Asset | Qtde | Onde entra |
|---|---|---|---|
| 1 | Lemos — character sheet (referência mestra) | 1 | Base de consistência para tudo |
| 2 | Lemos — poses: boas-vindas, explicando, aprovando, chamando de volta, pensando, celebração sóbria | 6 | TutorCard pareado com os tipos de mensagem do coach |
| 3 | Lemos — avatar medalhão (busto) | 1 | Header, avatar do tutor |
| 4 | Logo/ícone PWA (maskable) + favicon | 2 | Instalação, aba |
| 5 | Fundo do app — gabinete dia + noite | 2 | Tema claro/escuro |
| 6 | Fundo "mesa de estudo" vista de cima — dia + noite | 2 | Tela Hoje |
| 7 | Texturas de card (papel, couro) | 2-3 | Superfícies de card |
| 8 | Molduras de botão primário/secundário (9-slice) | 2 | Botões — texto continua HTML |
| 9 | Moldura "quadro" do TutorCard | 1 | Destaque da fala do professor |
| 10 | 5 medalhas + versão apagada | 6 | Conquistas (spec C-3) |
| 11 | 3 selos de diploma (Peão, Torre, Rei) + em progresso | 6 | Tela Progresso |
| 12 | Diploma completo (pergaminho) por marco | 3 | Download/compartilhar |
| 13 | 7 emblemas de banda (0-400 … 2000-2200) | 7 | Spine/progresso |
| 14 | 3 estados vazios (sem treinos, sem dados, pendências em dia) | 3 | Telas vazias |
| 15 | Tela de loading (Lemos arrumando as peças) | 1 | Carregamento |
| 16 | Ilustração de boas-vindas/placement | 1 | Onboarding |

~36 imagens. Sugestão: começar pelo **kit núcleo** (#1-#6, ~14 imagens) para validar
a direção no app real antes de gerar o resto.

---

## 5. Regras práticas (valem para qualquer direção)

1. **Nunca texto dentro da imagem** — texto fica no HTML (acessibilidade, PT-BR,
   nitidez). Geradores erram texto; e texto rasterizado não escala.
2. **Botão não é um PNG por botão** — é moldura/textura ilustrada aplicada via CSS
   (9-slice/border-image). Poucos assets, estados (hover/disabled) via CSS.
3. **Consistência de personagem**: gerar primeiro o character sheet do Lemos e usá-lo
   como imagem de referência em todas as gerações seguintes (Midjourney `--cref`,
   referência de personagem no Ideogram/ChatGPT/Gemini). Mesma coisa para estilo
   (`--sref` ou "in the same style as the attached image").
4. **Tema escuro**: fundos em pares dia/noite; sprites (Lemos, medalhas, selos) em
   PNG transparente com tons médios que funcionam nos dois temas.
5. **Formatos**: sprites em PNG transparente ≥1024px (eu converto para WebP e
   redimensiono); fundos em 2048×2048 ou 1920×1280; ícone 1024×1024.
6. **Clean-room e bom gosto nos prompts**: nunca citar Lichess/Chess.com/ChessKing,
   nem nome de artista vivo ou estúdio. Gerar em ferramenta cujos termos permitam
   uso livre (compatível com AGPL do projeto).
7. Prompts em **inglês** (geradores rendem muito mais) — explicação em PT junto.

---

## 6. Prompts de teste — um por direção (colar e comparar)

Os três usam a opção (a) cavalo antropomórfico. Para testar (b) ou (c), troque o
trecho do sujeito pela linha indicada no fim.

### Teste A — Gabinete do Professor (pintura quente)

```
Character design portrait of "Professor Lemos": an elderly, distinguished
anthropomorphic horse, professor of chess. Thin round spectacles, wool cardigan
over a shirt, discreet bow tie. Calm, attentive, kind expression of a patient
teacher — dignified, never childish, never cartoonish. Three-quarter bust view.
Painted storybook illustration for adults, digital gouache with visible brush
texture, soft warm lamp lighting, cozy academic atmosphere. Sophisticated muted
palette: deep forest green #1f3f36, warm cream paper #f5f3ec, antique gold
#d6c48b accents, dark walnut brown. Plain warm cream background, generous
negative space. No text, no watermark, no logos.
```

### Teste B — Atlas Mid-century (editorial texturizado)

```
Mid-century modern editorial illustration of "Professor Lemos": an elderly,
elegant anthropomorphic horse, professor of chess, with thin round spectacles
and a discreet bow tie. Flat stylized shapes with silkscreen print texture and
subtle paper grain, like a refined 1950s book cover. Strictly limited palette:
deep forest green #1f3f36, warm cream #f5f3ec, antique gold #d6c48b, slate blue
#2e4b67. Sophisticated, calm, adult — not cute, not childish. Three-quarter bust
composition, generous negative space, plain cream background. No text, no
watermark, no logos.
```

### Teste C — A Velha Academia (gravura + dourado)

```
Antique copperplate engraving portrait of "Professor Lemos": an elderly,
distinguished anthropomorphic horse, professor of chess, with thin round
spectacles and a bow tie. Fine etched linework with delicate cross-hatching,
in the manner of a 19th-century academic ex-libris vignette. Hand-tinted with
deep forest green #1f3f36 and antique gold leaf #d6c48b accents on warm cream
paper #f5f3ec. Simple ornamental oval border. Dignified, calm, scholarly.
No text, no watermark, no logos.
```

**Trocas de sujeito** (substituir o trecho "an elderly, distinguished
anthropomorphic horse, professor of chess"):

- Opção (b): `a carved dark-wood chess knight piece come to life as a professor,
  wearing tiny thin round spectacles`
- Opção (c): `an elderly Brazilian chess professor with a neat grey beard, kind
  eyes and thin round spectacles`

Parâmetros sugeridos (Midjourney): `--ar 1:1 --stylize 200`. Em outras ferramentas,
pedir "square format, high detail".

---

## 7. Próximo passo após a decisão

1. Dono escolhe: direção + identidade do Lemos + escopo da primeira leva.
2. Eu escrevo o **pacote completo de prompts** (um por asset do inventário, com o
   bloco de estilo mestre embutido e instruções de referência de personagem).
3. Dono gera nas ferramentas, traz as imagens aprovadas.
4. Eu integro: otimização WebP, pares claro/escuro, 9-slice dos botões, poses do
   Lemos pareadas com os tipos de mensagem do coach.
