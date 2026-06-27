import type { D1Database, D1PreparedStatement, D1Result } from './types';

interface FakeRow {
  userId: string;
  collection: string;
  clientMutationId: string;
  ciphertext: string;
  updatedAt: number;
}

const keyOf = (userId: string, collection: string, clientMutationId: string) =>
  `${userId}\u0000${collection}\u0000${clientMutationId}`;

function normalize(sql: string): string {
  return sql.toLowerCase().replace(/\s+/g, ' ').trim();
}

interface Sequence {
  n: number;
}

function stringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberParam(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

class FakeStatement implements D1PreparedStatement {
  private params: unknown[] = [];

  constructor(
    private readonly store: Map<string, FakeRow>,
    private readonly seq: Sequence,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.params = values;
    return this;
  }

  private execute<T = Record<string, unknown>>(): D1Result<T> {
    const sql = normalize(this.sql);
    const p = this.params;

    if (sql === 'select 1 as ok') {
      return { success: true, results: [{ ok: 1 } as unknown as T], meta: { changes: 0 } };
    }

    if (sql.startsWith('insert into blobs')) {
      const userId = stringParam(p[0]);
      const collection = stringParam(p[1]);
      const clientMutationId = stringParam(p[2]);
      const ciphertext = stringParam(p[3]);
      const updatedAt = numberParam(p[4]);
      const key = keyOf(userId, collection, clientMutationId);
      const existing = this.store.get(key);
      const guarded = sql.includes('where excluded.updatedat > blobs.updatedat');
      if (existing !== undefined && guarded && !(updatedAt > existing.updatedAt)) {
        return { success: true, results: [], meta: { changes: 0 } };
      }
      this.store.set(key, { userId, collection, clientMutationId, ciphertext, updatedAt });
      this.seq.n += 1;
      return { success: true, results: [], meta: { changes: 1, last_row_id: this.seq.n } };
    }

    if (sql.startsWith('select collection, clientmutationid, ciphertext, updatedat from blobs')) {
      const userId = stringParam(p[0]);
      const byCollection = sql.includes('and collection = ?');
      const collection = byCollection ? stringParam(p[1]) : null;
      const rows = [...this.store.values()]
        .filter(
          (r) => r.userId === userId && (collection === null || r.collection === collection),
        )
        .sort((a, b) => a.updatedAt - b.updatedAt)
        .map((r) => ({
          collection: r.collection,
          clientMutationId: r.clientMutationId,
          ciphertext: r.ciphertext,
          updatedAt: r.updatedAt,
        }));
      return { success: true, results: rows as unknown as T[], meta: { changes: 0 } };
    }

    return { success: false, results: [], meta: { changes: 0 }, error: `unhandled SQL: ${sql}` };
  }

  first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = this.execute<T>();
    const results = res.results ?? [];
    return Promise.resolve(results.length > 0 ? (results[0] ?? null) : null);
  }

  all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return Promise.resolve(this.execute<T>());
  }

  run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return Promise.resolve(this.execute<T>());
  }
}

export function createFakeD1(): D1Database {
  const store = new Map<string, FakeRow>();
  const seq: Sequence = { n: 0 };
  return {
    prepare: (sql: string) => new FakeStatement(store, seq, sql),
  };
}
