export const REPORT_TIME_ZONE = 'America/New_York';
export const STAGE_AGE_THRESHOLD_DAYS = 30;
export const RECENT_ACTIVITY_WINDOW_DAYS = 30;
export const NO_ACCOUNT_LABEL = 'No account';

export type StageDurationBasis = 'stage_modified_time' | 'stage_history' | 'created_time';

export interface HistoryRow {
  Stage?: string | null;
  Modified_Time?: string | null;
  Moved_To__s?: string | null;
}

export interface StageEntry {
  enteredAt: string | null;
  basis: StageDurationBasis;
  approximate: boolean;
}

const CLOSED_STAGE_NAMES = new Set([
  'closed won',
  'closed lost',
  'closed lost to competition',
]);

export function isClosedStage(stage: string | null | undefined): boolean {
  const normalized = (stage || '').trim().toLowerCase();
  if (!normalized) return false;
  if (CLOSED_STAGE_NAMES.has(normalized)) return true;
  return normalized.startsWith('closed won') || normalized.startsWith('closed lost');
}

export function isOpenTaskStatus(status: string | null | undefined): boolean {
  return (status || '').trim().toLowerCase() !== 'completed';
}

export function hasNextStep(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

function zonedDayKey(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return Date.UTC(year, month - 1, day);
}

/** Whole calendar days from an ISO timestamp until now, in America/New_York. */
export function calendarDaysSince(
  iso: string | null | undefined,
  now: Date = new Date(),
  timeZone: string = REPORT_TIME_ZONE
): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime()) || Number.isNaN(now.getTime())) return null;
  return Math.round((zonedDayKey(now, timeZone) - zonedDayKey(then, timeZone)) / 86400000);
}

export function toAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function formatUsd(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatReportDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: REPORT_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function isBlankMovedTo(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === '';
}

/**
 * When the deal entered its current stage.
 * Prefer Stage_Modified_Time when Zoho has populated it. Otherwise use the
 * open DealHistory row (Moved To is empty) for the current stage. Created_Time
 * is only a fallback and is marked approximate.
 */
export function resolveStageEntry(
  deal: {
    Stage?: string | null;
    Stage_Modified_Time?: string | null;
    Created_Time?: string | null;
    Modified_Time?: string | null;
  },
  historyRows: HistoryRow[]
): StageEntry {
  if (deal.Stage_Modified_Time) {
    const parsed = new Date(deal.Stage_Modified_Time);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        enteredAt: deal.Stage_Modified_Time,
        basis: 'stage_modified_time',
        approximate: false,
      };
    }
  }

  const withTime = historyRows.filter((row) => row.Modified_Time);
  const openRows = withTime.filter((row) => isBlankMovedTo(row.Moved_To__s));
  const currentStage = (deal.Stage || '').trim();
  const openCurrent = openRows.filter((row) => (row.Stage || '').trim() === currentStage);
  const chosen = (openCurrent.length > 0 ? openCurrent : openRows)
    .slice()
    .sort((a, b) => new Date(b.Modified_Time as string).getTime() - new Date(a.Modified_Time as string).getTime())[0];

  if (chosen?.Modified_Time) {
    return {
      enteredAt: chosen.Modified_Time,
      basis: 'stage_history',
      approximate: false,
    };
  }

  const fallback = deal.Created_Time || deal.Modified_Time || null;
  return {
    enteredAt: fallback,
    basis: 'created_time',
    approximate: true,
  };
}

export interface AgingCandidate {
  closed: boolean;
  daysInStage: number | null;
  nextStep: string | null;
  openTaskCount: number;
  daysSinceActivity: number | null;
}

export function isAgingDeal(
  deal: AgingCandidate,
  stageThresholdDays: number = STAGE_AGE_THRESHOLD_DAYS,
  activityWindowDays: number = RECENT_ACTIVITY_WINDOW_DAYS
): boolean {
  if (deal.closed) return false;
  if (deal.daysInStage == null || deal.daysInStage <= stageThresholdDays) return false;
  if (hasNextStep(deal.nextStep)) return false;
  if (deal.openTaskCount > 0) return false;
  if (deal.daysSinceActivity != null && deal.daysSinceActivity <= activityWindowDays) return false;
  return true;
}

export function daysInStageColumnLabel(bases: StageDurationBasis[]): string {
  if (bases.length > 0 && bases.every((basis) => basis === 'created_time')) {
    return 'Days since created (approx.)';
  }
  return 'Days in stage';
}

export function daysInStageDetail(bases: StageDurationBasis[], historyAvailable: boolean): string {
  const usesApproximation = bases.some((basis) => basis === 'created_time');
  if (!historyAvailable) {
    return 'Zoho stage history could not be loaded. Days are counted from the deal created time (approx.), which is not a confirmed stage-change timestamp.';
  }
  if (usesApproximation) {
    return 'Days in stage come from Zoho stage history (the time the deal entered its current stage). Rows marked approx. had no stage-history entry, so created time was used instead.';
  }
  if (bases.length > 0 && bases.every((basis) => basis === 'stage_modified_time')) {
    return 'Days in stage are counted from Zoho Stage Modified Time, the timestamp of the last stage change.';
  }
  return 'Days in stage are counted from Zoho stage history: the time the deal entered its current stage.';
}

export interface RevenueDealInput {
  id: string;
  name: string;
  accountId: string | null;
  accountName: string | null;
  amount: number;
  stage: string;
}

export interface RevenueDealLine {
  id: string;
  name: string;
  amount: number;
  stage: string;
}

export interface RevenueAccountGroup {
  accountKey: string;
  accountName: string;
  totalPipelineValue: number;
  dealCount: number;
  deals: RevenueDealLine[];
}

export function groupDealsByAccount(deals: RevenueDealInput[]): RevenueAccountGroup[] {
  const groups = new Map<string, RevenueAccountGroup>();

  for (const deal of deals) {
    const hasAccount = Boolean(deal.accountId || (deal.accountName && deal.accountName.trim()));
    const accountKey = hasAccount ? (deal.accountId || `name:${deal.accountName}`) : NO_ACCOUNT_LABEL;
    const accountName = hasAccount ? (deal.accountName?.trim() || 'Unnamed account') : NO_ACCOUNT_LABEL;
    const existing = groups.get(accountKey) || {
      accountKey,
      accountName,
      totalPipelineValue: 0,
      dealCount: 0,
      deals: [],
    };
    existing.totalPipelineValue += deal.amount;
    existing.dealCount += 1;
    existing.deals.push({
      id: deal.id,
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage,
    });
    groups.set(accountKey, existing);
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (b.totalPipelineValue !== a.totalPipelineValue) return b.totalPipelineValue - a.totalPipelineValue;
    return a.accountName.localeCompare(b.accountName);
  });

  for (const group of sorted) {
    group.deals.sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      return a.name.localeCompare(b.name);
    });
    group.totalPipelineValue = Math.round(group.totalPipelineValue * 100) / 100;
  }

  return sorted;
}
