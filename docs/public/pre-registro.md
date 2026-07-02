# Pré-registro do estudo de eficácia — versão para leigos

Este documento explica, em linguagem simples, o que este app se comprometeu a medir
**antes de ver qualquer dado**. A versão técnica e definitiva está em
`docs/specs/e3-preregistration-FROZEN.md` (congelada em 2026-06-28) e em
`docs/specs/falsification-protocol-DECISION.md`. Se este texto e a versão técnica
divergirem em algum detalhe, a versão técnica vale.

## Por que pré-registrar

Se a gente decidisse depois de ver os números o que vale como "sucesso", a resposta
sairia sempre favorável ao método — não porque o método funciona, mas porque a régua
foi ajustada depois do fato. Pré-registrar é travar a régua antes de medir qualquer
coisa, para que o resultado (bom ou ruim) signifique alguma coisa.

## A hipótese que está sendo testada

Entre pessoas que treinaram o suficiente com o método (dose mínima abaixo), a
velocidade de ganho de rating no formato **rapid** depois de adotar o método é maior
do que antes de adotar — numa magnitude que faça diferença prática, não só
estatística — depois de corrigir o resultado por um efeito estatístico chamado
regressão à média (explicado abaixo).

Só o rapid entra nessa conta. Blitz e clássicas são observados à parte, de forma
exploratória, e nunca são somados num único número com o rapid.

## O limiar: o que conta como "fez diferença"

**+50 pontos de rating Glicko no rapid**, na velocidade de ganho, comparando os 90
dias antes da adoção com os 90 dias depois — depois da correção estatística. Abaixo
desse limiar, o resultado é tratado como **não relevante na prática**, mesmo que
exista uma diferença pequena nos números brutos.

## A dose mínima: quem entra na conta

Só entra na análise principal quem treinou **pelo menos 8 sessões, em pelo menos 6
dias diferentes**, dentro dos 90 dias depois de adotar o método. Quem treinou menos
que isso não é descartado — entra numa análise separada, mais branda, que existe
justamente para não esconder quem tentou pouco e não engajou.

## Por que o resultado não prova causa e efeito

Sem um grupo de comparação externo (outras pessoas que não usaram o método, nas
mesmas condições), qualquer melhora observada é **sugestiva, não comprovada**. O
resultado primário deste estudo é do tipo "antes e depois na mesma pessoa"
(estatísticos chamam isso de "within-subject"), o que é honesto sobre suas próprias
limitações, mas não permite afirmar que o método *causou* a melhora — só que a
melhora aconteceu junto com o uso do método, depois de descontar o "efeito de
regressão à média": quando alguém está com o rating anormalmente baixo, ele tende a
subir sozinho só por flutuação estatística, mesmo sem nenhuma intervenção. A
correção existe para não confundir essa subida natural com efeito do método.

## Como o congelamento funciona

No momento em que este pré-registro foi fechado, o conteúdo foi registrado de forma
que qualquer alteração posterior fica visível e datada: o texto ficou gravado no
histórico do sistema de controle de versão do projeto (git) num ponto específico no
tempo, e uma impressão digital criptográfica do conteúdo (um "hash" — um número que
muda se uma única letra do texto mudar) foi anotada junto. Isso não impede mudanças,
mas impede mudanças **silenciosas**: qualquer alteração de hipótese, limiar, dose
mínima ou janela de tempo depois desta data exige uma nova versão, datada, com
justificativa registrada — nunca uma edição que apague o que veio antes.

## O que acontece se o resultado for nulo

Se os dados não mostrarem o efeito esperado, isso é publicado, não escondido. A
frase exata que será usada nesse caso já está fixada desde agora: os dados não
permitiram descartar a hipótese de que o método não faz diferença, o que não prova
que o método não funciona — reflete os limites do que dava para medir com os dados
disponíveis.

## O que este pré-registro NÃO promete

- Não promete que o método funciona.
- Não promete que, se funcionar para uma pessoa, funcionará para outra.
- Não permite trocar a régua (janela, limiar, forma de calcular) depois de ver os
  dados — isso está travado desde antes de qualquer coleta.
- Não mistura formatos diferentes (rapid, blitz, clássica) numa única conclusão.

## Onde ler mais

- Postura geral do produto sobre prova e falsificação: `docs/specs/falsification-protocol-DECISION.md`
- Versão técnica completa e imutável deste pré-registro: `docs/specs/e3-preregistration-FROZEN.md`
