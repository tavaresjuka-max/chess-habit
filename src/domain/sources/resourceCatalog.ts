import type { Destination, LearnerBand, WeaknessTag } from '../types';

export type LichessResourceKind =
  | 'analysis-tool'
  | 'learn-basics'
  | 'practice-study'
  | 'puzzle-mode'
  | 'puzzle-theme'
  | 'video-filter';

export type LichessCatalogSource =
  | 'lichess-api-puzzles'
  | 'lichess-learn'
  | 'lichess-practice-source'
  | 'lichess-puzzle-theme-xml'
  | 'lichess-training-page'
  | 'lichess-video-library';

export type LichessResource = {
  id: string;
  kind: LichessResourceKind;
  title: string;
  label: string;
  description: string;
  url?: string;
  source: LichessCatalogSource;
  bands: readonly LearnerBand[];
  recommendedFor: readonly WeaknessTag[];
  priority: number;
};

type PracticeStudyInput = {
  sectionId: string;
  studyId: string;
  title: string;
  description: string;
  recommendedFor?: readonly WeaknessTag[];
  bands?: readonly LearnerBand[];
  priority?: number;
};

type PuzzleThemeInput = {
  slug: string;
  title: string;
  group: string;
  recommendedFor?: readonly WeaknessTag[];
  bands?: readonly LearnerBand[];
  priority?: number;
};

const allBands = ['0-800', '800-1200'] as const;
const beginnerBands = ['0-800'] as const;
const improvingBands = ['800-1200'] as const;

