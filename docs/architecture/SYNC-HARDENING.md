# Sync Hardening — gate antes de ligar `SYNC_UI_ENABLED`

Status: **DESENHO / GATE**. `SYNC_UI_ENABLED = false` (src/config/syncConfig.ts). Este documento lista o que
PRECISA estar resolvido antes de ligar o sync para multi-dispositivo real. Origem: council 2026-06-27
(DeepSeek V4 Pro + GLM 5.2, modo VERIFICAR sobre o desenho de política de conflito).

## Por que isto é um gate (não "mais uma feature")
Sync escreve em dados que alimentam o estimador de eficácia (coorte irrepetível). Merge errado corrompe
silenciosa e cumulativamente. Uma vez que usuários reais têm dados conflitantes, o estrago é
quase-irreversível. Logo: nada de ligar o sync antes dos itens abaixo.

## Achados do council (convergência dos dois, sem combinar)

### 1. Merge campo-a-campo do SM-2 é MATEMATICAMENTE INVÁLIDO
SM-2 é path-dependent: `easeFactor`, `attempts/repetitions` e `dueAt` só são coerentes computados em
sequência. Pegar `repetitions=max` de um device e `easeFactor` de outro cria um estado que jamais
existiria numa trajetória real → o algoritmo degenera a cada sync.
- **Cenário (apaga falha do aluno):** base X reps=2. Device A offline: GOOD → reps=3, ease=2.6, due=sex.
  Device B offline: erra (lapse) → reps=0, ease=2.3, due=hoje. Field-merge pega reps=3/due=sex → **o
  lapso some; o item só volta sexta embora o aluno tenha esquecido na terça**. Indetectável (reps/ease
  são opacos ao usuário).
- **Decisão:** `pendingItems` usa **LWW de registro INTEIRO** (preserva trajetória coerente; perde no
  máximo um review, nunca inventa estado). **JÁ é o comportamento atual.** NÃO implementar field-merge.
- **Ideal futuro (preserva ambos os reviews):** log append-only de eventos de review (union por id) +
  **recompute determinístico** do SM-2 a partir do log consolidado pós-merge. Validar com teste
  property-based: para quaisquer 2 trajetórias divergentes, o merge produz estado ALCANÇÁVEL pelo
  algoritmo. **(Gate item A.)**

### 2. Sem relógio causal (vector clock / HLC) — clock-skew transversal
Todo o merge depende de `epoch ms` de relógio de parede do cliente, não monotônico entre devices. Um
celular 3s adiantado **ganha todos os conflitos de todas as coleções** ao mesmo tempo; uma rajada de
edições legítimas no device "atrasado" é descartada.
- **Decisão futura:** contador monotônico por device + **HLC (hybrid logical clock)** como tiebreak,
  nunca wall-clock puro. **(Gate item B.)**

### 3. Merge não provado idempotente/comutativo + ciclo não crash-safe
`syncCollectionOnce` faz pull→merge(replaceTable clear+bulkPut)→push sem fila offline. Um crash entre
merge e push, ou um re-sync, pode ressuscitar/dobrar estado. Sem outbox persistente, push perdido em
mobile (app em background) = estado divergente silencioso.
- **Decisão futura:** outbox persistente (Dexie) de mutações de push; flush no reconectar; provar
  merge idempotente (re-rodar pull→merge→push converge). **(Gate item C.)**

### 4. LWW de registro inteiro perde edições disjuntas em sub-itens
`plans` (blocos) e `methodTracks` têm sub-estruturas; LWW de registro inteiro perde a edição de um bloco
feita no device perdedor. **Decisão futura:** promover sub-itens (sessões/blocos) a entidades próprias
com union por id. **(Gate item D.)**

### 5. Backend: compactação + identidade
- `clientMutationId` inclui hash do registro → o backend acumula 1 blob por ESTADO de cada entidade
  (cresce sem limite). **Compactação** (manter só o mais recente por entidade) precisa ser desenhada com
  cuidado (apagar o blob errado = perda). **(Gate item E.)**
  - **BLOQUEADOR achado 2026-06-28 (revisão Opus):** a compactação tentada agrupa por
    `collection:stableHash(entityId)`, mas `stableHash` é djb2 de **32 bits** (src/infra/sync/syncRecords.ts)
    e, sob E2EE, o backend NÃO vê o `entityId` real — só o hash. Duas entidades que colidam no hash de 32b
    seriam agrupadas e a mais antiga apagada = **perda silenciosa** (~0,01% a milhares de entidades por
    coleção/usuário). Os testes passam (não exercitam colisão). Logo: **NÃO compactar** antes de trocar a
    chave de entidade por uma resistente a colisão (ex.: hash forte truncado ≥128b no `clientMutationId`,
    mudança coordenada cliente+backend + migração) OU adotar retenção por TTL em vez de compactação por
    entidade. Compactação não é urgente (sync desligado, escala de beta).
- **userId (D7):** em M13 (OAuth Lichess) o userId será o username Lichess — linkável. Hashear
  (HMAC-SHA256 com segredo server-side) antes de usar como chave do D1. **(Gate item F.)**

## Implementado AGORA (Fase 2, subset seguro/reversível) — ver commit da fase
- **appMeta special-merge** (campos independentes, seguro): `adoptedAt` = mais antigo (min, write-once),
  `onboardingCompletedAt` = mais antigo não-nulo, `errorCaptureEnabled` = do `updatedAt` mais recente,
  `updatedAt` = max. Protege o carimbo de adoção de ser apagado por LWW quando o sync ligar.
- **Backend `DELETE /blobs`** (direito de exclusão — D4 / privacidade): apaga todos os blobs do
  userId autenticado.

## Adjudicação 2026-06-28 (re-council A+B; GLM 5.2 respondeu, DeepSeek fora)
- **B é PRÉ-REQUISITO de A**, não alternativa: sem relógio causal (HLC/vetor de versões), o replay de
  eventos do A fica ambiguamente ordenado entre devices.
- **HLC NÃO resolve clock-skew** — só corrige inversão causal. Além disso o backend ordena por `updatedAt`
  NUMÉRICO e não distinguiria dois HLCs com mesmo wall-ms/counter diferente → descartaria um. SM-2 é cadeia
  de Markov não-comutativa: replay sem relógio causal diverge e pode descartar o review MAIS RECENTE real.
- **Veredito: A e B são over-engineering (YAGNI) para a escala atual** (beta pessoal, 1 usuário / 2-3
  devices NTP, sync OFF). Caminho correto: **ligar o sync e MEDIR conflitos reais primeiro**; só então
  decidir A/B. Mitigação barata no meio-tempo (quando o sync ligar): **aviso de clock-skew + tiebreak
  estável por deviceId** — não muda o contrato do backend. (O tiebreak atual por `canonicalJson` já é
  determinístico/convergente; deviceId é refinamento, não correção.)
- Itens D, E (com chave resistente a colisão), F (M13) seguem válidos como gate, sem urgência.

## Itens A–F continuam GATE. Não ligar `SYNC_UI_ENABLED` antes deles.
