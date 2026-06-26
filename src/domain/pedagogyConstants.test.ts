import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EASE_FACTOR,
  EF_DELTA_EASY,
  EF_DELTA_GOOD,
  EF_DELTA_HARD,
  FEEDBACK_EXPIRY_DAYS,
  GRADUATION_ACCURACY,
  GRADUATION_MIN_PUZZLES,
  MIN_ATTEMPTS_FOR_STAGE_ADVANCE,
  MIN_EASE_FACTOR,
  MIN_PUZZLE_THEME_ATTEMPTS,
  MIN_PUZZLE_THEME_LOSSES,
  MIN_PUZZLE_THEME_LOSS_RATE,
  MIN_SCORE,
  POOL_MAX_PER_SESSION,
  PRIMARY_SESSION_CEILING,
  RETENTION_GATE_DAYS,
  SECTION_ACCURACY_TARGET,
  SECTION_MIN_ATTEMPTS,
  SPACING_DAYS,
} from './pedagogyConstants';

/**
 * Testes de SENSIBILIDADE (documentação) — pedagogyConstants.ts (SPEC T6).
 *
 * Estes testes NÃO provam "que funciona": eles CONGELAM cada threshold no valor
 * acordado e documentam, no comentário do caso, o EFEITO pedagógico de mudá-lo.
 * Se alguém alterar um valor, o teste quebra de propósito — forçando a leitura
 * do comentário de INTENÇÃO em pedagogyConstants.ts antes de mexer. São testes
 * de documentação; o comportamento end-to-end vive nos testes de cada módulo.
 *
 * Comportamento PRESERVADO: os valores aqui espelham exatamente as constantes
 * locais atuais (T6 é centralização aditiva, sem mudança de valor).
 */

describe('pedagogyConstants — diagnóstico (diagnosis.ts)', () => {
  it('MIN_SCORE = 0.5 — score mínimo para fraqueza virar causa', () => {
    // Sensibilidade: < 0.5 => diagnóstico hipersensível (rotula sinal pálido);
    // > 0.5 => cego (causa real vira pergunta aberta).
    expect(MIN_SCORE).toBe(0.5);
  });

  it('MIN_PUZZLE_THEME_ATTEMPTS = 3 — amostra mínima por tema', () => {
    // Sensibilidade: < 3 => reage a fluke isolado; > 3 => lento p/ reconhecer tema problemático.
    expect(MIN_PUZZLE_THEME_ATTEMPTS).toBe(3);
  });

  it('MIN_PUZZLE_THEME_LOSSES = 2 — perda mínima documentada', () => {
    // Sensibilidade: < 2 => erro solitário vira causa; > 2 => perda crônica espalhada escapa.
    expect(MIN_PUZZLE_THEME_LOSSES).toBe(2);
  });

  it('MIN_PUZZLE_THEME_LOSS_RATE = 0.5 — errou mais que acertou', () => {
    // Sensibilidade: < 0.5 => 40% de perda já vira causa (hipersensível);
    // > 0.5 => só tema dominado pelo erro vira causa, fraqueza moderada escapa.
    expect(MIN_PUZZLE_THEME_LOSS_RATE).toBe(0.5);
  });
});

describe('pedagogyConstants — repetição espaçada (pendingItems.ts)', () => {
  it('SPACING_DAYS = [1,3,7,14] — escada geométrica', () => {
    // Sensibilidade: comprimir => mais carga diária; esticar => risco de esquecer antes da hora.
    expect([...SPACING_DAYS]).toEqual([1, 3, 7, 14]);
  });

  it('DEFAULT_EASE_FACTOR = 2.5 — escala 1 (idêntico à escada fixa)', () => {
    // Sensibilidade: aumentar => intervalos crescem globalmente (mais esquecimento);
    // diminuir => intervalos encolhem (mais carga).
    expect(DEFAULT_EASE_FACTOR).toBe(2.5);
  });

  it('MIN_EASE_FACTOR = 1.3 — piso anti-loop exaustivo', () => {
    // Sensibilidade: diminuir => revisão diária eterna pra quem erra muito;
    // aumentar => piso generoso reduz recuperação de tema difícil.
    expect(MIN_EASE_FACTOR).toBe(1.3);
  });

  it('RETENTION_GATE_DAYS = 30 — resgate cego ~1 mês antes de formar', () => {
    // Sensibilidade: diminuir => falsos formados (memória curta); aumentar => graduação rara.
    expect(RETENTION_GATE_DAYS).toBe(30);
  });

  it('EF_DELTA_EASY = +0.15 — recompensa suave à confiança confirmada', () => {
    // Sensibilidade: maior => 'easy' acelera demais (superestima); menor => perde poder de calibração.
    expect(EF_DELTA_EASY).toBe(0.15);
  });

  it('EF_DELTA_GOOD = +0.05 — avanço mínimo, good é neutro-positivo', () => {
    // Sensibilidade: maior => 'good' vira acelerador disfarçado; menor/negativo => preso na cadência curta.
    expect(EF_DELTA_GOOD).toBe(0.05);
  });

  it('EF_DELTA_HARD = -0.20 — recua EF ao sinalizar dificuldade', () => {
    // Sensibilidade: menos negativo => 'hard' ignorado (afunda em intervalos longos);
    // mais negativo => pune demais.
    expect(EF_DELTA_HARD).toBe(-0.2);
  });
});

