'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search } from 'lucide-react';
import { formatUsd } from '@/lib/dealReports';
import { ReportError, ReportLoading } from '../ReportStatus';

interface RevenueDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
}

interface RevenueAccount {
  accountKey: string;
  accountName: string;
  totalPipelineValue: number;
  dealCount: number;
  deals: RevenueDeal[];
}

interface RevenueReport {
  meta: {
    dealCount: number;
    accountCount: number;
    totalPipelineValue: number;
  };
  accounts: RevenueAccount[];
}

export default function RevenueByAccountPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery<RevenueReport>({
    queryKey: ['report-revenue-by-account'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/reports/revenue-by-account');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load revenue by account');
      return body;
    },
  });

  const accounts = data?.accounts ?? [];
  const filtered = useMemo(() => {
    const rows = data?.accounts ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((account) => {
      if (account.accountName.toLowerCase().includes(needle)) return true;
      return account.deals.some((deal) => deal.name.toLowerCase().includes(needle));
    });
  }, [data?.accounts, query]);

  if (isLoading) return <ReportLoading label="Loading revenue by account..." />;
  if (error) {
    return (
      <ReportError
        message={(error as Error).message || 'Error loading revenue by account.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Revenue by account</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-3xl">
            Every deal grouped by account. Total pipeline value is the sum of deal amounts, including closed deals.
            Deals without an account are grouped under No account. Amounts are USD.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Accounts</p>
            <p className="text-lg font-bold text-gray-900">{data?.meta.accountCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Total pipeline value</p>
            <p className="text-lg font-bold text-gray-900">{formatUsd(data?.meta.totalPipelineValue)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts or deals..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red sm:text-sm"
            />
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Building2 className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900">No deals yet</h3>
            <p className="text-sm text-gray-500 mt-1">Revenue by account will appear once deals exist in Zoho.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">
            No accounts match that search.
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['Account', 'Total pipeline value', 'Deals', 'Deal amounts'].map((heading) => (
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
                {filtered.map((account) => (
                  <tr key={account.accountKey} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{account.accountName}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatUsd(account.totalPipelineValue)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{account.dealCount}</td>
                    <td className="px-4 py-4">
                      <ul className="space-y-1">
                        {account.deals.map((deal) => (
                          <li key={deal.id} className="flex items-baseline justify-between gap-4 text-sm">
                            <span className="text-gray-800">
                              {deal.name}
                              <span className="ml-2 text-xs text-gray-400">{deal.stage}</span>
                            </span>
                            <span className="text-gray-900 whitespace-nowrap">{formatUsd(deal.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
