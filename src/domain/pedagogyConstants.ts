/**
 * Constantes pedagógicas centralizadas (SPEC T6, 2026-06-26).
 *
 * INTENÇÃO deste arquivo: reunir num único ponto os thresholds que codificam as
 * DECISÕES pedagógicas do método — diagnóstico, repetição espaçada, graduação de
 * tema e plano. Centralizar documenta a "malha de julgamento" do tutor num lugar
 * só, facilitando auditoria, ajuste consciente e teste de sensibilidade.
 *
 * STATUS (T6): centralização ADITIVA — mesmo valor, mesmo comportamento. Os
 * módulos de origem (diagnosis.ts, pendingItems.ts, schedulerConstants.ts,
 * generatePlan.ts, diplomas.ts) mantêm suas constantes locais; este arquivo é a
 * referência canônica para a migração numa próxima fase. NÃO alterar nenhum
 * valor aqui sem ler o efeito documentado em pedagogyConstants.test.ts.
 */

// ===========================================================================
// DIAGNÓSTICO — quando um sinal vira "causa" nomeada (coach/diagnosis.ts)
// ===========================================================================

/**
 * Score mínimo de uma fraqueza agregada para virar causa nomeada no diagnóstico.
 * INTENÇÃO: filtrar ruído — só rotular o que tem peso real; abaixo disso o
 * diagnóstico cai numa pergunta aberta (sem causa falsa).
 * Sensibilidade: diminuir => diagnóstico hipersensível (rotula sinal pálido como
 * causa); aumentar => diagnóstico cego (causa real fica sem nome, vira pergunta).
 */
export const MIN_SCORE = 0.5;

/**
 * Tentativas mínimas de um tema de puzzle antes de poder virar causa.
 * INTENÇÃO: exigir amostra mínima para não diagnosticar "fraqueza" sobre 1-2
 * lances (puramente variância).
 * Sensibilidade: diminuir => diagnóstico reage a fluke isolado; aumentar => fica
 * lento para reconhecer um tema problemático emergente.
 */
export const MIN_PUZZLE_THEME_ATTEMPTS = 3;

/**
 * Erros mínimos de um tema de puzzle para poder virar causa.
 * INTENÇÃO: garantir que a causa tenha PERDA documentada, não só volume de jogo.
 * Sensibilidade: diminuir => um erro solitário vira causa (falso); aumentar =>
 * temas com perdas reais espalhadas nunca viram causa (cega para perda crônica).
 */
export const MIN_PUZZLE_THEME_LOSSES = 2;

/**
 * Taxa de perda mínima de um tema para virar causa.
 * INTENÇÃO: distinguir "errei porque vi pouco" de "errei a maioria". 0.5 = errou
 * mais do que acertou.
 * Sensibilidade: diminuir => tema com 40% de perda vira causa (sensível demais);
 * aumentar => só tema dominado pelo erro (70%+) vira causa, deixando passar
 * fraquezas moderadas.
 */
export const MIN_PUZZLE_THEME_LOSS_RATE = 0.5;

// ===========================================================================
// REPETIÇÃO ESPAÇADA (SR) — cadência e ease factor (method/pendingItems.ts)
// ===========================================================================

/**
 * Escada de espaçamento fixa em dias, indexada por tentativas.
 * INTENÇÃO: revisão que cresce ~geometricamente (amanhã, 3d, 7d, 14d) — calibrada
 * para retenção de longo prazo sem afogar o aluno TDAH em revisão.
 * Sensibilidade: comprimir (ex.: [1,2,4]) => mais revisão, mais carga diária;
 * esticar (ex.: [1,5,15]) => menos carga, maior risco de esquecer antes da hora.
 */
export const SPACING_DAYS = [1, 3, 7, 14] as const;

/**
 * Ease factor padrão (SM-2).
 * INTENÇÃO: ponto de equilíbrio onde a escala (EF/DEFAULT) = 1 => intervalos
 * idênticos à escada fixa (retrocompatível). 2.5 é o default clássico do SM-2.
 * Sensibilidade: aumentar => todos os intervalos crescem globalmente (menos
 * revisão, mais esquecimento); diminuir => intervalos encolhem (mais carga).
 */
export const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Ease factor mínimo (piso do clamp).
 * INTENÇÃO: o EF nunca desce tanto a ponto de virar revisão diária eterna —
 * protege o aluno que erra muito de um loop exaustivo.
 * Sensibilidade: diminuir => aluno em dificuldade revê todo dia sem escape;
 * aumentar => piso "generoso" reduz a recuperação de tema difícil.
 */
export const MIN_EASE_FACTOR = 1.3;

/**
 * Gate de retenção: dias até o resgate CEGO de longo prazo antes da graduação.
 * INTENÇÃO: só forma um item se ele reter o padrão ~1 mês sem ver — prova de
 * retenção real, não de memória de curto prazo.
 * Sensibilidade: diminuir => falsos "formados" (reteve só na curta distância);
 * aumentar => graduação rara e o item vive muito tempo no sistema.
 */
export const RETENTION_GATE_DAYS = 30;

/**
 * Delta de EF para feedback 'easy'.
 * INTENÇÃO: recompensar confiança confirmada esticando o próximo intervalo;
 * +0.15 é suave para não dobrar o EF de uma vez.
 * Sensibilidade: aumentar => 'easy' acelera demais (risco de superestimar e
 * esquecer); diminuir => 'easy' quase não muda nada, perdendo o poder de
 * calibração do feedback.
 */
