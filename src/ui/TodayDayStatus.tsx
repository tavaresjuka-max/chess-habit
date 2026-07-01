import { type ComponentProps } from 'react';
import type { DailyPlan } from '../domain';
import { buildRoutingWhy } from '../domain/method/errorRouting';
import { buildSupportBaseLine } from '../domain/coach/retentionCopy';
import { ORGANIZER_CEILING_MESSAGE } from '../domain/curriculum/curriculum';
import { AccumulationStrip } from './AccumulationStrip';
import { DayProgressFill } from './TodayParts';

type TodayDayStatusProps = {
  doneBlockCount: number;
  totalBlocks: number;
  minutesTrainedToday: number;
  recentDays: ComponentProps<typeof AccumulationStrip>['recentDays'];
  factualFooter: string;
  chronicSupportSuggested: boolean;
  organizerCeiling: boolean;
  routingEmphasis: DailyPlan['routingEmphasis'];
  backupReminder: string | undefined;
};

// Faixa de status do dia: progresso, números de hoje, acúmulo recente e as notas
// sóbrias (reforço de base, teto de organizador, porquê do roteamento, backup).
// Valores JÁ computados no Today — este componente só apresenta.
export function TodayDayStatus({
  doneBlockCount,
  totalBlocks,
  minutesTrainedToday,
  recentDays,
  factualFooter,
  chronicSupportSuggested,
  organizerCeiling,
  routingEmphasis,
  backupReminder,
}: TodayDayStatusProps) {
  return (
    <>
      <div
        className="day-progress"
        role="progressbar"
        aria-label="Progresso do dia"
        aria-valuemin={0}
        aria-valuemax={totalBlocks}
        aria-valuenow={doneBlockCount}
        aria-valuetext={
          totalBlocks === 0
            ? 'Sem blocos planejados'
            : `${String(doneBlockCount)} de ${String(totalBlocks)} blocos`
        }
      >
        <DayProgressFill percent={totalBlocks === 0 ? 0 : Math.round((doneBlockCount / totalBlocks) * 100)} />
      </div>

      <ul className="day-stats" role="list" aria-label="Números de hoje">
        <li>
          <strong>
            {doneBlockCount}/{totalBlocks}
          </strong>
          <span>{totalBlocks === 1 ? 'bloco' : 'blocos'}</span>
        </li>
        <li>
          <strong>{minutesTrainedToday}</strong>
          <span>min hoje</span>
        </li>
      </ul>
      <AccumulationStrip recentDays={recentDays} />
      <p className="accumulation-footer">{factualFooter}</p>
      {chronicSupportSuggested ? (
        // R2b: oferta sóbria de reforçar a base (enquadrada como acúmulo, não
        // remediação). Decoplada do estágio exibido — não regride nada.
        <p className="support-base-note">{buildSupportBaseLine()}</p>
      ) : null}
      {organizerCeiling ? (
        // Teto explícito (council 2026-06-24): no topo (FM 2200-2400) o app assume
        // honestamente o papel de organizador de autoestudo — não finge um tier de
        // ensino novo. Mensagem sem promessa de rating.
        <p className="organizer-ceiling-note" role="note">
          {ORGANIZER_CEILING_MESSAGE}
        </p>
      ) : null}
      {routingEmphasis !== undefined ? (
        // A1' transparência (council 2026-06-24): mostra ao aluno POR QUE o coaching
        // de hoje foi roteado pelo padrão de erro recente. Nota sóbria, sem tap extra.
        <p className="routing-why-note" role="note">
          {buildRoutingWhy(routingEmphasis)}
        </p>
      ) : null}

      {backupReminder !== undefined ? (
        <p className="backup-reminder" role="status">
          {backupReminder}
        </p>
      ) : null}
    </>
  );
}
