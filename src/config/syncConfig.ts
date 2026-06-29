// Liga o painel de sync. Só ativar depois de: backend no ar + política reescrita.
export const SYNC_UI_ENABLED: boolean = false;

// Worker de sync publicado (Cloudflare). Inerte enquanto SYNC_UI_ENABLED = false.
export const SYNC_BACKEND_URL: string | undefined = 'https://rotina-sync.chesshabit.workers.dev';
