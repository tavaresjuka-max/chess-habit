# Interfaces

## Dominio

```ts
type TrainingSignal = {
  id: string;
  source: 'lichess' | 'chesscom' | 'manual' | 'outro';
  kind: string;
  value: unknown;
  observedAt: string;
  updatedAt: string;
};
```

```ts
type Weakness = {
  id: string;
  tag: string;
  score: number;
  confidence: number;
  evidence: string[];
  updatedAt: string;
  deletedAt?: string;
};
```

```ts
type PlanBlock = {
  id: string;
  kind: 'warmup' | 'explain' | 'guided' | 'retrieval' | 'review' | 'transfer';
  title: string;
  destinationUrl: string;
  minutes: number;
  status: 'pending' | 'done' | 'skipped';
  feedback?: 'easy' | 'good' | 'hard';
  updatedAt: string;
};
```

## Sync

```ts
type SyncMutation = {
  collection: string;
  clientMutationId: string;
  updatedAt: number;
  value: unknown;
};
```

O campo legado `ciphertext` no backend guarda JSON legivel no modelo vigente de conta-normal.

## APIs Do App

- `GET /health`: healthcheck publico do Worker.
- `POST /blobs`: recebe mutacao local.
- `GET /blobs?collection=<nome>`: envia mutacoes remotas por colecao.
- `GET /snapshot`: envia snapshot de todas as colecoes sincronizaveis.
- `DELETE /blobs`: remove todos os dados sincronizados do usuario autenticado.

Auth: `Authorization: Bearer <token Lichess>` validado no Worker contra `https://lichess.org/api/account`; sem sessao propria do app. Token OAuth nao e armazenado como dado de sync.

## Politica De Tokens

Tokens OAuth ficam apenas no aparelho, fora de backup/export/logs/bundle e fora dos blobs de sync. Qualquer mudanca nessa politica exige decisao propria e revisao de seguranca.
