export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id?: number;
    duration?: number;
    rows_read?: number;
    rows_written?: number;
  };
  error?: string;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface SyncEnv {
  DB: D1Database;
  SYNC_AUTH_MODE?: string;
  /** Opt-in explícito para o modo 'local' (header x-sync-user, sem segredo). Só
   *  dev/testes definem 'true'; produção usa 'oauth' e NUNCA seta este flag. */
  SYNC_LOCAL_ALLOWED?: string;
  SYNC_MAX_BLOB_BYTES?: string;
  /** URL base da API do Lichess usada para validar tokens OAuth (injetável para testes). */
  LICHESS_VALIDATE_URL?: string;
}

export interface StoredBlob {
  collection: string;
  clientMutationId: string;
  /** Nome legado. Hoje carrega JSON em PLAINTEXT — o sync NÃO é E2EE por decisão
   *  de produto (dado de progresso, baixa sensibilidade; ver docs/privacy). */
  ciphertext: string;
  updatedAt: number;
}

export interface BlobRow extends StoredBlob {
  userId: string;
}

export interface PushBlobRequest {
  collection: string;
  clientMutationId: string;
  ciphertext: string;
  updatedAt: number;
}
