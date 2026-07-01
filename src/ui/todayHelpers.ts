import type { DailyPlan, TrainingRoadmapItem } from '../domain';
import type { MethodTrackId } from '../domain/method/types';
import type { BackupMeta } from '../app/backupStatus';

// Extrai o tema do puzzle (ex.: 'fork') do destino /training/<tema> do bloco.
export function themeFromTrainingUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  return /\/training\/([^/?#]+)/.exec(url)?.[1];
}

export function formatFriendlyDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const formatted = parsed.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

export function getBackupReminder(
  meta: BackupMeta | undefined,
  today: string,
  hasData: boolean,
): string | undefined {
  if (meta === undefined) {
    // Sem dado a perder ainda (usuário no dia 1, antes de treinar): não cobra backup —
    // é ruído administrativo. O lembrete só aparece quando há progresso real.
    return hasData ? 'Backup local: ainda não há export JSON registrado para este aparelho.' : undefined;
  }

  const todayDate = new Date(`${today}T12:00:00.000Z`);
  const exportedAt = new Date(meta.exportedAt);

  if (Number.isNaN(todayDate.getTime()) || Number.isNaN(exportedAt.getTime())) {
    return 'Backup local: a data do último export não pôde ser lida.';
  }

  const daysSinceBackup = Math.floor((todayDate.getTime() - exportedAt.getTime()) / 86_400_000);

  if (daysSinceBackup < 7) {
    return undefined;
  }

  return `Backup local: último export há ${String(daysSinceBackup)} dias.`;
}

export function getActiveTrackId(plan: DailyPlan): MethodTrackId | undefined {
  return plan.blocks.find((block) => block.methodTrackId !== undefined)?.methodTrackId;
}

export function playTimerBeep(): void {
  // Respeita prefers-reduced-motion: evita o susto sonoro (TDAH); o timer visual
  // continua marcando o fim do tempo. (B4, council)
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.42);

    window.setTimeout(() => {
      void audioContext.close();
    }, 600);
  } catch {
    // Audio can be blocked by the browser; the visible timer message still carries the warning.
  }
}

export function formatRoadmapStatus(status: TrainingRoadmapItem['status']): string {
  switch (status) {
    case 'current':
      return 'Planejado';
    case 'done':
      return 'Feito';
    case 'future':
      return 'Próximo';
  }
}