export const lichessPracticeStudies = [
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'BJy6fEDf',
    title: 'Piece Checkmates I',
    description: 'Licao guiada para mates basicos com pecas.',
    recommendedFor: ['mate-in-1', 'mate-in-2'],
    bands: beginnerBands,
    priority: 92,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'fE4k21MW',
    title: 'Checkmate Patterns I',
    description: 'Primeiro bloco guiado de padroes de mate.',
    recommendedFor: ['mate-in-1', 'mate-in-2', 'back-rank'],
    bands: beginnerBands,
    priority: 91,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: '8yadFPpU',
    title: 'Checkmate Patterns II',
    description: 'Segundo bloco guiado de padroes de mate.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    priority: 86,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'PDkQDt6u',
    title: 'Checkmate Patterns III',
    description: 'Padroes de mate para consolidar reconhecimento.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    priority: 82,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: '96Lij7wH',
    title: 'Checkmate Patterns IV',
    description: 'Padroes de mate mais variados.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    bands: improvingBands,
    priority: 78,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'Rg2cMBZ6',
    title: 'Piece Checkmates II',
    description: 'Mates de pecas com exigencia maior.',
    recommendedFor: ['mate-in-2'],
    bands: improvingBands,
    priority: 76,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'ByhlXnmM',
    title: 'Knight & Bishop Mate',
    description: 'Licao interativa de mate com bispo e cavalo.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 44,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: '9ogFv8Ac',
    title: 'The Pin',
    description: 'Licao guiada de cravada antes de repetir puzzles.',
    recommendedFor: ['pin'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'tuoBxVE5',
    title: 'The Skewer',
    description: 'Licao guiada de espeto antes de repetir puzzles.',
    recommendedFor: ['skewer'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'Qj281y1p',
    title: 'The Fork',
    description: 'Licao guiada de garfo antes de repetir puzzles.',
    recommendedFor: ['fork'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'MnsJEWnI',
    title: 'Discovered Attacks',
    description: 'Licao guiada para ataques descobertos e checks descobertos.',
    recommendedFor: ['discovered'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'RUQASaZm',
    title: 'Double Check',
    description: 'Licao guiada para checks duplos.',
    recommendedFor: ['discovered', 'mate-in-2'],
    priority: 82,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'o734CNqp',
    title: 'Overloaded Pieces',
    description: 'Licao guiada de peca sobrecarregada.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 58,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'ITWY4GN2',
    title: 'Zwischenzug',
    description: 'Licao guiada de lance intermediario.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 54,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'lyVYjhPG',
    title: 'X-Ray',
    description: 'Licao guiada para ataques atraves de linhas.',
    recommendedFor: ['discovered', 'pin', 'skewer'],
    bands: improvingBands,
    priority: 62,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '9cKgYrHb',
    title: 'Zugzwang',
    description: 'Licao guiada de zugzwang.',
    recommendedFor: ['conversion', 'endgame-pawn'],
    bands: improvingBands,
    priority: 54,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'g1fxVZu9',
    title: 'Interference',
    description: 'Licao guiada de interferencia.',
    recommendedFor: ['discovered', 'conversion'],
    bands: improvingBands,
    priority: 50,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 's5pLU7Of',
    title: 'Greek Gift',
    description: 'Estudo guiado do sacrificio Greek Gift.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'kdKpaYLW',
    title: 'Deflection',
    description: 'Licao guiada de desvio de defensor.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 52,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'jOZejFWk',
    title: 'Attraction',
    description: 'Licao guiada de atracao.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 52,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '49fDW0wP',
    title: 'Underpromotion',
    description: 'Licao guiada de subpromocao.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    bands: improvingBands,
    priority: 50,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '0YcGiH4Y',
    title: 'Desperado',
    description: 'Licao guiada de peca perdida que ainda cria recurso.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 42,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'CgjKPvxQ',
    title: 'Counter Check',
    description: 'Licao guiada para responder check com check.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 42,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'udx042D6',
    title: 'Undermining',
    description: 'Licao guiada de remover sustentacao.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'Grmtwuft',
    title: 'Clearance',
    description: 'Licao guiada de liberar casa, coluna ou diagonal.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'xebrDvFe',
    title: 'Key Squares',
    description: 'Licao guiada de casas-chave em finais de peoes.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'A4ujYOer',
    title: 'Opposition',
    description: 'Licao guiada de oposicao.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 92,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'pt20yRkT',
    title: '7th-Rank Rook Pawn',
    description: 'Licao guiada de peao de torre na setima contra dama.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    bands: improvingBands,
    priority: 72,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'MkDViieT',
    title: '7th-Rank Rook Pawn',
    description: 'Licao guiada de torre passiva contra peao de torre na setima.',
    recommendedFor: ['endgame-rook', 'conversion'],
    bands: improvingBands,
    priority: 86,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'pqUSUw8Y',
    title: 'Basic Rook Endgames',
    description: 'Licao guiada de Lucena e Philidor.',
    recommendedFor: ['endgame-rook', 'conversion'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'heQDnvq7',
    title: 'Intermediate Rook Endings',
    description: 'Finais de torre para ampliar repertorio pratico.',
    recommendedFor: ['endgame-rook', 'conversion'],
    bands: improvingBands,
    priority: 78,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'wS23j5Tm',
    title: 'Practical Rook Endings',
    description: 'Finais de torre praticos com varios peoes.',
    recommendedFor: ['endgame-rook', 'conversion'],
    bands: improvingBands,
    priority: 74,
  }),
] as const satisfies readonly LichessResource[];

export const lichessPuzzleThemes = [
  puzzleTheme({ slug: 'mix', title: 'Healthy mix', group: 'recommended', recommendedFor: ['blunder-rate'], priority: 70 }),
  puzzleTheme({ slug: 'opening', title: 'Opening', group: 'phases', recommendedFor: ['opening-principles'], priority: 64 }),
  puzzleTheme({ slug: 'middlegame', title: 'Middlegame', group: 'phases' }),
  puzzleTheme({ slug: 'endgame', title: 'Endgame', group: 'phases', recommendedFor: ['endgame-pawn', 'endgame-rook'], priority: 62 }),
  puzzleTheme({ slug: 'rookEndgame', title: 'Rook endgame', group: 'phases', recommendedFor: ['endgame-rook'], priority: 78 }),
  puzzleTheme({ slug: 'bishopEndgame', title: 'Bishop endgame', group: 'phases' }),
  puzzleTheme({ slug: 'pawnEndgame', title: 'Pawn endgame', group: 'phases', recommendedFor: ['endgame-pawn'], priority: 78 }),
  puzzleTheme({ slug: 'knightEndgame', title: 'Knight endgame', group: 'phases' }),
  puzzleTheme({ slug: 'queenEndgame', title: 'Queen endgame', group: 'phases' }),
  puzzleTheme({ slug: 'queenRookEndgame', title: 'Queen and Rook', group: 'phases', recommendedFor: ['endgame-rook'] }),
  puzzleTheme({ slug: 'advancedPawn', title: 'Advanced pawn', group: 'motifs', recommendedFor: ['endgame-pawn', 'conversion'] }),
  puzzleTheme({ slug: 'attackingF2F7', title: 'Attacking f2 or f7', group: 'motifs', recommendedFor: ['opening-principles'] }),
  puzzleTheme({ slug: 'capturingDefender', title: 'Capture the defender', group: 'motifs', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'discoveredAttack', title: 'Discovered attack', group: 'motifs', recommendedFor: ['discovered'], priority: 88 }),
  puzzleTheme({ slug: 'doubleCheck', title: 'Double check', group: 'motifs', recommendedFor: ['discovered', 'mate-in-2'] }),
  puzzleTheme({ slug: 'exposedKing', title: 'Exposed king', group: 'motifs', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'fork', title: 'Fork', group: 'motifs', recommendedFor: ['fork'], priority: 88 }),
  puzzleTheme({ slug: 'hangingPiece', title: 'Hanging piece', group: 'motifs', recommendedFor: ['hanging-piece', 'blunder-rate'], priority: 96 }),
  puzzleTheme({ slug: 'kingsideAttack', title: 'Kingside attack', group: 'motifs', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'pin', title: 'Pin', group: 'motifs', recommendedFor: ['pin'], priority: 88 }),
  puzzleTheme({ slug: 'queensideAttack', title: 'Queenside attack', group: 'motifs' }),
  puzzleTheme({ slug: 'sacrifice', title: 'Sacrifice', group: 'motifs', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'skewer', title: 'Skewer', group: 'motifs', recommendedFor: ['skewer'], priority: 88 }),
  puzzleTheme({ slug: 'trappedPiece', title: 'Trapped piece', group: 'motifs', recommendedFor: ['hanging-piece'] }),
  puzzleTheme({ slug: 'attraction', title: 'Attraction', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'clearance', title: 'Clearance', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'collinearMove', title: 'Collinear move', group: 'advanced' }),
  puzzleTheme({ slug: 'discoveredCheck', title: 'Discovered check', group: 'advanced', recommendedFor: ['discovered'] }),
  puzzleTheme({ slug: 'defensiveMove', title: 'Defensive move', group: 'advanced', recommendedFor: ['blunder-rate', 'conversion'] }),
  puzzleTheme({ slug: 'deflection', title: 'Deflection', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'interference', title: 'Interference', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'intermezzo', title: 'Intermezzo', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'quietMove', title: 'Quiet move', group: 'advanced', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'xRayAttack', title: 'X-Ray attack', group: 'advanced', recommendedFor: ['pin', 'skewer', 'discovered'] }),
  puzzleTheme({ slug: 'zugzwang', title: 'Zugzwang', group: 'advanced', recommendedFor: ['endgame-pawn', 'conversion'] }),
  puzzleTheme({ slug: 'mate', title: 'Checkmate', group: 'mates', recommendedFor: ['mate-in-1', 'mate-in-2', 'back-rank'] }),
  puzzleTheme({ slug: 'mateIn1', title: 'Mate in 1', group: 'mates', recommendedFor: ['mate-in-1'], priority: 90 }),
  puzzleTheme({ slug: 'mateIn2', title: 'Mate in 2', group: 'mates', recommendedFor: ['mate-in-2'], priority: 90 }),
  puzzleTheme({ slug: 'mateIn3', title: 'Mate in 3', group: 'mates', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'mateIn4', title: 'Mate in 4', group: 'mates' }),
  puzzleTheme({ slug: 'mateIn5', title: 'Mate in 5 or more', group: 'mates' }),
  puzzleTheme({ slug: 'anastasiaMate', title: "Anastasia's mate", group: 'mate-themes', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'arabianMate', title: 'Arabian mate', group: 'mate-themes', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'backRankMate', title: 'Back rank mate', group: 'mate-themes', recommendedFor: ['back-rank'], priority: 90 }),
  puzzleTheme({ slug: 'balestraMate', title: 'Balestra mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'blindSwineMate', title: 'Blind Swine mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'bodenMate', title: "Boden's mate", group: 'mate-themes' }),
  puzzleTheme({ slug: 'cornerMate', title: 'Corner mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'doubleBishopMate', title: 'Double bishop mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'dovetailMate', title: 'Dovetail mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'epauletteMate', title: 'Epaulette mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'hookMate', title: 'Hook mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'killBoxMate', title: 'Kill box mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'pillsburysMate', title: "Pillsbury's mate", group: 'mate-themes' }),
  puzzleTheme({ slug: 'morphysMate', title: "Morphy's mate", group: 'mate-themes' }),
  puzzleTheme({ slug: 'operaMate', title: 'Opera mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'swallowstailMate', title: "Swallow's tail mate", group: 'mate-themes' }),
  puzzleTheme({ slug: 'triangleMate', title: 'Triangle mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'vukovicMate', title: 'Vukovic mate', group: 'mate-themes' }),
  puzzleTheme({ slug: 'smotheredMate', title: 'Smothered mate', group: 'mate-themes', recommendedFor: ['mate-in-2'] }),
  puzzleTheme({ slug: 'castling', title: 'Castling', group: 'special-moves', recommendedFor: ['opening-principles'] }),
  puzzleTheme({ slug: 'enPassant', title: 'En passant rights', group: 'special-moves' }),
  puzzleTheme({ slug: 'promotion', title: 'Promotion', group: 'special-moves', recommendedFor: ['endgame-pawn'] }),
  puzzleTheme({ slug: 'underPromotion', title: 'Underpromotion', group: 'special-moves', recommendedFor: ['endgame-pawn'] }),
  puzzleTheme({ slug: 'equality', title: 'Equality', group: 'goals', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'advantage', title: 'Advantage', group: 'goals', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'crushing', title: 'Crushing', group: 'goals', recommendedFor: ['conversion'] }),
  puzzleTheme({ slug: 'oneMove', title: 'One-move puzzle', group: 'lengths', recommendedFor: ['mate-in-1'] }),
  puzzleTheme({ slug: 'short', title: 'Short puzzle', group: 'lengths', recommendedFor: ['fork', 'hanging-piece', 'pin', 'skewer'] }),
  puzzleTheme({ slug: 'long', title: 'Long puzzle', group: 'lengths', recommendedFor: ['mate-in-2', 'conversion'] }),
  puzzleTheme({ slug: 'veryLong', title: 'Very long puzzle', group: 'lengths' }),
  puzzleTheme({ slug: 'master', title: 'Master games', group: 'origin' }),
  puzzleTheme({ slug: 'masterVsMaster', title: 'Master vs Master games', group: 'origin' }),
  puzzleTheme({ slug: 'superGM', title: 'Super GM games', group: 'origin' }),
] as const satisfies readonly LichessResource[];

export const lichessOtherResources = [
  resource({
    id: 'learn:basics',
    kind: 'learn-basics',
    title: 'Chess basics',
    label: 'Lichess Learn: fundamentos do xadrez',
    description: 'Fundamentos iniciais de regras, movimento e coordenadas.',
    url: 'https://lichess.org/learn',
    source: 'lichess-learn',
    bands: beginnerBands,
    recommendedFor: ['blunder-rate'],
    priority: 40,
  }),
  resource({
    id: 'puzzle-mode:themes',
    kind: 'puzzle-mode',
    title: 'Puzzle Themes',
    label: 'Lichess Puzzles: escolher tema',
    description: 'Indice oficial de temas de puzzle.',
    url: 'https://lichess.org/training/themes',
    source: 'lichess-training-page',
    priority: 25,
  }),
  resource({
    id: 'puzzle-mode:streak',
    kind: 'puzzle-mode',
    title: 'Puzzle Streak',
    label: 'Lichess Puzzle Streak: sequencia sem pressa',
    description: 'Modo de sequencia para calibrar precisao antes de velocidade.',
    url: 'https://lichess.org/streak',
    source: 'lichess-training-page',
    recommendedFor: ['blunder-rate', 'time-trouble'],
    priority: 58,
  }),
  resource({
    id: 'puzzle-mode:storm',
    kind: 'puzzle-mode',
    title: 'Puzzle Storm',
    label: 'Lichess Puzzle Storm: ritmo tactico curto',
    description: 'Modo cronometrado para treinar reconhecimento sob pressao.',
    url: 'https://lichess.org/storm',
    source: 'lichess-training-page',
    recommendedFor: ['time-trouble'],
    bands: improvingBands,
    priority: 52,
  }),
  resource({
    id: 'puzzle-mode:of-player',
    kind: 'puzzle-mode',
    title: 'Puzzles from player games',
    label: 'Lichess Puzzles: dos seus jogos',
    description: 'Busca puzzles gerados de jogos de um jogador.',
    url: 'https://lichess.org/training/of-player',
    source: 'lichess-training-page',
    recommendedFor: ['conversion', 'blunder-rate'],
    priority: 56,
  }),
  videoFilter({
    id: 'video:beginner-opening',
    title: 'Beginner opening videos',
    label: 'Lichess Videos: aulas de abertura para iniciantes',
    tags: ['beginner', 'opening'],
    recommendedFor: ['opening-principles'],
    priority: 96,
  }),
  videoFilter({
    id: 'video:beginner-fundamentals',
    title: 'Beginner fundamentals videos',
    label: 'Lichess Videos: fundamentos para iniciantes',
    tags: ['beginner', 'fundamentals'],
    recommendedFor: ['blunder-rate'],
    priority: 54,
  }),
  videoFilter({
    id: 'video:beginner-tactics',
    title: 'Beginner tactics videos',
    label: 'Lichess Videos: tacticas para iniciantes',
    tags: ['beginner', 'tactics'],
    recommendedFor: ['fork', 'pin', 'skewer', 'discovered', 'hanging-piece'],
    priority: 50,
  }),
  videoFilter({
    id: 'video:beginner-endgame',
    title: 'Beginner endgame videos',
    label: 'Lichess Videos: finais para iniciantes',
    tags: ['beginner', 'endgame'],
    recommendedFor: ['endgame-pawn', 'endgame-rook'],
    priority: 50,
  }),
  resource({
    id: 'analysis:finished-game-review',
    kind: 'analysis-tool',
    title: 'Analysis board',
    label: 'Lichess Analysis: revisar partida terminada',
    description: 'Prancheta de analise para revisar apenas partidas terminadas.',
    url: 'https://lichess.org/analysis',
    source: 'lichess-training-page',
    recommendedFor: ['conversion', 'time-trouble'],
    priority: 46,
  }),
] as const satisfies readonly LichessResource[];

export const lichessResourceCatalog = [
  ...lichessPracticeStudies,
  ...lichessPuzzleThemes,
  ...lichessOtherResources,
] as const satisfies readonly LichessResource[];

const primaryResourceIdByWeakness = {
  'hanging-piece': 'puzzle:hangingPiece',
  fork: 'practice:fundamental-tactics:the-fork',
  pin: 'practice:fundamental-tactics:the-pin',
  skewer: 'practice:fundamental-tactics:the-skewer',
  discovered: 'practice:fundamental-tactics:discovered-attacks',
  'mate-in-1': 'practice:checkmates:piece-checkmates-i',
  'mate-in-2': 'practice:checkmates:checkmate-patterns-i',
  'back-rank': 'puzzle:backRankMate',
  'opening-principles': 'video:beginner-opening',
  'time-trouble': 'analysis:finished-game-review',
  'endgame-pawn': 'practice:pawn-endgames:key-squares',
  'endgame-rook': 'practice:rook-endgames:basic-rook-endgames',
  conversion: 'analysis:finished-game-review',
  'blunder-rate': 'puzzle:hangingPiece',
} satisfies Record<WeaknessTag, LichessResource['id']>;

export function getLichessResourcesForWeakness(tag: WeaknessTag): LichessResource[] {
  return lichessResourceCatalog
    .filter((resourceItem) => resourceItem.recommendedFor.includes(tag))
    .sort((left, right) => right.priority - left.priority || left.title.localeCompare(right.title));
}

export function getPrimaryLichessResourceForWeakness(tag: WeaknessTag): LichessResource {
  const primaryId = primaryResourceIdByWeakness[tag];
  const primary = lichessResourceCatalog.find((resourceItem) => resourceItem.id === primaryId);

  if (primary === undefined) {
    throw new Error(`Lichess resource catalog is missing primary resource ${primaryId}.`);
  }

  return primary;
}

export function destinationFromResource(resourceItem: LichessResource): Destination {
  return {
    source: 'lichess',
    label: resourceItem.label,
    ...(resourceItem.url === undefined ? {} : { url: resourceItem.url }),
  };
}

function practiceStudy(input: PracticeStudyInput): LichessResource {
  const slug = slugify(input.title);

  return resource({
    id: `practice:${input.sectionId}:${slug}`,
    kind: 'practice-study',
    title: input.title,
    label: `Lichess Practice: ${input.title}`,
    description: input.description,
    url: `https://lichess.org/practice/${input.sectionId}/${slug}/${input.studyId}`,
    source: 'lichess-practice-source',
    bands: input.bands ?? allBands,
    recommendedFor: input.recommendedFor ?? [],
    priority: input.priority ?? 30,
  });
}

function puzzleTheme(input: PuzzleThemeInput): LichessResource {
  return resource({
    id: `puzzle:${input.slug}`,
    kind: 'puzzle-theme',
    title: input.title,
    label: `Puzzles Lichess: ${input.title}`,
    description: `Tema oficial de puzzle Lichess (${input.group}).`,
    url: `https://lichess.org/training/${input.slug}`,
    source: 'lichess-puzzle-theme-xml',
    bands: input.bands ?? allBands,
    recommendedFor: input.recommendedFor ?? [],
    priority: input.priority ?? 30,
  });
}

function videoFilter(input: {
  id: string;
  title: string;
  label: string;
  tags: readonly string[];
  recommendedFor: readonly WeaknessTag[];
  priority: number;
}): LichessResource {
  return resource({
    id: input.id,
    kind: 'video-filter',
    title: input.title,
    label: input.label,
    description: `Biblioteca de videos filtrada por ${input.tags.join(' + ')}.`,
    url: `https://lichess.org/video?tags=${input.tags.map(encodeURIComponent).join('%2F')}`,
    source: 'lichess-video-library',
    recommendedFor: input.recommendedFor,
    priority: input.priority,
  });
}

function resource(input: {
  id: string;
  kind: LichessResourceKind;
  title: string;
  label: string;
  description: string;
  url?: string;
  source: LichessCatalogSource;
  bands?: readonly LearnerBand[];
  recommendedFor?: readonly WeaknessTag[];
  priority?: number;
}): LichessResource {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    label: input.label,
    description: input.description,
    ...(input.url === undefined ? {} : { url: input.url }),
    source: input.source,
    bands: input.bands ?? allBands,
    recommendedFor: input.recommendedFor ?? [],
    priority: input.priority ?? 30,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
