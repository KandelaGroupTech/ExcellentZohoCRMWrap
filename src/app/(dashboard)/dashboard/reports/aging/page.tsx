'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hourglass, Search } from 'lucide-react';
import { formatReportDate, formatUsd } from '@/lib/dealReports';
import { ReportError, ReportLoading } from '../ReportStatus';

interface AgingDeal {
  id: string;
  name: string;
  accountName: string;
  stage: string;
  daysInStage: number;
  daysInStageApproximate: boolean;
  amount: number;
  lastActivityAt: string | null;
}

interface AgingReport {
  meta: {
    thresholdDays: number;
    recentActivityWindowDays: number;
    daysInStageLabel: string;
    daysInStageDetail: string;
    count: number;
  };
  deals: AgingDeal[];
}

export default function AgingReportPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery<AgingReport>({
    queryKey: ['report-aging'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/reports/aging');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load the aging report');
      return body;
    },
  });

  const deals = data?.deals ?? [];
  const filtered = useMemo(() => {
    const rows = data?.deals ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((deal) =>
      [deal.name, deal.accountName, deal.stage].join(' ').toLowerCase().includes(needle)
    );
  }, [data?.deals, query]);

  if (isLoading) return <ReportLoading label="Loading aging deals..." />;
  if (error) {
    return (
      <ReportError
        message={(error as Error).message || 'Error loading the aging report.'}
        onRetry={() => refetch()}
      />
    );
  }

  const label = data?.meta.daysInStageLabel || 'Days in stage';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Aging deals</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-3xl">
          Open deals in the current stage for more than {data?.meta.thresholdDays ?? 30} days,
          with an empty next step, no open to-dos, and no activity in the last {data?.meta.recentActivityWindowDays ?? 30} days.
          Closed Won and Closed Lost deals are excluded. Dates are Eastern Time (America/New_York).
        </p>
        <p className="mt-1 text-xs text-gray-400 max-w-3xl">{data?.meta.daysInStageDetail}</p>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search deals, accounts, or stages..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red sm:text-sm"
            />
          </div>
          <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full self-start">
            {filtered.length}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['Deal', 'Account', 'Stage', label, 'Amount', 'Last activity'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <Hourglass className="w-6 h-6 text-gray-500" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">
                      {deals.length === 0 ? 'No aging deals' : 'No deals match that search'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                      {deals.length === 0
                        ? 'Every open deal has moved stage within 30 days, has a next step or open to-do, or has activity in the last 30 days.'
                        : 'Try a different deal, account, or stage.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{deal.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{deal.accountName}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{deal.stage}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {deal.daysInStage}
                      {deal.daysInStageApproximate ? (
                        <span className="ml-1 text-xs text-amber-700">approx.</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{formatUsd(deal.amount)}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatReportDate(deal.lastActivityAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
