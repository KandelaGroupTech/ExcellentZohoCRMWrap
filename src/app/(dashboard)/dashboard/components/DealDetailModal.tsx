'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

interface DealDetailModalProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DealDetailModal({ deal, isOpen, onClose }: DealDetailModalProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const queryClient = useQueryClient();
  const [newTaskSubject, setNewTaskSubject] = useState('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return [];
      const res = await fetch(`/api/deals/${deal.id}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!deal?.id && isOpen
  });

  const createTaskMutation = useMutation({
    mutationFn: async (subject: string) => {
      const res = await fetch(`/api/deals/${deal.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Subject: subject })
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', deal?.id] });
      setNewTaskSubject('');
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', deal?.id] });
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  if (!deal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deal.Deal_Name}>
      <div className="space-y-6">
        {/* Deal Info */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Stage</span>
              <span className="font-medium text-gray-900">{deal.Stage}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Amount</span>
              <span className="font-medium text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.Amount || 0)}
              </span>
            </div>
            {deal.Account_Name?.name && (
              <div className="col-span-2">
                <span className="block text-gray-500 mb-1">Account</span>
                <span className="font-medium text-gray-900">{deal.Account_Name.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">To-Do list</h4>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {tasks?.map((task: any) => {
                const isCompleted = task.Status === 'Completed';
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                    <button 
                      onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: isCompleted ? 'Not Started' : 'Completed' })}
                      disabled={!isAdmin}
                      className={`text-gray-400 focus:outline-none ${isAdmin ? 'hover:text-brand-red' : 'cursor-default opacity-50'}`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.Subject}
                    </span>
                  </div>
                );
              })}
              {tasks?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No tasks found for this deal.</p>
              )}
            </div>
          )}

          {/* New Task Form */}
          {isAdmin && (
            <form 
              className="mt-4 flex gap-2" 
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskSubject.trim()) createTaskMutation.mutate(newTaskSubject);
              }}
            >
              <input 
                type="text" 
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                placeholder="Add a new follow-up..." 
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red"
              />
              <button 
                type="submit" 
                disabled={createTaskMutation.isPending || !newTaskSubject.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
