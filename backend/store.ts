import type { BlobRow, D1Database, StoredBlob } from './types';

const PING_SQL = 'SELECT 1 AS ok';

const UPSERT_SQL = `
  INSERT INTO blobs (userId, collection, clientMutationId, ciphertext, updatedAt)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(userId, collection, clientMutationId) DO UPDATE SET
    ciphertext = excluded.ciphertext,
    updatedAt  = excluded.updatedAt
  WHERE excluded.updatedAt > blobs.updatedAt
`;

const LIST_BY_COLLECTION_SQL = `
  SELECT collection, clientMutationId, ciphertext, updatedAt
  FROM blobs
  WHERE userId = ? AND collection = ?
  ORDER BY updatedAt ASC
`;

const SNAPSHOT_SQL = `
  SELECT collection, clientMutationId, ciphertext, updatedAt
  FROM blobs
  WHERE userId = ?
  ORDER BY updatedAt ASC
`;

export async function ping(db: D1Database): Promise<boolean> {
  try {
    const row = await db.prepare(PING_SQL).first<{ ok: number }>();
    return row?.ok === 1;
  } catch {
    return false;
  }
}

export async function upsertBlob(db: D1Database, row: BlobRow): Promise<void> {
  await db
    .prepare(UPSERT_SQL)
    .bind(row.userId, row.collection, row.clientMutationId, row.ciphertext, row.updatedAt)
    .run();
}

export async function listBlobs(
  db: D1Database,
  userId: string,
  collection: string,
): Promise<StoredBlob[]> {
  const result = await db.prepare(LIST_BY_COLLECTION_SQL).bind(userId, collection).all<StoredBlob>();
  return result.results ?? [];
}

export async function snapshot(db: D1Database, userId: string): Promise<StoredBlob[]> {
  const result = await db.prepare(SNAPSHOT_SQL).bind(userId).all<StoredBlob>();
  return result.results ?? [];
}
