import type { Destination, LearnerBand, LichessOAuthScope, WeaknessTag } from '../types';

export type LichessResourceKind =
  | 'analysis-tool'
  | 'community-study'
  | 'learn-basics'
  | 'practice-study'
  | 'puzzle-mode'
  | 'puzzle-replay'
  | 'puzzle-theme'
  | 'video-lesson';

export type LichessCatalogSource =
  | 'lichess-api-puzzles'
  | 'lichess-learn'
  | 'lichess-community-study'
  | 'lichess-curation-report'
  | 'lichess-practice-source'
  | 'lichess-puzzle-theme-xml'
  | 'lichess-training-page'
  | 'lichess-video-library';

export type CuratedValue = 'A' | 'B' | 'C' | 'D';
export type QualityStatus = 'approved' | 'needs-human-review' | 'rejected';
export type RightsRisk = 'low' | 'medium' | 'high';
export type ResourceLanguage = 'pt-BR' | 'en' | 'other';
export type LinkCheckStatus = 'ok' | 'unchecked' | 'broken';

export type LichessResource = {
  id: string;
  kind: LichessResourceKind;
  title: string;
  label: string;
  description: string;
  url?: string;
  source: LichessCatalogSource;
  author?: string;
  bands: readonly LearnerBand[];
  recommendedFor: readonly WeaknessTag[];
  priority: number;
  value: CuratedValue;
  qualityStatus: QualityStatus;
  rightsRisk: RightsRisk;
  language: ResourceLanguage;
  requiresOAuth: boolean;
  oauthScopes: readonly LichessOAuthScope[];
  lastVerifiedAt: string;
  lastLinkCheckStatus: LinkCheckStatus;
  replacementResourceId?: string;
  reviewCadenceDays: number;
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

type ResourceInput = {
  id: string;
  kind: LichessResourceKind;
  title: string;
  label: string;
  description: string;
  url?: string;
  source: LichessCatalogSource;
  author?: string;
  bands?: readonly LearnerBand[];
  recommendedFor?: readonly WeaknessTag[];
  priority?: number;
  value?: CuratedValue;
  qualityStatus?: QualityStatus;
  rightsRisk?: RightsRisk;
  language?: ResourceLanguage;
  requiresOAuth?: boolean;
  oauthScopes?: readonly LichessOAuthScope[];
  lastVerifiedAt?: string;
  lastLinkCheckStatus?: LinkCheckStatus;
  replacementResourceId?: string;
  reviewCadenceDays?: number;
};

const defaultVerifiedAt = '2026-06-08';
const allBands = ['0-800', '800-1200'] as const;
const beginnerBands = ['0-800'] as const;
const improvingBands = ['800-1200'] as const;

export const lichessPracticeStudies = [
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'BJy6fEDf',
    title: 'Piece Checkmates I',
    description: 'Lição guiada para mates básicos com peças.',
    recommendedFor: ['mate-in-1', 'mate-in-2'],
    bands: beginnerBands,
    priority: 92,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'fE4k21MW',
    title: 'Checkmate Patterns I',
    description: 'Primeiro bloco guiado de padrões de mate.',
    recommendedFor: ['mate-in-1', 'mate-in-2', 'back-rank'],
    bands: beginnerBands,
    priority: 91,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: '8yadFPpU',
    title: 'Checkmate Patterns II',
    description: 'Segundo bloco guiado de padrões de mate.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    priority: 86,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'PDkQDt6u',
    title: 'Checkmate Patterns III',
    description: 'Padrões de mate para consolidar reconhecimento.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    priority: 82,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: '96Lij7wH',
    title: 'Checkmate Patterns IV',
    description: 'Padrões de mate mais variados.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    bands: improvingBands,
    priority: 78,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'Rg2cMBZ6',
    title: 'Piece Checkmates II',
    description: 'Mates de peças com exigência maior.',
    recommendedFor: ['mate-in-2'],
    bands: improvingBands,
    priority: 76,
  }),
  practiceStudy({
    sectionId: 'checkmates',
    studyId: 'ByhlXnmM',
    title: 'Knight & Bishop Mate',
    description: 'Lição interativa de mate com bispo e cavalo.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 44,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: '9ogFv8Ac',
    title: 'The Pin',
    description: 'Lição guiada de cravada antes de repetir puzzles.',
    recommendedFor: ['pin'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'tuoBxVE5',
    title: 'The Skewer',
    description: 'Lição guiada de espeto antes de repetir puzzles.',
    recommendedFor: ['skewer'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'Qj281y1p',
    title: 'The Fork',
    description: 'Lição guiada de garfo antes de repetir puzzles.',
    recommendedFor: ['fork'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'MnsJEWnI',
    title: 'Discovered Attacks',
    description: 'Lição guiada para ataques descobertos e checks descobertos.',
    recommendedFor: ['discovered'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'RUQASaZm',
    title: 'Double Check',
    description: 'Lição guiada para checks duplos.',
    recommendedFor: ['discovered', 'mate-in-2'],
    priority: 82,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'o734CNqp',
    title: 'Overloaded Pieces',
    description: 'Lição guiada de peça sobrecarregada.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 58,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'ITWY4GN2',
    title: 'Zwischenzug',
    description: 'Lição guiada de lance intermediário.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 54,
  }),
  practiceStudy({
    sectionId: 'fundamental-tactics',
    studyId: 'lyVYjhPG',
    title: 'X-Ray',
    description: 'Lição guiada para ataques através de linhas.',
    recommendedFor: ['discovered', 'pin', 'skewer'],
    bands: improvingBands,
    priority: 62,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '9cKgYrHb',
    title: 'Zugzwang',
    description: 'Lição guiada de zugzwang.',
    recommendedFor: ['conversion', 'endgame-pawn'],
    bands: improvingBands,
    priority: 54,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'g1fxVZu9',
    title: 'Interference',
    description: 'Lição guiada de interferência.',
    recommendedFor: ['discovered', 'conversion'],
    bands: improvingBands,
    priority: 50,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 's5pLU7Of',
    title: 'Greek Gift',
    description: 'Estudo guiado do sacrifício Greek Gift.',
    recommendedFor: ['mate-in-2', 'back-rank'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'kdKpaYLW',
    title: 'Deflection',
    description: 'Lição guiada de desvio de defensor.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 52,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'jOZejFWk',
    title: 'Attraction',
    description: 'Lição guiada de atração.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 52,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '49fDW0wP',
    title: 'Underpromotion',
    description: 'Lição guiada de subpromoção.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    bands: improvingBands,
    priority: 50,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: '0YcGiH4Y',
    title: 'Desperado',
    description: 'Lição guiada de peça perdida que ainda cria recurso.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 42,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'CgjKPvxQ',
    title: 'Counter Check',
    description: 'Lição guiada para responder check com check.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 42,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'udx042D6',
    title: 'Undermining',
    description: 'Lição guiada de remover sustentação.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'advanced-tactics',
    studyId: 'Grmtwuft',
    title: 'Clearance',
    description: 'Lição guiada de liberar casa, coluna ou diagonal.',
    recommendedFor: ['conversion'],
    bands: improvingBands,
    priority: 48,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'xebrDvFe',
    title: 'Key Squares',
    description: 'Lição guiada de casas-chave em finais de peões.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'A4ujYOer',
    title: 'Opposition',
    description: 'Lição guiada de oposição.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 92,
  }),
  practiceStudy({
    sectionId: 'pawn-endgames',
    studyId: 'pt20yRkT',
    title: '7th-Rank Rook Pawn',
    description: 'Lição guiada de peão de torre na sétima contra dama.',
    recommendedFor: ['endgame-pawn', 'conversion'],
    bands: improvingBands,
    priority: 72,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'MkDViieT',
    title: '7th-Rank Rook Pawn',
    description: 'Lição guiada de torre passiva contra peão de torre na sétima.',
    recommendedFor: ['endgame-rook', 'conversion'],
    bands: improvingBands,
    priority: 86,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'pqUSUw8Y',
    title: 'Basic Rook Endgames',
    description: 'Lição guiada de Lucena e Philidor.',
    recommendedFor: ['endgame-rook', 'conversion'],
    priority: 96,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'heQDnvq7',
    title: 'Intermediate Rook Endings',
    description: 'Finais de torre para ampliar repertório prático.',
    recommendedFor: ['endgame-rook', 'conversion'],
    bands: improvingBands,
    priority: 78,
  }),
  practiceStudy({
    sectionId: 'rook-endgames',
    studyId: 'wS23j5Tm',
    title: 'Practical Rook Endings',
    description: 'Finais de torre práticos com vários peões.',
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
  puzzleTheme({ slug: 'capturingDefender', title: 'Capture the defender', group: 'motifs', recommendedFor: ['conversion'], priority: 74 }),
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
  puzzleTheme({ slug: 'defensiveMove', title: 'Defensive move', group: 'advanced', recommendedFor: ['blunder-rate', 'conversion'], priority: 72 }),
  puzzleTheme({ slug: 'deflection', title: 'Deflection', group: 'advanced', recommendedFor: ['conversion'], priority: 70 }),
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
  puzzleTheme({ slug: 'equality', title: 'Equality', group: 'goals', recommendedFor: ['conversion'], priority: 66 }),
  puzzleTheme({ slug: 'advantage', title: 'Advantage', group: 'goals', recommendedFor: ['conversion'], priority: 88 }),
  puzzleTheme({ slug: 'crushing', title: 'Crushing', group: 'goals', recommendedFor: ['conversion'], priority: 84 }),
  puzzleTheme({ slug: 'oneMove', title: 'One-move puzzle', group: 'lengths', recommendedFor: ['mate-in-1'] }),
  puzzleTheme({ slug: 'short', title: 'Short puzzle', group: 'lengths', recommendedFor: ['fork', 'hanging-piece', 'pin', 'skewer'] }),
  puzzleTheme({ slug: 'long', title: 'Long puzzle', group: 'lengths', recommendedFor: ['mate-in-2', 'conversion'] }),
  puzzleTheme({ slug: 'veryLong', title: 'Very long puzzle', group: 'lengths' }),
  puzzleTheme({ slug: 'master', title: 'Master games', group: 'origin' }),
  puzzleTheme({ slug: 'masterVsMaster', title: 'Master vs Master games', group: 'origin' }),
  puzzleTheme({ slug: 'superGM', title: 'Super GM games', group: 'origin' }),
] as const satisfies readonly LichessResource[];

export const lichessVideoLessons = [
  resource({
    id: 'video:opening-principles-central-control',
    kind: 'video-lesson',
    title: 'Must-Know Opening Principles - Central Control',
    label: 'Lichess Video (em ingles): abertura - centro, desenvolvimento e rei seguro',
    description: 'Aula direta de principios de abertura: centro, desenvolvimento e seguranca do rei.',
    url: 'https://lichess.org/video/gpsZAim-mYc',
    source: 'lichess-video-library',
    recommendedFor: ['opening-principles'],
    priority: 100,
    value: 'A',
  }),
  resource({
    id: 'video:hanging-pieces',
    kind: 'video-lesson',
    title: 'Hanging Pieces',
    label: 'Lichess Video (em ingles): pecas penduradas',
    description: 'Aula direta para reconhecer pecas sem defesa antes de escolher lance candidato.',
    url: 'https://lichess.org/video/wod7uXzkrTc',
    source: 'lichess-video-library',
    recommendedFor: ['hanging-piece', 'blunder-rate'],
    priority: 88,
    value: 'A',
  }),
  resource({
    id: 'video:fork',
    kind: 'video-lesson',
    title: 'Fork',
    label: 'Lichess Video (em ingles): garfos',
    description: 'Aula direta para revisar o padrao de dois alvos antes de voltar aos puzzles.',
    url: 'https://lichess.org/video/mbiR0tcdqBY',
    source: 'lichess-video-library',
    recommendedFor: ['fork'],
    priority: 88,
    value: 'A',
  }),
  resource({
    id: 'video:pin',
    kind: 'video-lesson',
    title: 'Pin',
    label: 'Lichess Video (em ingles): cravadas',
    description: 'Aula direta para reconhecer alinhamento, peca presa e alvo atras dela.',
    url: 'https://lichess.org/video/VjwSudAqLn8',
    source: 'lichess-video-library',
    recommendedFor: ['pin'],
    priority: 88,
    value: 'A',
  }),
  resource({
    id: 'video:skewer',
    kind: 'video-lesson',
    title: 'Skewer',
    label: 'Lichess Video (em ingles): espetos',
    description: 'Aula direta para revisar ataques em linha contra alvo de maior valor.',
    url: 'https://lichess.org/video/ZexQ1kow1MM',
    source: 'lichess-video-library',
    recommendedFor: ['skewer'],
    priority: 88,
    value: 'A',
  }),
  resource({
    id: 'video:discovered-attack',
    kind: 'video-lesson',
    title: 'Discovered Attack',
    label: 'Lichess Video (em ingles): ataque descoberto',
    description: 'Aula direta para enxergar a linha que abre quando uma peca se move.',
    url: 'https://lichess.org/video/nMADfn1scbI',
    source: 'lichess-video-library',
    recommendedFor: ['discovered'],
    priority: 88,
    value: 'A',
  }),
  resource({
    id: 'video:back-rank',
    kind: 'video-lesson',
    title: 'Back Rank',
    label: 'Lichess Video (em ingles): mate na ultima fileira',
    description: 'Aula direta para revisar o rei preso e a pressao na ultima fileira.',
    url: 'https://lichess.org/video/spMQR31h0-0',
    source: 'lichess-video-library',
    recommendedFor: ['back-rank', 'mate-in-2'],
    priority: 84,
    value: 'B',
  }),
  resource({
    id: 'video:mating-patterns',
    kind: 'video-lesson',
    title: 'Mating Patterns',
    label: 'Lichess Video (em ingles): padroes de mate',
    description: 'Aula direta para revisar padroes de mate antes de treinar mate curto.',
    url: 'https://lichess.org/video/uhQhasudq9M',
    source: 'lichess-video-library',
    recommendedFor: ['mate-in-1', 'mate-in-2', 'back-rank'],
    priority: 86,
    value: 'A',
  }),
  resource({
    id: 'video:pawn-endgames',
    kind: 'video-lesson',
    title: 'Pawn Endgames',
    label: 'Lichess Video (em ingles): finais de peoes',
    description: 'Aula direta para revisar planos de finais de peoes antes de Practice ou puzzles.',
    url: 'https://lichess.org/video/QUqq7wSLE78',
    source: 'lichess-video-library',
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 84,
    value: 'B',
  }),
  resource({
    id: 'video:calculation',
    kind: 'video-lesson',
    title: 'Calculation',
    label: 'Lichess Video (em ingles): calculo',
    description: 'Aula direta para organizar calculo e reduzir decisoes por impulso.',
    url: 'https://lichess.org/video/-OoPm17P8xA',
    source: 'lichess-video-library',
    recommendedFor: ['conversion', 'blunder-rate'],
    priority: 80,
    value: 'B',
  }),
  resource({
    id: 'video:avoid-blunders',
    kind: 'video-lesson',
    title: 'Avoid Blunders',
    label: 'Lichess Video (em ingles): evitar blunders',
    description: 'Aula direta para reforcar checagem curta antes de lances criticos.',
    url: 'https://lichess.org/video/AYy2A6HIcU0',
    source: 'lichess-video-library',
    recommendedFor: ['blunder-rate', 'hanging-piece'],
    priority: 82,
    value: 'B',
  }),
  resource({
    id: 'video:convert-material-advantage',
    kind: 'video-lesson',
    title: 'Convert Material Advantage',
    label: 'Lichess Video (em ingles): converter vantagem material',
    description: 'Aula direta para transformar vantagem em plano pratico sem depender de engine.',
    url: 'https://lichess.org/video/0-ouahZH8X4',
    source: 'lichess-video-library',
    recommendedFor: ['conversion'],
    priority: 86,
    value: 'A',
  }),
] as const satisfies readonly LichessResource[];

export const lichessCommunityStudies = [
  resource({
    id: 'study:noseknowsall:beginner-endgames-you-must-know',
    kind: 'community-study',
    title: 'Beginner Endgames You Must Know!',
    label: 'Lichess Study: finais essenciais para iniciante',
    description: 'Estudo comunitario progressivo para reforcar finais basicos depois dos recursos oficiais.',
    url: 'https://lichess.org/study/wukLYIXj',
    source: 'lichess-community-study',
    author: 'NoseKnowsAll',
    recommendedFor: ['endgame-pawn', 'conversion', 'mate-in-1'],
    priority: 56,
    value: 'A',
    qualityStatus: 'approved',
    rightsRisk: 'low',
  }),
  resource({
    id: 'study:noseknowsall:intermediate-endgames-you-must-know',
    kind: 'community-study',
    title: 'Intermediate Endgames You Must Know!',
    label: 'Lichess Study: finais intermediarios essenciais',
    description: 'Estudo comunitario para aprofundar finais depois de Practice e puzzle themes.',
    url: 'https://lichess.org/study/UsqmCsgC',
    source: 'lichess-community-study',
    author: 'NoseKnowsAll',
    bands: improvingBands,
    recommendedFor: ['endgame-pawn', 'conversion'],
    priority: 54,
    value: 'A',
    qualityStatus: 'approved',
    rightsRisk: 'low',
  }),
  resource({
    id: 'study:noseknowsall:rook-endgames-you-must-know',
    kind: 'community-study',
    title: 'Rook Endgames You Must Know!',
    label: 'Lichess Study: finais de torre essenciais',
    description: 'Estudo comunitario de reforco para finais de torre depois do Practice oficial.',
    url: 'https://lichess.org/study/bnboDhFM',
    source: 'lichess-community-study',
    author: 'NoseKnowsAll',
    bands: improvingBands,
    recommendedFor: ['endgame-rook', 'conversion'],
    priority: 56,
    value: 'B',
    qualityStatus: 'approved',
    rightsRisk: 'low',
  }),
  resource({
    id: 'study:jomega:beginner-tactics',
    kind: 'community-study',
    title: 'Beginner: Tactics',
    label: 'Lichess Study: tatica iniciante jomega',
    description: 'Estudo comunitario de reforco para taticas basicas; manter abaixo de Practice e puzzles.',
    url: 'https://lichess.org/study/Iof6LzcT',
    source: 'lichess-community-study',
    author: 'jomega',
    recommendedFor: ['fork', 'pin', 'skewer', 'discovered', 'hanging-piece', 'mate-in-1', 'mate-in-2'],
    priority: 40,
    value: 'B',
    qualityStatus: 'needs-human-review',
    rightsRisk: 'medium',
  }),
  resource({
    id: 'study:jomega:simple-tactics-i',
    kind: 'community-study',
    title: 'Beginner: Simple Tactics I',
    label: 'Lichess Study: taticas simples I jomega',
    description: 'Estudo comunitario de reforco para repetir taticas basicas fora do formato de puzzle.',
    url: 'https://lichess.org/study/s3iOCawc',
    source: 'lichess-community-study',
    author: 'jomega',
    recommendedFor: ['fork', 'pin', 'skewer', 'discovered', 'hanging-piece'],
    priority: 38,
    value: 'B',
    qualityStatus: 'needs-human-review',
    rightsRisk: 'medium',
  }),
  resource({
    id: 'study:jomega:simple-tactics-ii',
    kind: 'community-study',
    title: 'Beginner: Simple Tactics II',
    label: 'Lichess Study: taticas simples II jomega',
    description: 'Estudo comunitario de reforco para consolidar padroes taticos basicos.',
    url: 'https://lichess.org/study/6JAUFQ5p',
    source: 'lichess-community-study',
    author: 'jomega',
    recommendedFor: ['fork', 'pin', 'skewer', 'discovered', 'hanging-piece'],
    priority: 37,
    value: 'B',
    qualityStatus: 'needs-human-review',
    rightsRisk: 'medium',
  }),
  resource({
    id: 'study:jomega:tactics-internalized',
    kind: 'community-study',
    title: 'Intermediate: Tactics Internalized',
    label: 'Lichess Study: taticas internalizadas jomega',
    description: 'Estudo comunitario de reforco para taticas mais longas e transferencia de padroes.',
    url: 'https://lichess.org/study/wzFrgluQ',
    source: 'lichess-community-study',
    author: 'jomega',
    bands: improvingBands,
    recommendedFor: ['fork', 'pin', 'skewer', 'discovered', 'conversion', 'blunder-rate'],
    priority: 36,
    value: 'B',
    qualityStatus: 'needs-human-review',
    rightsRisk: 'medium',
  }),
] as const satisfies readonly LichessResource[];

export const rejectedLichessResources = [
  resource({
    id: 'rejected:study:practical-endings-pawns-part-1',
    kind: 'community-study',
    title: 'Practical Endings: Pawns PART 1',
    label: 'Rejeitado: estudo comunitario de finais de peoes',
    description: 'Rejeitado por risco de adaptacao de livro protegido; nunca entra no catalogo ativo.',
    url: 'https://lichess.org/study/dXKWlrkg',
    source: 'lichess-community-study',
    author: 'Blue_Knight5',
    recommendedFor: ['endgame-pawn'],
    priority: 0,
    value: 'D',
    qualityStatus: 'rejected',
    rightsRisk: 'high',
    replacementResourceId: 'practice:pawn-endgames:key-squares',
  }),
  resource({
    id: 'rejected:study:pawn-endgames',
    kind: 'community-study',
    title: 'Pawn Endgames!',
    label: 'Rejeitado: estudo comunitario de finais de peoes',
    description: 'Rejeitado por baixa qualidade pedagogica e tom desalinhado; nunca entra no catalogo ativo.',
    url: 'https://lichess.org/study/izZ71JC2',
    source: 'lichess-community-study',
    author: 'community',
    recommendedFor: ['endgame-pawn'],
    priority: 0,
    value: 'D',
    qualityStatus: 'rejected',
    rightsRisk: 'medium',
    replacementResourceId: 'practice:pawn-endgames:key-squares',
  }),
  resource({
    id: 'rejected:study:mate-in-2-can-you-see-it',
    kind: 'community-study',
    title: 'Mate in 2 CAN YOU SEE IT?',
    label: 'Rejeitado: estudo comunitario de mate em 2',
    description: 'Candidato fraco para catalogo ativo; manter fora ate revisao humana especifica.',
    url: 'https://lichess.org/study/APSzIEsV',
    source: 'lichess-community-study',
    author: 'community',
    recommendedFor: ['mate-in-2'],
    priority: 0,
    value: 'C',
    qualityStatus: 'rejected',
    rightsRisk: 'medium',
    replacementResourceId: 'practice:checkmates:checkmate-patterns-i',
  }),
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
    description: 'Índice oficial de temas de puzzle.',
    url: 'https://lichess.org/training/themes',
    source: 'lichess-training-page',
    priority: 25,
  }),
  resource({
    id: 'puzzle-mode:streak',
    kind: 'puzzle-mode',
    title: 'Puzzle Streak',
    label: 'Lichess Puzzle Streak: sequência sem pressa',
    description: 'Modo de sequência para calibrar precisão antes de velocidade.',
    url: 'https://lichess.org/streak',
    source: 'lichess-training-page',
    recommendedFor: ['blunder-rate', 'time-trouble'],
    priority: 58,
  }),
  resource({
    id: 'puzzle-mode:storm',
    kind: 'puzzle-mode',
    title: 'Puzzle Storm',
    label: 'Lichess Puzzle Storm: ritmo tático curto',
    description: 'Modo cronometrado para treinar reconhecimento sob pressão.',
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
  resource({
    id: 'analysis:finished-game-review',
    kind: 'analysis-tool',
    title: 'Analysis board',
    label: 'Lichess Analysis: revisar partida terminada',
    description: 'Prancheta de análise para revisar apenas partidas terminadas.',
    url: 'https://lichess.org/analysis',
    source: 'lichess-training-page',
    recommendedFor: ['conversion', 'time-trouble'],
    priority: 46,
  }),
] as const satisfies readonly LichessResource[];

export const lichessResourceCatalog = [
  ...lichessPracticeStudies,
  ...lichessPuzzleThemes,
  ...lichessVideoLessons,
  ...lichessCommunityStudies,
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
  'opening-principles': 'video:opening-principles-central-control',
  'time-trouble': 'puzzle-mode:streak',
  'endgame-pawn': 'practice:pawn-endgames:key-squares',
  'endgame-rook': 'practice:rook-endgames:basic-rook-endgames',
  conversion: 'puzzle:advantage',
  'blunder-rate': 'puzzle:hangingPiece',
} satisfies Record<WeaknessTag, LichessResource['id']>;

export function getLichessResourcesForWeakness(tag: WeaknessTag): LichessResource[] {
  return lichessResourceCatalog
    .filter((resourceItem) => resourceItem.qualityStatus !== 'rejected' && resourceItem.recommendedFor.includes(tag))
    .sort(compareLichessResources);
}

export function getPrimaryLichessResourceForWeakness(tag: WeaknessTag): LichessResource {
  const primaryId = primaryResourceIdByWeakness[tag];
  const primary = lichessResourceCatalog.find((resourceItem) => resourceItem.id === primaryId);

  if (primary === undefined) {
    throw new Error(`Lichess resource catalog is missing primary resource ${primaryId}.`);
  }

  return primary;
}

export function findLichessResourceById(resourceId: string): LichessResource | undefined {
  return lichessResourceCatalog.find((resourceItem) => resourceItem.id === resourceId);
}

export function findLichessResourceByUrl(url: string): LichessResource | undefined {
  return lichessResourceCatalog.find((resourceItem) => resourceItem.url === url);
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

function resource(input: ResourceInput): LichessResource {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    label: input.label,
    description: input.description,
    ...(input.url === undefined ? {} : { url: input.url }),
    source: input.source,
    ...(input.author === undefined ? {} : { author: input.author }),
    bands: input.bands ?? allBands,
    recommendedFor: input.recommendedFor ?? [],
    priority: input.priority ?? 30,
    value: input.value ?? 'B',
    qualityStatus: input.qualityStatus ?? getDefaultQualityStatus(input.source),
    rightsRisk: input.rightsRisk ?? getDefaultRightsRisk(input.source),
    language: input.language ?? 'en',
    requiresOAuth: input.requiresOAuth ?? false,
    oauthScopes: input.oauthScopes ?? [],
    lastVerifiedAt: input.lastVerifiedAt ?? defaultVerifiedAt,
    lastLinkCheckStatus: input.lastLinkCheckStatus ?? 'ok',
    ...(input.replacementResourceId === undefined ? {} : { replacementResourceId: input.replacementResourceId }),
    reviewCadenceDays: input.reviewCadenceDays ?? getDefaultReviewCadenceDays(input.source),
  };
}

function compareLichessResources(left: LichessResource, right: LichessResource): number {
  return (
    right.priority - left.priority ||
    getQualityRank(right.qualityStatus) - getQualityRank(left.qualityStatus) ||
    getKindRank(left.kind) - getKindRank(right.kind) ||
    left.title.localeCompare(right.title)
  );
}

function getDefaultQualityStatus(source: LichessCatalogSource): QualityStatus {
  return source === 'lichess-community-study' ? 'needs-human-review' : 'approved';
}

function getDefaultRightsRisk(source: LichessCatalogSource): RightsRisk {
  return source === 'lichess-community-study' ? 'medium' : 'low';
}

function getDefaultReviewCadenceDays(source: LichessCatalogSource): number {
  return source === 'lichess-community-study' ? 90 : 180;
}

function getQualityRank(status: QualityStatus): number {
  switch (status) {
    case 'approved':
      return 2;
    case 'needs-human-review':
      return 1;
    case 'rejected':
      return 0;
  }
}

function getKindRank(kind: LichessResourceKind): number {
  switch (kind) {
    case 'practice-study':
      return 1;
    case 'puzzle-theme':
      return 2;
    case 'puzzle-mode':
      return 3;
    case 'puzzle-replay':
      return 4;
    case 'video-lesson':
      return 5;
    case 'community-study':
      return 6;
    case 'learn-basics':
      return 7;
    case 'analysis-tool':
      return 8;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