describe('pedagogyConstants — graduação/pool (schedulerConstants.ts)', () => {
  it('POOL_MAX_PER_SESSION = 2 — working memory TDAH', () => {
    // Sensibilidade: aumentar => sobrecarga (mistura padrões); diminuir (1) => ilha de prática.
    expect(POOL_MAX_PER_SESSION).toBe(2);
  });

  it('GRADUATION_MIN_PUZZLES = 30 — amostra anti-fluke', () => {
    // Sensibilidade: diminuir => gradua com sorte; aumentar => demora a formar, perde senso de progresso.
    expect(GRADUATION_MIN_PUZZLES).toBe(30);
  });

  it('GRADUATION_ACCURACY = 80 — dominou, não "acertou metade"', () => {
    // Sensibilidade: diminuir => falso domínio; aumentar => só elite forma, frustração.
    expect(GRADUATION_ACCURACY).toBe(80);
  });

  it('PRIMARY_SESSION_CEILING = 12 — teto anti-trava', () => {
    // Sensibilidade: diminuir => rotação prematura; aumentar => preso semanas sem avançar.
    expect(PRIMARY_SESSION_CEILING).toBe(12);
  });
});

describe('pedagogyConstants — plano (generatePlan.ts)', () => {
  it('FEEDBACK_EXPIRY_DAYS = 14 — feedback velho não trava estágio', () => {
    // Sensibilidade: diminuir => expira cedo (oscila); aumentar => feedback de meses ainda manda (inércia).
    expect(FEEDBACK_EXPIRY_DAYS).toBe(14);
  });

  it('MIN_ATTEMPTS_FOR_STAGE_ADVANCE = 30 — anti-ratchet na promoção', () => {
    // Sensibilidade: diminuir => promove no ruído (avanço fantasma); aumentar => estágio travado por muito tempo.
    expect(MIN_ATTEMPTS_FOR_STAGE_ADVANCE).toBe(30);
  });
});

describe('pedagogyConstants — diplomas (diplomas.ts)', () => {
  it('SECTION_ACCURACY_TARGET = 80 — diploma atesta domínio', () => {
    // Sensibilidade: diminuir => diploma inflado; aumentar => elitiza, frustração.
    expect(SECTION_ACCURACY_TARGET).toBe(80);
  });

  it('SECTION_MIN_ATTEMPTS = 30 — diploma não concedido sobre sorte', () => {
    // Sensibilidade: diminuir => diploma sobre amostra rala; aumentar => demora a validar, sem feedback de conquista.
    expect(SECTION_MIN_ATTEMPTS).toBe(30);
  });
});

describe('pedagogyConstants — invariantes de coerência do design', () => {
  // Estes invariantes capturam RELAÇÕES intencionais entre constantes. Mudar um
  // valor sem casar o outro QUEBRA um alinhamento documentado nos comentários de
  // origem ("Alinhado ao SECTION_ACCURACY_TARGET", "Alinhado a GRADUATION_*").

  it('Piso do EF está abaixo do default (clamp não começa ativo)', () => {
    // Se MIN_EASE_FACTOR >= DEFAULT_EASE_FACTOR, todo item começa clampado e o
    // feedback 'easy' jamais estica o intervalo — o SR adaptativo é desativado.
    expect(MIN_EASE_FACTOR).toBeLessThan(DEFAULT_EASE_FACTOR);
  });

  it('Deltas de EF respeitam ordem do feedback: hard < good < easy', () => {
    // Garante que o feedback tem sinal monotônico: 'easy' ajuda mais que 'good',
    // 'good' mais que 'hard'. Inverter isso significa calibrar o aluno ao contrário.
    expect(EF_DELTA_HARD).toBeLessThan(EF_DELTA_GOOD);
    expect(EF_DELTA_GOOD).toBeLessThan(EF_DELTA_EASY);
  });

  it('SPACING_DAYS é crescente estrito (revisão expande, não contrai)', () => {
    // Se um degrau for menor ou igual ao anterior, a "escada" estagna ou recua —
    // o aluno revê mais cedo do que deveria sem ter consolidado.
    const days = [...SPACING_DAYS];
    const strictlyIncreasing = days.every((curr, i) => curr > (days[i - 1] ?? Number.NEGATIVE_INFINITY));
    expect(strictlyIncreasing).toBe(true);
  });

  it('Acurácia de graduação alinhada à acurácia de diploma (80)', () => {
    // Comentar em schedulerConstants.ts: "alinhada ao SECTION_ACCURACY_TARGET".
    // Dessincronizar cria dois padrões de domínio conflitantes no mesmo método.
    expect(GRADUATION_ACCURACY).toBe(SECTION_ACCURACY_TARGET);
  });

  it('Piso de amostra de 30 alinhado entre graduação, diploma e avanço de estágio', () => {
    // Três portas distintas do método compartilham o mesmo piso anti-fluke (30).
    // Comentar em generatePlan.ts: "Alinhado ao padrão de graduação (SECTION_MIN_ATTEMPTS=30)".
    // Dessincronizar permite "fabricar progresso" numa porta mas não na outra.
    expect(GRADUATION_MIN_PUZZLES).toBe(SECTION_MIN_ATTEMPTS);
    expect(MIN_ATTEMPTS_FOR_STAGE_ADVANCE).toBe(SECTION_MIN_ATTEMPTS);
  });
});
