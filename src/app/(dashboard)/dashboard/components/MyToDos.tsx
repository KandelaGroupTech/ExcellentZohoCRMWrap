'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, Calendar, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';
import SwipeableCard from '../../components/SwipeableCard';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { parseTaskSubject, isTaskForUser } from '@/lib/taskParser';

interface MyToDosProps {
  onSelectDeal?: (dealId: string) => void;
}

export default function MyToDos({ onSelectDeal }: MyToDosProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<"me" | "team">("team");
  
  const [activeInitials, setActiveInitials] = useState<string>('');

  const { data: teamMembers = [] } = useQuery<{ id?: string; name: string; initials: string; email?: string }[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/team');
      if (!res.ok) return [];
      return res.json();
    }
  });

  useEffect(() => {
    // 1. Check localStorage first
    const saved = typeof window !== 'undefined' ? localStorage.getItem('user_initials') : null;
    if (saved) {
      setActiveInitials(saved.toUpperCase());
      return;
    }

    // 2. Check if logged-in user matches email / name
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
    if (email.includes('rasala') || email.includes('richard')) {
      setActiveInitials('RA');
      localStorage.setItem('user_initials', 'RA');
      return;
    }
    if (email.includes('crm@excellentjob.com')) {
      setActiveInitials('RA');
      localStorage.setItem('user_initials', 'RA');
      return;
    }

    // Match with teamMembers list
    if (teamMembers.length > 0) {
      const matched = teamMembers.find(m => m.email?.toLowerCase() === email || m.id === user?.id);
      if (matched?.initials) {
        setActiveInitials(matched.initials.toUpperCase());
        localStorage.setItem('user_initials', matched.initials.toUpperCase());
        return;
      }
    }

    // 3. Fallback to Clerk initials
    if (user?.firstName || user?.lastName) {
      const inits = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();
      if (inits) {
        const finalInits = inits === 'CJ' ? 'RA' : inits;
        setActiveInitials(finalInits);
        localStorage.setItem('user_initials', finalInits);
        return;
      }
    }

    setActiveInitials('RA');
  }, [user, teamMembers]);

  // Sync initials changes across tabs/components
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('user_initials');
      if (saved) setActiveInitials(saved.toUpperCase());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('initials_changed', handleSync as EventListener);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('initials_changed', handleSync as EventListener);
    };
  }, []);

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
  const allOpenTasks = allTasks?.filter((t: any) => t.Status !== 'Completed') || [];
  
  const openTasks = viewMode === 'team' 
    ? allOpenTasks 
    : allOpenTasks.filter((t: any) => isTaskForUser(t.Subject, activeInitials));
  
  // Map group name -> deal id (only for tasks linked to a Deal)
  const groupDealIds: Record<string, string> = {};

  const groupedTasks = openTasks.reduce((acc: any, task: any) => {
    let groupName = 'General / No Project';
    if (task.SEMODULE_ID && task.SE_Module === 'Deals' && task.What_Id?.name) {
      groupName = task.What_Id.name;
    } else if (task.What_Id?.name) {
      groupName = task.What_Id.name;
    } else if (task.Who_Id?.name) { groupName = task.Who_Id.name; }
    
    if (task.What_Id?.id && task.What_Id?.name === groupName && (!task.SE_Module || task.SE_Module === 'Deals')) {
      groupDealIds[groupName] = task.What_Id.id;
    }

    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {});

  // Sort tasks within each group chronologically
  Object.keys(groupedTasks).forEach(group => {
    groupedTasks[group].sort((a: any, b: any) => {
      if (!a.Due_Date && !b.Due_Date) return 0;
      if (!a.Due_Date) return 1;
      if (!b.Due_Date) return -1;
      return new Date(a.Due_Date).getTime() - new Date(b.Due_Date).getTime();
    });
  });

  const groupKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'General / No Project') return 1;
    if (b === 'General / No Project') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[800px]">
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">My To-Dos</h3>
          <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {openTasks.length}
          </span>
        </div>
        
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <div className="flex items-center">
            <button
              onClick={() => setViewMode('me')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'me' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mine</span>
              {activeInitials && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
                  {activeInitials}
                </span>
              )}
            </button>
            {teamMembers.length > 0 && (
              <select
                value={activeInitials}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setActiveInitials(val);
                  localStorage.setItem('user_initials', val);
                  window.dispatchEvent(new CustomEvent('initials_changed'));
                  setViewMode('me');
                }}
                className="text-[11px] font-semibold bg-transparent text-gray-600 hover:text-gray-900 border-none rounded py-1 px-1 focus:ring-0 cursor-pointer"
                title="Switch active user initials"
              >
                {teamMembers.map((m) => (
                  <option key={m.id || m.initials} value={m.initials}>
                    {m.initials} ({m.name})
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Team
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {openTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-base font-medium text-gray-900">All caught up!</h4>
            <p className="text-sm text-gray-500 mt-1">
              {viewMode === 'me' ? 'You have no assigned tasks right now.' : 'You have no pending tasks right now.'}
            </p>
          </div>
        ) : (
          groupKeys.map(group => (
            <div key={group} className="space-y-1">
              <h4 className="text-xs font-semibold text-brand-red uppercase tracking-wider sticky top-0 bg-white py-1 z-10">
                {groupDealIds[group] ? (
                  onSelectDeal ? (
                    <button
                      type="button"
                      onClick={() => onSelectDeal(groupDealIds[group])}
                      className="hover:underline underline-offset-2 text-left cursor-pointer"
                      title="Open project details"
                    >
                      {group}
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/pipeline?deal=${groupDealIds[group]}`}
                      className="hover:underline underline-offset-2"
                      title="Open project"
                    >
                      {group}
                    </Link>
                  )
                ) : (
                  group
                )}
              </h4>
              <div className="space-y-0.5">
                {groupedTasks[group].map((task: any) => {
                  const parsed = parseTaskSubject(task.Subject);
                  return (
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 break-words flex-1">
                              {parsed.text}
                            </p>
                            {parsed.initials.length > 0 && (
                              <div className="flex items-center gap-1 shrink-0">
                                {parsed.initials.map(init => (
                                  <span 
                                    key={init} 
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      init === activeInitials
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}
                                  >
                                    {init}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {task.Due_Date && (
                            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                              new Date(task.Due_Date) < new Date(new Date().setHours(0,0,0,0)) 
                                ? 'text-red-600' 
                                : new Date(task.Due_Date).toDateString() === new Date().toDateString()
                                  ? 'text-orange-500'
                                  : 'text-gray-500'
                            }`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(task.Due_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(task.Due_Date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                            </div>
                          )}
                        </div>
                      </div>
                    </SwipeableCard>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
