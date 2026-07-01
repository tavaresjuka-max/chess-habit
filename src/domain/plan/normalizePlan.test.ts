import { describe, expect, it } from 'vitest';
import type { DailyPlan } from '../types';
import { normalizePlanDestinations } from './normalizePlan';

describe('normalizePlanDestinations', () => {
  it('updates stored opening-principles blocks that still point to generic Learn', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: principios de abertura',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Learn: principios de abertura',
            url: 'https://lichess.org/learn',
          },
          estimatedMinutes: 10,
          task: 'Revise principios.',
          stopRule: 'Pare no tempo.',
          reason: 'Sinal possivel.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Video (em inglês): abertura - centro, desenvolvimento e rei seguro',
      url: 'https://lichess.org/video/gpsZAim-mYc',
    });
    expect(normalizedBlock?.task).toBe(
      'Assista uma aula curta de abertura e anote uma regra para testar na próxima partida: centro, desenvolvimento ou rei seguro.',
    );
  });

  it('updates stored opening-principles blocks that still point to analysis explorer', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: principios de abertura',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Analysis: principios e explorador de abertura',
            url: 'https://lichess.org/analysis#explorer',
          },
          estimatedMinutes: 10,
          task: 'Revise principios.',
          stopRule: 'Pare no tempo.',
          reason: 'Sinal possivel.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination.url).toBe('https://lichess.org/video/gpsZAim-mYc');
    expect(normalizedBlock?.task).toBe(
      'Assista uma aula curta de abertura e anote uma regra para testar na próxima partida: centro, desenvolvimento ou rei seguro.',
    );
  });

  it('updates stored tactical video search filters to direct video lessons', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: garfos',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Videos: táticas para iniciantes',
            url: 'https://lichess.org/video?tags=beginner%2Ftactics',
          },
          weaknessTag: 'fork',
          resourceStage: 'explain',
          estimatedMinutes: 10,
          task: 'Revise uma explicação curta de garfos.',
          stopRule: 'Pare no tempo.',
          reason: 'Foi difícil ontem.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Video (em inglês): garfos',
      url: 'https://lichess.org/video/mbiR0tcdqBY',
    });
  });

  it('updates stored tactical blocks that still point to raw puzzle themes when Practice is better', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: garfos',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Puzzles Lichess: garfos',
            url: 'https://lichess.org/training/fork',
          },
          estimatedMinutes: 10,
          task: 'Treine puzzles de garfo e procure dois alvos antes de jogar.',
          stopRule: 'Pare no tempo.',
          reason: 'Sinal possivel.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Practice: O garfo',
      url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    });
    expect(normalizedBlock?.task).toBe(
      'Estude a lição guiada de garfo e procure dois alvos antes de confirmar o lance.',
    );
  });

  it('keeps raw puzzle theme links when a block is marked as retrieval practice', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: garfos',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Puzzles Lichess: Fork',
            url: 'https://lichess.org/training/fork',
          },
          weaknessTag: 'fork',
          resourceStage: 'retrieval',
          estimatedMinutes: 10,
          task: 'Repita o tema em puzzles.',
          stopRule: 'Pare no tempo.',
          reason: 'Foi facil ontem.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination.url).toBe('https://lichess.org/training/fork');
    expect(normalizedBlock?.task).toBe('Resolva puzzles de garfos e confirme a ideia antes do primeiro lance.');
  });

  it('updates stored tactical review blocks that still point to generic analysis', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-2',
          title: 'Revisão curta',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Analysis: revisar partida terminada',
            url: 'https://lichess.org/analysis',
          },
          weaknessTag: 'fork',
          resourceStage: 'review',
          estimatedMinutes: 5,
          task: 'Revise uma posição terminada.',
          stopRule: 'Pare no tempo.',
          reason: 'Revisão curta.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Puzzles Lichess: Garfo',
      url: 'https://lichess.org/training/fork',
    });
    expect(normalizedBlock?.task).toBe('Resolva puzzles de garfos e confirme a ideia antes do primeiro lance.');
  });

  it('uses weekly focus for old short review blocks that were tagged as conversion', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      weeklyFocus: {
        tag: 'fork',
        title: 'garfos',
        reason: 'Tema do dia.',
        startsOn: '2026-06-01',
      },
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-2',
          title: 'Revisão curta',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Analysis: revisar partida terminada',
            url: 'https://lichess.org/analysis',
          },
          weaknessTag: 'conversion',
          resourceStage: 'review',
          estimatedMinutes: 5,
          task: 'Revise uma posição terminada.',
          stopRule: 'Pare no tempo.',
          reason: 'Revisão curta.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination.url).toBe('https://lichess.org/training/fork');
    expect(normalizedBlock?.weaknessTag).toBe('fork');
  });

  it('keeps equivalent plans unchanged by value when no destination changes', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 5,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [],
    };

    expect(normalizePlanDestinations(plan)).toEqual(plan);
  });

  it('uses weekly focus for old blocks with unaccented title "Revisao curta" tagged as conversion', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      weeklyFocus: { tag: 'hanging-piece', title: 'peças penduradas', reason: 'Tema.', startsOn: '2026-06-01' },
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Revisao curta',
          source: 'lichess',
          destination: { source: 'lichess', label: 'Analysis', url: 'https://lichess.org/analysis' },
          weaknessTag: 'conversion',
          resourceStage: 'review',
          estimatedMinutes: 5,
          task: 'Revise.',
          stopRule: 'Pare.',
          reason: 'Revisão.',
          coachNote: '',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const block = normalizePlanDestinations(plan).blocks[0];

    expect(block?.weaknessTag).toBe('hanging-piece');
  });

  it('replaces rejected study URLs with a lichess.org destination', () => {
    const studyUrls = [
      'https://lichess.org/study/dXKWlrkg',
      'https://lichess.org/study/izZ71JC2',
      'https://lichess.org/study/APSzIEsV',
    ];

    for (const studyUrl of studyUrls) {
      const plan: DailyPlan = {
        date: '2026-06-06',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
        blocks: [
          {
            id: 'block-1',
            title: 'Tema',
            source: 'lichess',
            destination: { source: 'lichess', label: 'Estudo', url: studyUrl },
            estimatedMinutes: 10,
            task: 'Treino.',
            stopRule: 'Pare.',
            reason: 'Sinal.',
            coachNote: '',
            status: 'pending',
            updatedAt: '2026-06-06T00:00:00.000Z',
          },
        ],
      };

      const block = normalizePlanDestinations(plan).blocks[0];

      // A URL foi substituída por um destino real — não é mais o estudo rejeitado.
      expect(block?.destination.url).not.toBe(studyUrl);
      expect(block?.destination.url).toContain('lichess.org');
    }
  });

  it('assigns specific task text for pin/skewer/discovered/mate training URLs in retrieval', () => {
    const trainingTasks: [string, string][] = [
      ['https://lichess.org/training/pin', 'cravadas'],
      ['https://lichess.org/training/skewer', 'espetos'],
      ['https://lichess.org/training/discoveredAttack', 'descobertos'],
      ['https://lichess.org/training/mateIn1', 'mates em 1'],
      ['https://lichess.org/training/mateIn2', 'mates em 2'],
    ];

    for (const [url, expectedFragment] of trainingTasks) {
      const plan: DailyPlan = {
        date: '2026-06-06',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
        blocks: [
          {
            id: 'block-1',
            title: 'Puzzles',
            source: 'lichess',
            destination: { source: 'lichess', label: 'Lichess Puzzles', url },
            resourceStage: 'retrieval',
            estimatedMinutes: 10,
            task: 'Treino.',
            stopRule: 'Pare.',
            reason: 'Sinal.',
            coachNote: '',
            status: 'pending',
            updatedAt: '2026-06-06T00:00:00.000Z',
          },
        ],
      };

      const block = normalizePlanDestinations(plan).blocks[0];

      expect(block?.task).toContain(expectedFragment);
    }
  });

  it('assigns guided task for pin/skewer/discovered practice URLs', () => {
    const practiceUrls = [
      'https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac',
      'https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5',
      'https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI',
    ];

    for (const url of practiceUrls) {
      const plan: DailyPlan = {
        date: '2026-06-06',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
        blocks: [
          {
            id: 'block-1',
            title: 'Prática guiada',
            source: 'lichess',
            destination: { source: 'lichess', label: 'Lichess Practice', url },
            resourceStage: 'retrieval',
            estimatedMinutes: 10,
            task: 'Treino.',
            stopRule: 'Pare.',
            reason: 'Sinal.',
            coachNote: '',
            status: 'pending',
            updatedAt: '2026-06-06T00:00:00.000Z',
          },
        ],
      };

      const block = normalizePlanDestinations(plan).blocks[0];

      expect(block?.task).toContain('padrão tático');
    }
  });

  it('keeps original task when normalized destination has no specific task text', () => {
    // conversion em stage review substitui /analysis pela URL de deflection,
    // que não tem task mapeada — getNormalizedTaskForDestinationUrl retorna undefined
    // (ramo default) e o task original é preservado.
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Revisão',
          source: 'lichess',
          destination: { source: 'lichess', label: 'Análise', url: 'https://lichess.org/analysis' },
          weaknessTag: 'conversion',
          resourceStage: 'review',
          estimatedMinutes: 5,
          task: 'Revise a posição.',
          stopRule: 'Pare.',
          reason: 'Sinal.',
          coachNote: '',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const block = normalizePlanDestinations(plan).blocks[0];

    // Destino foi atualizado (não é mais /analysis), task original preservado
    // porque a URL de destino de 'conversion' não tem texto mapeado no switch.
    expect(block?.destination.url).not.toBe('https://lichess.org/analysis');
    expect(block?.task).toBe('Revise a posição.');
  });

  it('assigns task text for video lessons when resourceStage is retrieval', () => {
    const videoTasks: [string, string][] = [
      ['https://lichess.org/video/wod7uXzkrTc', 'penduradas'],
      ['https://lichess.org/video/VjwSudAqLn8', 'cravadas'],
      ['https://lichess.org/video/ZexQ1kow1MM', 'espetos'],
      ['https://lichess.org/video/nMADfn1scbI', 'descoberto'],
      ['https://lichess.org/video/uhQhasudq9M', 'mate'],
      ['https://lichess.org/video/QUqq7wSLE78', 'peões'],
      ['https://lichess.org/video/0-ouahZH8X4', 'conversao'],
    ];

    for (const [url, expectedFragment] of videoTasks) {
      const plan: DailyPlan = {
        date: '2026-06-06',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
        blocks: [
          {
            id: 'block-1',
            title: 'Vídeo',
            source: 'lichess',
            destination: { source: 'lichess', label: 'Lichess Video', url },
            resourceStage: 'retrieval',
            estimatedMinutes: 10,
            task: 'Assista.',
            stopRule: 'Pare.',
            reason: 'Sinal.',
            coachNote: '',
            status: 'pending',
            updatedAt: '2026-06-06T00:00:00.000Z',
          },
        ],
      };

      const block = normalizePlanDestinations(plan).blocks[0];

      expect(block?.task).toContain(expectedFragment);
    }
  });
});
