// Liga o painel de sync. Backend no ar (rotina-sync.chesshabit.workers.dev) + política reescrita 2026-06-29.
export const SYNC_UI_ENABLED: boolean = true;

// Worker de sync publicado (Cloudflare). Inerte enquanto SYNC_UI_ENABLED = false.
export const SYNC_BACKEND_URL: string | undefined = 'https://rotina-sync.chesshabit.workers.dev';
