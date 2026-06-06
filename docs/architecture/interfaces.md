# Interfaces Planejadas

Este documento descreve contratos futuros. Nao e implementacao.

## Tipos

```ts
type LearnerProfile = {
  userId: string;
  lichessUsername: string;
  chesscomUsername?: string;
  targetBand: "0-800" | "800-1200" | "1200-1600" | "1600-2000";
  weeklyMinutes: number;
  goals: string[];
  difficulties: string[];
  createdAt: string;
  updatedAt: string;
};
```

```ts
type AccountConnection = {
  platform: "lichess" | "chesscom";
  username: string;
  mode: "oauth" | "public-import";
  connectedAt: string;
  lastImportedAt?: string;
};
```

```ts
type TrainingSignal = {
  source: "lichess" | "chesscom" | "manual" | "tutor";
  kind: "rating" | "puzzle" | "game" | "streak" | "weakness" | "completion";
  value: unknown;
  confidence: "low" | "medium" | "high";
  observedAt: string;
};
```

```ts
type TrainingPlan = {
  id: string;
  userId: string;
  weekStart: string;
  focus: string[];
  missions: DailyMission[];
  generatedFromSignalsAt: string;
};
```

```ts
type DailyMission = {
  id: string;
  date: string;
  title: string;
  estimatedMinutes: number;
  lichessUrl: string;
  reason: string;
  status: "pending" | "done" | "skipped";
};
```

```ts
type MissionCompletion = {
  missionId: string;
  status: "done" | "skipped";
  note?: string;
  completedAt: string;
};
```

```ts
type CoachMessage = {
  id: string;
  tone: "welcome" | "correction" | "return" | "progress" | "warning";
  body: string;
  createdAt: string;
};
```

```ts
type SyncEvent = {
  id: string;
  userId: string;
  clientId: string;
  type: string;
  payload: unknown;
  createdAt: string;
  seq?: number;
};
```

## APIs Do App

- `GET /api/session`: retorna usuario atual ou `null`.
- `GET /api/auth/lichess/start`: inicia OAuth PKCE.
- `GET /api/auth/lichess/callback`: conclui login, cria sessao do app e descarta token se nao houver opt-in futuro.
- `POST /api/sync/push`: recebe eventos locais.
- `GET /api/sync/pull`: envia eventos remotos desde `seq`.
- `GET /api/export`: exporta dados do usuario.
- `POST /api/delete-account`: remove conta e dados sincronizados.

## Politica De Tokens

No MVP, nao armazenar token long-lived por padrao. Caso uma futura versao exija atualizacao em background, isso precisa de ADR propria, opt-in explicito e revisao de seguranca.

