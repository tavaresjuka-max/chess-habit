import type { PushBlobInput, StoredBlob, SyncClient } from './syncClient';

export interface PushBlobEngineInput {
  readonly client: SyncClient;
  readonly collection: string;
  readonly clientMutationId: string;
  readonly value: unknown;
  readonly updatedAt: number;
}

export interface PullBlobsInput {
  readonly client: SyncClient;
  readonly collection?: string;
}

export interface PulledItem {
  readonly collection: string;
  readonly clientMutationId: string;
  readonly updatedAt: number;
  readonly value: unknown;
}

export interface PullBlobsResult {
  readonly ok: true;
  readonly items: readonly PulledItem[];
}

export async function pushBlob(input: PushBlobEngineInput): Promise<void> {
  // ATENÇÃO: o campo "ciphertext" no WIRE (JSON enviado/recebido do backend) é
  // nome HISTÓRICO/legado — hoje o conteúdo é JSON PLAINTEXT, sem criptografia.
  // O sync NÃO é E2EE por decisão de produto (dado de progresso, baixa sensibilidade;
  // ver docs/privacy/privacy-and-data.md). Para E2EE real, cifrar aqui com
  // crypto.subtle (AES-GCM + chave derivada de segredo do usuário) antes de enviar.
  // O SÍMBOLO interno é `payload` (não "ciphertext") para não sugerir criptografia
  // que não existe; a CHAVE JSON do wire continua "ciphertext" — contrato com o
  // backend (backend/types.ts) intocado.
  const payload = JSON.stringify(input.value);
  const pushInput: PushBlobInput = {
    collection: input.collection,
    clientMutationId: input.clientMutationId,
    ciphertext: payload,
    updatedAt: input.updatedAt,
  };
  await input.client.pushBlob(pushInput);
}

export async function pullBlobs(input: PullBlobsInput): Promise<PullBlobsResult> {
  const stored: StoredBlob[] =
    input.collection === undefined
      ? await input.client.snapshot()
      : await input.client.listBlobs(input.collection);

  const items: PulledItem[] = [];
  for (const entry of stored) {
    let value: unknown;
    try {
      value = JSON.parse(entry.ciphertext);
    } catch {
      // Blob malformado (corrupção/escrita parcial/dado antigo): pula este item em
      // vez de derrubar o pull inteiro — um blob ruim não pode bricar o sync.
      continue;
    }
    items.push({
      collection: entry.collection,
      clientMutationId: entry.clientMutationId,
      updatedAt: entry.updatedAt,
      value,
    });
  }

  return { ok: true, items };
}
