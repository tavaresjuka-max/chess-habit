// TODO(beta-publico): trocar APP_NAME pelo nome publico final aprovado pelo dono.
export const APP_NAME = 'Rotina' as const;

export const APP_DESCRIPTION =
  'Ferramenta local-first para organizar treino de xadrez no Lichess, sem tabuleiro próprio.';

export const APP_MANIFEST_NAME = APP_NAME;

export const APP_LEGAL_DISCLAIMER =
  `${APP_NAME} é um app não oficial, não afiliado, endossado ou mantido pelo Lichess.`;

// TODO(beta-publico): preencher quando o repositorio publico estiver definido.
export const SOURCE_CODE_URL: string | undefined = undefined;

// Doacao fica externa e opcional; apoiador nao recebe vantagem funcional.
export const DONATION_URL: string | undefined = undefined;

// Resumo de privacidade exibido na UI (transparencia local-first). Texto curto e honesto.
export const PRIVACY_SUMMARY = [
  'Seus dados ficam localmente só neste aparelho (IndexedDB). Não há servidor nosso recebendo seu histórico.',
  'Tokens de login (Lichess) ficam apenas no aparelho e nunca entram no backup exportado.',
  'Buscamos seus jogos públicos no Lichess e no Chess.com só para montar seu diagnóstico; não guardamos PGN completo.',
  'Você pode exportar um backup e apagar tudo a qualquer momento na tela de Configuração.',
] as const;

// TODO(beta-publico): preencher quando o dono definir o canal (e-mail, formulario ou issue tracker).
export const FEEDBACK_URL: string | undefined = undefined;