export const EF_DELTA_EASY = 0.15;

/**
 * Delta de EF para feedback 'good'.
 * INTENÇÃO: avanço mínimo que confirma ritmo certo; +0.05 é leve pois 'good' é
 * neutro-positivo, não vitória.
 * Sensibilidade: aumentar => 'good' vira acelerador disfarçado; diminuir (ou
 * negativo) => dizer 'good' nunca ajuda e o aluno fica preso na cadência curta.
 */
export const EF_DELTA_GOOD = 0.05;

/**
 * Delta de EF para feedback 'hard'.
 * INTENÇÃO: recuar o EF quando o aluno sinaliza dificuldade, aproximando as
 * revisições; o piso (MIN_EASE_FACTOR) impede o colapso.
 * Sensibilidade: menos negativo => 'hard' ignorado e o aluno afunda em
 * intervalos longos que não suporta; mais negativo => 'hard' pune demais.
 */
export const EF_DELTA_HARD = -0.2;

// ===========================================================================
// GRADUAÇÃO DE TEMA / POOL — scheduler híbrido (plan/schedulerConstants.ts)
// ===========================================================================

/**
 * Máximo de temas distintos no pool de intercalação por sessão.
 * INTENÇÃO: proteger a working memory do aluno TDAH — 2 temas forçam
 * discriminação sem sobrecarga cognitiva.
 * Sensibilidade: aumentar => sobrecarga (aluno mistura padrões); diminuir (1)
 * => perde o benefício da intercalação (ilha de prática monótona).
 */
export const POOL_MAX_PER_SESSION = 2;

/**
 * Mínimo de puzzles para qualificar a graduação de um tema.
 * INTENÇÃO: exigir amostra estatística para cravar "formou" — 30 amortiza a
 * variância. Alinhado a SECTION_MIN_ATTEMPTS e MIN_ATTEMPTS_FOR_STAGE_ADVANCE.
 * Sensibilidade: diminuir => gradua com sorte (fluke); aumentar => tema demora
 * a formar e o aluno perde a sensação de progresso.
 */
export const GRADUATION_MIN_PUZZLES = 30;

/**
 * Acurácia mínima (%) para graduação de tema.
 * INTENÇÃO: 80% = dominou o tema de fato (não "acertou metade"). Alinhado ao
 * SECTION_ACCURACY_TARGET do diploma.
 * Sensibilidade: diminuir => forma quem ainda erra muito (falso domínio);
 * aumentar => só o elite forma, frustração.
 */
export const GRADUATION_ACCURACY = 80;

/**
 * Teto de sessões com o mesmo tema primário antes de forçar rotação.
 * INTENÇÃO: anti-trava — se o tema não gradua em ~12 sessões, força rotação para
 * não prender o aluno num beco sem progresso visível.
 * Sensibilidade: diminuir => rotação prematura (não dá tempo de consolidar);
 * aumentar => aluno fica semanas preso no mesmo tema sem avançar (desmotiva).
 */
export const PRIMARY_SESSION_CEILING = 12;

// ===========================================================================
// PLANO — expiração de feedback e amostra de avanço (plan/generatePlan.ts)
// ===========================================================================

/**
 * Dias após os quais um feedback explícito deixa de FORÇAR o estágio.
 * INTENÇÃO: feedback velho (>14d) não trava o aluno num estágio para sempre — a
 * acurácia recente volta a gatear; nunca regride abaixo do já alcançado.
 * Sensibilidade: diminuir => feedback expira cedo (oscila muito); aumentar =>
 * feedback de meses atrás ainda manda (inércia, desatualiza).
 */
export const FEEDBACK_EXPIRY_DAYS = 14;

/**
 * Tentativas mínimas antes de a acurácia poder PROMOVER o estágio.
 * INTENÇÃO: anti-ratchet — avançar estágio exige amostra robusta (30), senão 3
 * acertos sortudos "fabricam progresso sobre ruído" e o floor trava o avanço
 * para sempre. Regredir com amostra fina continua permitido (direção segura).
 * Sensibilidade: diminuir => promove no ruído (avanço fantasma); aumentar =>
 * estágio travado por muito tempo mesmo com desempenho real bom.
 */
export const MIN_ATTEMPTS_FOR_STAGE_ADVANCE = 30;

// ===========================================================================
// DIPLOMAS — gate de acurácia e volume por seção (method/diplomas.ts)
// ===========================================================================

/**
 * Acurácia mínima (%) para passar uma seção de diploma.
 * INTENÇÃO: o diploma atesta domínio mensurável — 80% = acertou a grande maioria
 * sob pressão real, não "passou raspando". Alinhado a GRADUATION_ACCURACY.
 * Sensibilidade: diminuir => diploma inflado (não atesta domínio real); aumentar
 * => diploma elitiza, poucos conseguem, vira fonte de frustração.
 */
export const SECTION_ACCURACY_TARGET = 80;

/**
 * Tentativas mínimas para validar uma seção de diploma.
 * INTENÇÃO: mesmo princípio de GRADUATION_MIN_PUZZLES — 30 amortiza variância
 * para o diploma não ser concedido sobre 2-3 acertos sortudos.
 * Sensibilidade: diminuir => diploma sobre amostra rala (sorte); aumentar =>
 * seção demora a validar e o aluno fica sem feedback de conquista por muito tempo.
 */
export const SECTION_MIN_ATTEMPTS = 30;
