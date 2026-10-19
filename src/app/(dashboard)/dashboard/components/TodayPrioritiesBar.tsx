'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Circle, AlertCircle, Clock, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseTaskSubject } from '@/lib/taskParser';

interface TodayPrioritiesBarProps {
  onSelectDeal?: (dealId: string) => void;
}

export default function TodayPrioritiesBar({ onSelectDeal }: TodayPrioritiesBarProps) {
  const queryClient = useQueryClient();

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/tasks');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      toast.success('Task marked as complete');
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  if (isLoading) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const openTasks = allTasks.filter((t: any) => t.Status !== 'Completed');

  // Priority detection:
  // 1. Due Today
  // 2. Overdue
  // 3. Walkthrough / Site visit keywords
  const priorityTasks = openTasks.filter((t: any) => {
    const subject = (t.Subject || '').toLowerCase();
    const isWalkthrough = subject.includes('walkthrough') || 
                          subject.includes('seeing the space') || 
                          subject.includes('walk the space') ||
                          subject.includes('site visit') ||
                          subject.includes('inspection');
    
    if (isWalkthrough) return true;

    if (t.Due_Date) {
      const dueDate = new Date(t.Due_Date);
      return dueDate <= todayEnd;
    }

    return false;
  });

  // Sort: Walkthroughs first, then Overdue, then Due Today
  priorityTasks.sort((a: any, b: any) => {
    const aSub = (a.Subject || '').toLowerCase();
    const bSub = (b.Subject || '').toLowerCase();
    const aIsWalk = aSub.includes('walk') || aSub.includes('space');
    const bIsWalk = bSub.includes('walk') || bSub.includes('space');
    if (aIsWalk && !bIsWalk) return -1;
    if (!aIsWalk && bIsWalk) return 1;

    const aDue = a.Due_Date ? new Date(a.Due_Date).getTime() : Infinity;
    const bDue = b.Due_Date ? new Date(b.Due_Date).getTime() : Infinity;
    return aDue - bDue;
  });

  if (priorityTasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-gray-500 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="font-medium text-gray-700">Today's Operations:</span>
          <span>All site walkthroughs and task deadlines are on schedule.</span>
        </div>
        <span className="text-gray-400 font-semibold text-[11px]">{openTasks.length} total pending tasks across team</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 to-brand-black border border-gray-800 rounded-xl p-4 text-white shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            Today's Priorities & Field Walkthroughs
          </h3>
          <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
            {priorityTasks.length} Urgent
          </span>
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline">
          {priorityTasks.filter((t: any) => (t.Subject || '').toLowerCase().includes('walk') || (t.Subject || '').toLowerCase().includes('space')).length} Walkthroughs • {priorityTasks.filter((t: any) => t.Due_Date && new Date(t.Due_Date) < todayStart).length} Overdue
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {priorityTasks.slice(0, 6).map((task: any) => {
          const parsed = parseTaskSubject(task.Subject);
          const isWalk = (task.Subject || '').toLowerCase().includes('walk') || (task.Subject || '').toLowerCase().includes('space');
          const isOverdue = task.Due_Date && new Date(task.Due_Date) < todayStart;
          const isToday = task.Due_Date && new Date(task.Due_Date) >= todayStart && new Date(task.Due_Date) <= todayEnd;
          const dealId = task.What_Id?.id || (task.SE_Module === 'Deals' ? task.SEMODULE_ID : null);
          const projectName = task.What_Id?.name || (task.Who_Id?.name ? `Contact: ${task.Who_Id.name}` : 'General');

          return (
            <div
              key={task.id}
              className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-3 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-300 truncate max-w-[180px]">
                    {dealId && onSelectDeal ? (
                      <button
                        type="button"
                        onClick={() => onSelectDeal(dealId)}
                        className="hover:text-white hover:underline text-left"
                      >
                        {projectName}
                      </button>
                    ) : (
                      projectName
                    )}
                  </span>
                  
                  {isWalk ? (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" /> Walkthrough
                    </span>
                  ) : isOverdue ? (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <AlertCircle className="w-3 h-3" /> Overdue
                    </span>
                  ) : isToday ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> Due Today
                    </span>
                  ) : null}
                </div>

                <p className="text-xs font-medium text-white mb-2 line-clamp-2">
                  {parsed.text}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
                <div className="flex items-center gap-1.5">
                  {parsed.initials.map(init => (
                    <span key={init} className="bg-white/20 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                      @{init}
                    </span>
                  ))}
                  {task.Due_Date && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.Due_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'Completed' })}
                  disabled={updateTaskMutation.isPending}
                  className="text-gray-400 hover:text-green-400 transition-colors p-1"
                  title="Mark complete"
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
