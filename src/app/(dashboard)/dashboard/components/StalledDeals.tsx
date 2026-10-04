'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StalledDeals() {
  const { data: deals, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    }
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  if (isLoadingDeals || isLoadingTasks) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
      </div>
    );
  }

  const activeStages = [
    "Qualification", "Needs Analysis", "Value Proposition", 
    "Identify Decision Makers", "Proposal/Price Quote", "Negotiation/Review"
  ];

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const stalledDeals = (deals || []).filter((deal: any) => {
    if (!activeStages.includes(deal.Stage)) return false;

    // Check if it has open tasks
    const dealTasks = (tasks || []).filter((t: any) => 
      (t.What_Id?.id === deal.id || t.SEMODULE_ID === deal.id) && 
      t.Status !== 'Completed'
    );

    const hasNoOpenTasks = dealTasks.length === 0;
    
    // Check if modified time is older than 14 days
    const modifiedTime = deal.Modified_Time ? new Date(deal.Modified_Time) : null;
    const isStale = modifiedTime && modifiedTime < fourteenDaysAgo;

    return hasNoOpenTasks || isStale;
  });

  // Sort by modified time (oldest first)
  stalledDeals.sort((a: any, b: any) => {
    const timeA = a.Modified_Time ? new Date(a.Modified_Time).getTime() : 0;
    const timeB = b.Modified_Time ? new Date(b.Modified_Time).getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
          Needs Attention ({stalledDeals.length})
        </h3>
        <Link href="/dashboard/pipeline" className="text-xs text-brand-red hover:underline font-medium flex items-center">
          View Pipeline <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {stalledDeals.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Great job! No stalled deals currently.
          </div>
        ) : (
          <div className="space-y-1">
            {stalledDeals.map((deal: any) => {
              const modifiedTime = deal.Modified_Time ? new Date(deal.Modified_Time) : null;
              const isStale = modifiedTime && modifiedTime < fourteenDaysAgo;
              const daysAgo = modifiedTime ? Math.floor((now.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24)) : '?';

              return (
                <Link 
                  key={deal.id} 
                  href={`/dashboard/pipeline?deal=${deal.id}`}
                  className="block p-3 rounded-lg hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 pr-4 group-hover:text-amber-900">
                      {deal.Deal_Name}
                    </h4>
                    {isStale && (
                      <span className="shrink-0 inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        <Clock className="w-3 h-3 mr-1" />
                        {daysAgo} days
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{deal.Stage}</span>
                    <span className="text-amber-600 font-medium">No Next Step</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
