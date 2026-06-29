// Nome publico do app (decidido pelo dono em 2026-06-19).
export const APP_NAME = 'Chess Habit' as const;

export const APP_DESCRIPTION =
  'Ferramenta local-first para organizar treino de xadrez no Lichess, sem tabuleiro próprio.';

export const APP_MANIFEST_NAME = APP_NAME;

export const APP_LEGAL_DISCLAIMER =
  `${APP_NAME} é um app não oficial, não afiliado, endossado ou mantido pelo Lichess.`;

export const SOURCE_CODE_URL: string | undefined = 'https://github.com/tavaresjuka-max/chess-habit';

// Doacao fica externa e opcional; apoiador nao recebe vantagem funcional.
export const DONATION_URL: string | undefined = undefined;

// Resumo de privacidade exibido na UI (transparencia local-first). Texto curto e honesto.
export const PRIVACY_SUMMARY = [
  'Por padrão, seus dados ficam só neste aparelho. Se você ligar a Sincronização (opcional), seu progresso é enviado ao nosso servidor para sincronizar entre seus aparelhos — podemos lê-lo, usamos só para operar o app, e você pode desligar, exportar ou apagar quando quiser.',
  'Tokens de login (Lichess) ficam apenas no aparelho e nunca entram no backup exportado.',
  'Buscamos seus jogos públicos no Lichess e no Chess.com só para montar seu diagnóstico; não guardamos PGN completo.',
  'Você pode exportar um backup e apagar tudo a qualquer momento na tela de Configuração.',
] as const;

export const FEEDBACK_URL: string | undefined = 'https://github.com/tavaresjuka-max/chess-habit/issues';
