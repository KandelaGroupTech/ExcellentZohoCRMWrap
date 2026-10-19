'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Activity, PhoneCall, CheckCircle2, CheckSquare, Columns, Clock, User, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { parseTaskSubject } from '@/lib/taskParser';

interface RecentActivityProps {
  onSelectDeal?: (dealId: string) => void;
}

type ActivityFilter = 'all' | 'calls' | 'tasks' | 'deals';

function formatCurrency(amount: any) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecentActivity({ onSelectDeal }: RecentActivityProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/tasks');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: calls = [], isLoading: isLoadingCalls } = useQuery({
    queryKey: ['all-calls'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/calls');
      if (!res.ok) return [];
      return res.json();
    }
  });

  if (isLoadingDeals && isLoadingTasks && isLoadingCalls) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red mb-2" />
        <p className="text-xs text-gray-400">Loading operational activity...</p>
      </div>
    );
  }

  // Combine and format activity
  const activities: any[] = [];

  // 1. Process Calls
  if (Array.isArray(calls)) {
    calls.forEach((call: any) => {
      const contactName = call.Who_Id?.name || call.What_Id?.name || 'Contact';
      const callSubject = call.Subject || '';
      const initialsMatch = callSubject.match(/Call from ([A-Za-z0-9_]+)/i);
      const callerInitials = initialsMatch ? initialsMatch[1].toUpperCase() : null;

      const dateStr = call.Call_Start_Time || call.Created_Time || call.Modified_Time;
      const timestamp = dateStr ? new Date(dateStr) : new Date();

      activities.push({
        id: `call-${call.id}`,
        type: 'calls',
        title: `Call with ${contactName}`,
        description: call.Description || `Logged ${call.Call_Type || 'outbound'} call (${call.Call_Duration || 'completed'})`,
        dealId: call.What_Id?.id && (call.$se_module === 'Deals' || call.SE_Module === 'Deals') ? call.What_Id.id : null,
        initials: callerInitials,
        timestamp,
        icon: PhoneCall,
        color: 'text-green-600',
        bg: 'bg-green-100',
        badge: 'Call Log'
      });
    });
  }

  // 2. Process Tasks
  if (Array.isArray(tasks)) {
    tasks.forEach((task: any) => {
      const parsed = parseTaskSubject(task.Subject);
      const isCompleted = task.Status === 'Completed';
      const dateStr = task.Modified_Time || task.Created_Time;
      const timestamp = dateStr ? new Date(dateStr) : new Date();

      const dealId = task.What_Id?.id || (task.SE_Module === 'Deals' ? task.SEMODULE_ID : null);
      const groupName = task.What_Id?.name || task.Who_Id?.name || null;

      activities.push({
        id: `task-${task.id}`,
        type: 'tasks',
        title: parsed.text,
        description: isCompleted ? 'Task completed' : (groupName ? `For project: ${groupName}` : 'Task open'),
        dealId,
        initials: parsed.initials[0] || null,
        timestamp,
        icon: isCompleted ? CheckCircle2 : CheckSquare,
        color: isCompleted ? 'text-green-600' : 'text-blue-600',
        bg: isCompleted ? 'bg-green-100' : 'bg-blue-100',
        badge: isCompleted ? 'Completed' : 'Task'
      });
    });
  }

  // 3. Process Deals
  if (Array.isArray(deals)) {
    deals.forEach((deal: any) => {
      let owner = null;
      let isArchived = false;
      if (deal.Description && deal.Description.includes('---DEAL_META---')) {
        try {
          const parts = deal.Description.split('---DEAL_META---');
          const meta = JSON.parse(parts[parts.length - 1].trim());
          owner = meta.owner || null;
          isArchived = !!meta.archived;
        } catch(e) {}
      }

      if (deal.Modified_Time) {
        activities.push({
          id: `deal-${deal.id}`,
          type: 'deals',
          title: deal.Deal_Name,
          description: isArchived ? 'Project shelved in Archive' : `Active in ${deal.Stage} • ${formatCurrency(deal.Amount)}`,
          dealId: deal.id,
          initials: owner,
          timestamp: new Date(deal.Modified_Time),
          icon: Columns,
          color: isArchived ? 'text-amber-600' : 'text-purple-600',
          bg: isArchived ? 'bg-amber-100' : 'bg-purple-100',
          badge: isArchived ? 'Archived' : deal.Stage
        });
      }
    });
  }

  // Sort descending by timestamp
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Filter by category
  const filteredActivities = activities.filter((act) => {
    if (filter !== 'all' && act.type !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (act.title || '').toLowerCase().includes(q);
      const matchDesc = (act.description || '').toLowerCase().includes(q);
      const matchInitials = (act.initials || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchInitials;
    }
    return true;
  });

  const counts = {
    all: activities.length,
    calls: activities.filter(a => a.type === 'calls').length,
    tasks: activities.filter(a => a.type === 'tasks').length,
    deals: activities.filter(a => a.type === 'deals').length
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-red" />
          <h3 className="font-semibold text-gray-900 text-sm">Live Operations Stream</h3>
          <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {filteredActivities.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {(['all', 'calls', 'tasks', 'deals'] as ActivityFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all capitalize shrink-0 ${
                filter === f
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Quick Search inside feed */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed by name, initials, or keyword..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red bg-gray-50/50"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No activity matches your filter.</p>
          </div>
        ) : (
          filteredActivities.slice(0, 30).map((activity) => (
            <div 
              key={activity.id} 
              className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className={`mt-0.5 shrink-0 p-2 rounded-lg ${activity.bg}`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  {activity.dealId && onSelectDeal ? (
                    <button
                      type="button"
                      onClick={() => onSelectDeal(activity.dealId)}
                      className="text-sm font-semibold text-gray-900 hover:text-brand-red transition-colors line-clamp-1 block text-left cursor-pointer"
                      title="Open project details"
                    >
                      {activity.title}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {activity.title}
                    </p>
                  )}

                  <span className="text-[10px] text-gray-400 shrink-0 font-medium whitespace-nowrap">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {activity.description}
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activity.initials && (
                      <span className="bg-gray-100 text-gray-700 font-bold px-1.5 py-0.2 rounded text-[10px] border border-gray-200">
                        @{activity.initials}
                      </span>
                    )}
                    <span className="bg-gray-50 text-gray-500 font-medium px-1.5 py-0.2 rounded text-[10px] border border-gray-100">
                      {activity.badge}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
