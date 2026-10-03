'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import SwipeableCard from '../../components/SwipeableCard';

export default function MyToDos() {
  const queryClient = useQueryClient();

  const { data: allTasks, isLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
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
      // We might also need to invalidate tasks for specific deals, but invalidateQueries does partial matching? No.
      // But we can just rely on the all-tasks query for now.
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red mb-4" />
        <p className="text-sm text-gray-500">Loading your to-dos...</p>
      </div>
    );
  }

  // Filter out completed tasks and group by Project (Deal)
  const openTasks = allTasks?.filter((t: any) => t.Status !== 'Completed') || [];
  
  const groupedTasks = openTasks.reduce((acc: any, task: any) => {
    let groupName = 'General / No Project';
    if (task.SEMODULE_ID && task.SE_Module === 'Deals' && task.What_Id?.name) {
      groupName = task.What_Id.name;
    } else if (task.What_Id?.name) {
      groupName = task.What_Id.name;
    } else if (task.Who_Id?.name) { groupName = task.Who_Id.name; }
    
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'General / No Project') return 1;
    if (b === 'General / No Project') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[800px]">
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">My To-Dos</h3>
        <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {openTasks.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {openTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-base font-medium text-gray-900">All caught up!</h4>
            <p className="text-sm text-gray-500 mt-1">You have no pending tasks right now.</p>
          </div>
        ) : (
          groupKeys.map(group => (
            <div key={group} className="space-y-1">
              <h4 className="text-xs font-semibold text-brand-red uppercase tracking-wider sticky top-0 bg-white py-1 z-10">
                {group}
              </h4>
              <div className="space-y-0.5">
                {groupedTasks[group].map((task: any) => (
                  <SwipeableCard
                    key={task.id}
                    onComplete={() => updateTaskMutation.mutate({ taskId: task.id, status: 'Completed' })}
                  >
                    <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <button 
                        onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'Completed' })}
                        className="mt-0.5 text-gray-400 hover:text-green-500 focus:outline-none transition-colors shrink-0"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {task.Subject}
                        </p>
                      </div>
                    </div>
                  </SwipeableCard>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
