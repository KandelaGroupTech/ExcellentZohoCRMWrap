'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, DollarSign, Target, TrendingUp, AlertCircle } from 'lucide-react';

function formatCurrency(amount: any) {
  if (!amount) return '$0';
  if (amount >= 1000000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(amount / 1000000) + 'M';
  if (amount >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount / 1000) + 'k';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default function PipelineSnapshot() {
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
      </div>
    );
  }

  if (error || !deals) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 p-6">
        <p className="text-sm text-red-800">Failed to load pipeline data.</p>
      </div>
    );
  }

  // Calculate Metrics
  const activeStages = [
    "Qualification", "Needs Analysis", "Value Proposition", 
    "Identify Decision Makers", "Proposal/Price Quote", "Negotiation/Review"
  ];

  let totalActivePipeline = 0;
  let proposalAmount = 0;
  let negotiationAmount = 0;
  let wonThisMonth = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  deals.forEach((deal: any) => {
    const amount = deal.Amount || 0;
    
    if (activeStages.includes(deal.Stage)) {
      totalActivePipeline += amount;
      
      if (deal.Stage === 'Proposal/Price Quote') {
        proposalAmount += amount;
      } else if (deal.Stage === 'Negotiation/Review') {
        negotiationAmount += amount;
      }
    } else if (deal.Stage === 'Closed Won') {
      const closeDate = deal.Closing_Date ? new Date(deal.Closing_Date) : new Date(deal.Modified_Time);
      if (closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear) {
        wonThisMonth += amount;
      }
    }
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-brand-red" />
          Pipeline Health
        </h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Total Pipeline */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200/60">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Active Pipeline</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalActivePipeline)}</span>
          </div>
        </div>

        {/* Won This Month */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Won This Month</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-green-900">{formatCurrency(wonThisMonth)}</span>
          </div>
        </div>

        {/* Proposal Stage */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center">
            <DollarSign className="w-3 h-3 mr-1 text-blue-500" />
            In Proposal
          </p>
          <span className="text-lg font-bold text-gray-800">{formatCurrency(proposalAmount)}</span>
        </div>

        {/* Negotiation Stage */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center">
            <Target className="w-3 h-3 mr-1 text-orange-500" />
            In Negotiation
          </p>
          <span className="text-lg font-bold text-gray-800">{formatCurrency(negotiationAmount)}</span>
        </div>
      </div>
    </div>
  );
}
