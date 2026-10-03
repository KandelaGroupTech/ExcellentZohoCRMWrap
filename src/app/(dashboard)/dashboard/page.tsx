'use client';

import Link from 'next/link';
import { CircleDollarSign, Hourglass } from 'lucide-react';
import MyToDos from './components/MyToDos';

const savedReports = [
  {
    name: 'Aging deals',
    href: '/dashboard/reports/aging',
    description: 'Open deals sitting in the current stage for more than 30 days, with no next step and no recent activity.',
    icon: Hourglass,
  },
  {
    name: 'Revenue by account',
    href: '/dashboard/reports/revenue-by-account',
    description: 'Deal amounts rolled up by account, including the deals that make up each total.',
    icon: CircleDollarSign,
  },
];

export default function DashboardHome() {
  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Command Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="flex flex-col gap-6">
          <MyToDos />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Saved reports</h3>
          {savedReports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-brand-red transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-brand-red shrink-0">
                  <report.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
