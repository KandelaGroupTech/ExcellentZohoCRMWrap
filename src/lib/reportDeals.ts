import {
  calendarDaysSince,
  daysInStageColumnLabel,
  daysInStageDetail,
  groupDealsByAccount,
  hasNextStep,
  isAgingDeal,
  isClosedStage,
  isOpenTaskStatus,
  resolveStageEntry,
  STAGE_AGE_THRESHOLD_DAYS,
  RECENT_ACTIVITY_WINDOW_DAYS,
  toAmount,
  type HistoryRow,
  type StageDurationBasis,
} from '@/lib/dealReports';
import { fetchDealStageHistory, fetchDealsForReports, fetchTasksForReports } from '@/lib/zoho';

interface ZohoLookup {
  id?: string;
  name?: string;
}

interface ZohoDeal {
  id: string;
  Deal_Name?: string | null;
  Amount?: number | string | null;
  Stage?: string | null;
  Account_Name?: ZohoLookup | string | null;
  Next_Step?: string | null;
  Created_Time?: string | null;
  Modified_Time?: string | null;
  Last_Activity_Time?: string | null;
  Stage_Modified_Time?: string | null;
}

interface ZohoHistory {
  Potential_Name?: ZohoLookup | null;
  Stage?: string | null;
  Modified_Time?: string | null;
  Moved_To__s?: string | null;
}

interface ZohoTask {
  Status?: string | null;
  What_Id?: ZohoLookup | null;
  $se_module?: string | null;
  SE_Module?: string | null;
}

function accountFromDeal(deal: ZohoDeal): { id: string | null; name: string | null } {
  const account = deal.Account_Name;
  if (!account) return { id: null, name: null };
  if (typeof account === 'string') return { id: null, name: account };
  return { id: account.id || null, name: account.name || null };
}

function historyByDeal(rows: ZohoHistory[]): Map<string, HistoryRow[]> {
  const grouped = new Map<string, HistoryRow[]>();
  for (const row of rows) {
    const dealId = row.Potential_Name?.id;
    if (!dealId) continue;
    const list = grouped.get(dealId) || [];
    list.push({
      Stage: row.Stage,
      Modified_Time: row.Modified_Time,
      Moved_To__s: row.Moved_To__s,
    });
    grouped.set(dealId, list);
  }
  return grouped;
}

function openTaskCounts(tasks: ZohoTask[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (!isOpenTaskStatus(task.Status)) continue;
    const moduleName = task.$se_module || task.SE_Module;
    if (moduleName && moduleName !== 'Deals') continue;
    const dealId = task.What_Id?.id;
    if (!dealId) continue;
    counts.set(dealId, (counts.get(dealId) || 0) + 1);
  }
  return counts;
}

export async function buildAgingReport(now: Date = new Date()) {
  const deals = (await fetchDealsForReports()) as ZohoDeal[];

  let historyAvailable = true;
  let historyRows: ZohoHistory[] = [];
  try {
    historyRows = (await fetchDealStageHistory()) as ZohoHistory[];
  } catch (error) {
    historyAvailable = false;
    console.error('Stage history unavailable; aging days will use created time:', error);
  }

  const tasks = (await fetchTasksForReports()) as ZohoTask[];
  const history = historyByDeal(historyRows);
  const openTasks = openTaskCounts(tasks);
  const bases: StageDurationBasis[] = [];

  const rows = deals.flatMap((deal) => {
    const entry = resolveStageEntry(deal, history.get(deal.id) || []);
    const account = accountFromDeal(deal);
    const daysInStage = calendarDaysSince(entry.enteredAt, now);
    const daysSinceActivity = calendarDaysSince(deal.Last_Activity_Time, now);
    const candidate = {
      closed: isClosedStage(deal.Stage),
      daysInStage,
      nextStep: deal.Next_Step || null,
      openTaskCount: openTasks.get(deal.id) || 0,
      daysSinceActivity,
    };
    if (!isAgingDeal(candidate)) return [];
    bases.push(entry.basis);
    return [{
      id: deal.id,
      name: deal.Deal_Name || 'Untitled deal',
      accountName: account.name || 'No account',
      stage: deal.Stage || '—',
      daysInStage: daysInStage ?? 0,
      daysInStageApproximate: entry.approximate,
      stageEnteredAt: entry.enteredAt,
      amount: toAmount(deal.Amount),
      lastActivityAt: deal.Last_Activity_Time || null,
      nextStep: hasNextStep(deal.Next_Step) ? deal.Next_Step : null,
      openTaskCount: candidate.openTaskCount,
    }];
  }).sort((a, b) => {
    if (b.daysInStage !== a.daysInStage) return b.daysInStage - a.daysInStage;
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.name.localeCompare(b.name);
  });

  return {
    meta: {
      thresholdDays: STAGE_AGE_THRESHOLD_DAYS,
      recentActivityWindowDays: RECENT_ACTIVITY_WINDOW_DAYS,
      timeZone: 'America/New_York',
      daysInStageField: historyAvailable ? 'DealHistory.Modified_Time' : 'Created_Time',
      lastActivityField: 'Last_Activity_Time',
      nextStepField: 'Next_Step',
      daysInStageLabel: daysInStageColumnLabel(bases),
      daysInStageDetail: daysInStageDetail(bases, historyAvailable),
      usesApproximation: bases.some((basis) => basis === 'created_time') || !historyAvailable,
      count: rows.length,
    },
    deals: rows,
  };
}

export async function buildRevenueByAccountReport() {
  const deals = (await fetchDealsForReports()) as ZohoDeal[];
  const accounts = groupDealsByAccount(deals.map((deal) => {
    const account = accountFromDeal(deal);
    return {
      id: deal.id,
      name: deal.Deal_Name || 'Untitled deal',
      accountId: account.id,
      accountName: account.name,
      amount: toAmount(deal.Amount),
      stage: deal.Stage || '—',
    };
  }));

  const totalPipelineValue = Math.round(
    accounts.reduce((sum, account) => sum + account.totalPipelineValue, 0) * 100
  ) / 100;

  return {
    meta: {
      timeZone: 'America/New_York',
      currency: 'USD',
      dealCount: deals.length,
      accountCount: accounts.length,
      totalPipelineValue,
    },
    accounts,
  };
}
