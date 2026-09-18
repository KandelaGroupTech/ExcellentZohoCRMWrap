'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

interface DealDetailModalProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  stages?: string[];
  onUpdateStage?: (dealId: string, newStage: string) => void;
  isUpdatingStage?: boolean;
}

export default function DealDetailModal({ deal, isOpen, onClose, stages = [], onUpdateStage, isUpdatingStage }: DealDetailModalProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const queryClient = useQueryClient();
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const { user } = useUser();
  const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : '';
  const [newNoteContent, setNewNoteContent] = useState('');

  const { data: notes, isLoading: isLoadingNotes, isError: isErrorNotes, error: errorNotes } = useQuery({
    queryKey: ['notes', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return [];
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/notes`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch notes');
      }
      return res.json();
    },
    enabled: !!deal?.id && isOpen
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, initials })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create note');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', deal?.id] });
      setNewNoteContent('');
      toast.success('Note added successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add note');
    }
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return [];
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!deal?.id && isOpen
  });

  const { data: contactDetails, isLoading: isLoadingContact } = useQuery({
    queryKey: ['contact', deal?.Contact_Name?.id],
    queryFn: async () => {
      if (!deal?.Contact_Name?.id) return null;
      const res = await fetch(`/website-demos/excellentzohocrm/api/contacts/${deal.Contact_Name.id}`);
      if (!res.ok) throw new Error('Failed to fetch contact details');
      return res.json();
    },
    enabled: !!deal?.Contact_Name?.id && isOpen
  });


  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals/' + deal.id, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete deal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      onClose();
      toast.success('Deal deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete deal');
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate();
    }
  };

  const createTaskMutation = useMutation({
    mutationFn: async (subject: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/tasks`, {
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
      const res = await fetch(`/website-demos/excellentzohocrm/api/tasks/${taskId}`, {
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
              {isAdmin && onUpdateStage ? (
                <div className="relative">
                  <select
                    value={deal.Stage || ''}
                    onChange={(e) => onUpdateStage(deal.id, e.target.value)}
                    disabled={isUpdatingStage}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm disabled:opacity-50 text-gray-900 bg-white"
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {isUpdatingStage && (
                    <div className="absolute right-6 top-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              ) : (
                <span className="font-medium text-gray-900">{deal.Stage}</span>
              )}
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
            {(deal.Contact_Name?.name || contactDetails) && (
              <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                <span className="block text-gray-500 mb-1">Contact</span>
                {isLoadingContact ? (
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading contact details...
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{deal.Contact_Name?.name}</div>
                    {contactDetails?.Phone && (
                      <div className="text-gray-600">
                        <a href={`tel:${contactDetails.Phone}`} className="hover:text-brand-red transition-colors">
                          {contactDetails.Phone}
                        </a>
                      </div>
                    )}
                    {contactDetails?.Email && (
                      <div className="text-gray-600">
                        <a href={`mailto:${contactDetails.Email}`} className="hover:text-brand-red transition-colors">
                          {contactDetails.Email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
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

          {/* Notes Section */}
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Notes</h4>
            
            {isLoadingNotes ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              </div>
            ) : isErrorNotes ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md mb-4 border border-red-200">
                Failed to load notes: {errorNotes?.message || 'Unknown error'}
              </div>
            ) : Array.isArray(notes) ? (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4">
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-3 relative">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.Note_Content}</p>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500">
                      <span>{new Date(note.Created_Time).toLocaleDateString()} {new Date(note.Created_Time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="font-medium bg-yellow-200 px-1.5 py-0.5 rounded text-yellow-800">{note.Note_Title?.replace('Note from ', '') || 'Me'}</span>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No notes added yet.</p>
                )}
              </div>
            ) : (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md mb-4 border border-red-200">
                Failed to load notes: {notes?.error || JSON.stringify(notes)}
              </div>
            )}

            {isAdmin && (
              <form 
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newNoteContent.trim()) createNoteMutation.mutate(newNoteContent);
                }}
              >
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a new note..."
                  rows={2}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red resize-none"
                />
                <button 
                  type="submit" 
                  disabled={createNoteMutation.isPending || !newNoteContent.trim()}
                  className="self-end inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
                >
                  {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </button>
              </form>
            )}
          </div>

          {isAdmin && (
            <div className="mt-8 pt-4 border-t flex justify-end">
              <button 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>

  );
}
