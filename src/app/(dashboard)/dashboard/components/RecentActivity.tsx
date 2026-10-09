'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Activity, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RecentActivity() {
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red mb-2" />
        <p className="text-xs text-gray-400">Loading recent activity...</p>
      </div>
    );
  }

  // Combine and format activity
  const activities = [];

  if (deals) {
    deals.forEach((deal: any) => {
      if (deal.Modified_Time) {
        activities.push({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: deal.Deal_Name,
          description: `Stage updated to ${deal.Stage}`,
          timestamp: new Date(deal.Modified_Time),
          link: `/dashboard/pipeline?deal=${deal.id}`,
          icon: FileText,
          color: 'text-blue-500',
          bg: 'bg-blue-50'
        });
      }
    });
  }

  if (tasks) {
    tasks.forEach((task: any) => {
      if (task.Status === 'Completed') {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.Subject,
          description: `Task marked as completed`,
          timestamp: new Date(task.Modified_Time || new Date()), // Fallback
          link: task.What_Id?.id ? `/dashboard/pipeline?deal=${task.What_Id.id}` : null,
          icon: CheckCircle2,
          color: 'text-green-500',
          bg: 'bg-green-50'
        });
      }
    });
  }

  // Sort descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Take top 10
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-brand-red" />
          Recent Activity
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No recent activity found.</p>
        ) : (
          recentActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start">
              <div className={`mt-0.5 shrink-0 p-1.5 rounded-full ${activity.bg}`}>
                <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                {activity.link ? (
                  <Link href={activity.link} className="text-sm font-medium text-gray-900 hover:text-brand-red transition-colors line-clamp-1 block">
                    {activity.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {activity.title}
                  </p>
                )}
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {activity.description}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                    {activity.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
