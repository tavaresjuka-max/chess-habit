# Pacote De Auditoria Para Outras IAs

## Pedido

Avalie a proposta Lichess Tutor antes de iniciar implementacao. O objetivo e encontrar riscos, simplificar o MVP e apontar falhas de arquitetura, privacidade, pedagogia e uso das APIs.

## Contexto

Lichess Tutor sera uma PWA gratuita e open-source que orienta estudo no Lichess. Nao e app de jogar xadrez, nao cria tabuleiro proprio no MVP e nao usa conteudo pago. Chess.com entra apenas como importador publico simples.

## Documentos Para Ler

1. `README.md`
2. `PLANO.md`
3. `AGENTS.md`
4. `docs/architecture/system.md`
5. `docs/architecture/sync.md`
6. `docs/architecture/interfaces.md`
7. `docs/integrations/lichess.md`
8. `docs/integrations/chesscom.md`
9. `docs/privacy/privacy-and-data.md`
10. `docs/pedagogy/curriculum-0-2000.md`
11. `docs/pedagogy/professor-lemos.md`
12. `docs/research/sources.md`

## Perguntas De Auditoria

- O MVP esta pequeno o suficiente?
- A decisao de nao criar tabuleiro proprio evita o risco mecanico certo?
- O sync automatico conflita com a regra de nao armazenar tokens?
- A arquitetura Cloudflare Workers + D1 e adequada para um app gratuito?
- O uso de Lichess respeita fair play e rate limits?
- A importacao Chess.com esta pequena o suficiente?
- O modelo de doacao evita paywall disfarcado?
- O curriculo 0-2000 esta realista ou deveria travar primeiro em 0-1200?
- O tutor Lemos ajuda sem atrapalhar?
- Que dado nao deveriamos salvar?

## Saida Esperada

Responder com:

- veredito;
- riscos P0/P1/P2;
- mudancas obrigatorias antes de codar;
- features para cortar do MVP;
- perguntas ainda abertas;
- plano revisado se necessario.

