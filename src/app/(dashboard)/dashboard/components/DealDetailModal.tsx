'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, CheckCircle2, Circle, Trash2, Pencil, Check, X, Paperclip, FileText, ExternalLink } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { useCallLogger } from '../../components/CallLoggerProvider';

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
  const [newTaskDate, setNewTaskDate] = useState('');
  const { user } = useUser();
  const { registerCallClick } = useCallLogger();
  
  const renderSubject = (subject: string) => {
    const match = subject.match(/ - ([A-Z]{2})$/);
    if (match) {
      return { text: subject.replace(match[0], ''), initials: match[1] };
    }
    return { text: subject, initials: null };
  };

  const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : '';
  const [newNoteContent, setNewNoteContent] = useState('');
  const [logAsInitials, setLogAsInitials] = useState('');

  React.useEffect(() => { if (initials && !logAsInitials) setLogAsInitials(initials); }, [initials]);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [editingAccount, setEditingAccount] = useState(false);
  const [editAccountValue, setEditAccountValue] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [editContactValue, setEditContactValue] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadingFile(true);
      uploadAttachmentMutation.mutate(e.dataTransfer.files[0]);
    }
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: attachmentsData, isLoading: isLoadingAttachments, isError: isErrorAttachments, error: errorAttachments } = useQuery({
    queryKey: ['attachments', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return { data: [] };
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments`);
      if (!res.ok) throw new Error('Failed to fetch attachments');
      return res.json();
    },
    enabled: isOpen && !!deal
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload attachment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', deal?.id] });
      toast.success('File attached successfully');
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload attachment');
      setUploadingFile(false);
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete attachment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', deal?.id] });
      toast.success('Attachment deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete attachment');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingFile(true);
      uploadAttachmentMutation.mutate(e.target.files[0]);
    }
  };

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
    mutationFn: async ({ content, logAs }: { content: string, logAs: string }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, initials: logAs })
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

  const updateContactMutation = useMutation({
    mutationFn: async (contactIdentifier: string) => {
      let finalContactValue = contactIdentifier;
      const matchingContact = contacts?.find((c: any) => `${c.First_Name || ''} ${c.Last_Name || ''}`.trim() === contactIdentifier);
      if (matchingContact) {
        finalContactValue = matchingContact.id;
      }
      
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Contact_Name: finalContactValue })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update contact');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingContact(false);
      toast.success('Contact updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update contact');
    }
  });

  const handleContactSave = () => {
    if (!editContactValue.trim()) return;
    updateContactMutation.mutate(editContactValue.trim());
  };

  const updateAccountMutation = useMutation({
    mutationFn: async (accountIdentifier: string) => {
      let finalAccountValue = accountIdentifier;
      const matchingAccount = accounts?.find((a: any) => a.Account_Name === accountIdentifier);
      if (matchingAccount) {
        finalAccountValue = matchingAccount.id;
      }
      
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Account_Name: finalAccountValue })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingAccount(false);
      toast.success('Account updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update account');
    }
  });

  const handleAccountSave = () => {
    if (!editAccountValue.trim()) return;
    updateAccountMutation.mutate(editAccountValue.trim());
  };

  const updateAmountMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Amount: amount })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update amount');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingAmount(false);
      toast.success('Amount updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update amount');
    }
  });

  const handleAmountSave = () => {
    const parsed = parseFloat(editAmountValue.replace(/[^0-9.]/g, ''));
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    updateAmountMutation.mutate(parsed);
  };

  
  let currentOwner = null;
  if (deal?.Description) {
    const match = deal.Description.match(/---DEAL_META---\n(.*)
    if (match) {
      try { currentOwner = JSON.parse(match[1]).owner; } catch(e) {}
    }
  }

  const claimDealMutation = useMutation({
    mutationFn: async (newOwner: string | null) => {
      let baseDesc = (deal.Description || '').replace(/\n---DEAL_META---\n(.*)
      let newDesc = baseDesc;
      if (newOwner) {
        newDesc = baseDesc + '\n---DEAL_META---\n' + JSON.stringify({ owner: newOwner });
      }
      const res = await fetch('/website-demos/excellentzohocrm/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, description: newDesc })
      });
      if (!res.ok) throw new Error('Failed to update deal owner');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: () => toast.error('Failed to update project owner')
  });

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Deal_Name: name })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update deal name');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingName(false);
      toast.success('Deal name updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update deal name');
    }
  });

  const handleNameSave = () => {
    if (!editNameValue.trim()) {
      toast.error('Please enter a deal name');
      return;
    }
    updateNameMutation.mutate(editNameValue.trim());
  };

  const createTaskMutation = useMutation({
    mutationFn: async ({ subject, dueDate }: { subject: string, dueDate: string }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Subject: subject, Due_Date: dueDate })
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', deal?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      setNewTaskSubject('');
      setNewTaskDate('');
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
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  if (!deal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingName ? 'Edit Deal' : deal.Deal_Name}>
      <div className="space-y-6">
        {/* Deal Info */}
        <div className="bg-gray-50 p-4 rounded-md">
          {/* Editable Deal Name */}
          <div className="mb-4">
            <span className="block text-gray-500 text-sm mb-1">Deal Name</span>
            {isAdmin && editingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border border-brand-red rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red bg-white text-gray-900"
                />
                <button
                  onClick={handleNameSave}
                  disabled={updateNameMutation.isPending}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  title="Save"
                >
                  {updateNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{deal.Deal_Name}</span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditNameValue(deal.Deal_Name || '');
                      setEditingName(true);
                    }}
                    className="p-0.5 text-gray-400 hover:text-brand-red transition-colors"
                    title="Edit deal name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
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
              {isAdmin && editingAmount ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmountValue}
                    onChange={(e) => setEditAmountValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAmountSave();
                      if (e.key === 'Escape') setEditingAmount(false);
                    }}
                    autoFocus
                    className="w-28 px-2 py-1 text-sm border border-brand-red rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                  <button
                    onClick={handleAmountSave}
                    disabled={updateAmountMutation.isPending}
                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                    title="Save"
                  >
                    {updateAmountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditingAmount(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.Amount || 0)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditAmountValue(String(deal.Amount || 0));
                        setEditingAmount(true);
                      }}
                      className="p-0.5 text-gray-400 hover:text-brand-red transition-colors"
                      title="Edit amount"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {(deal.Account_Name?.name || isAdmin) && (
              <div className="col-span-2">
                <span className="block text-gray-500 mb-1">Account</span>
                {isAdmin && editingAccount ? (
                  <div className="flex items-center gap-1 max-w-sm">
                    <input
                      type="text"
                      list="accounts-edit-list"
                      value={editAccountValue}
                      onChange={(e) => setEditAccountValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAccountSave();
                        if (e.key === 'Escape') setEditingAccount(false);
                      }}
                      placeholder="Select or type account..."
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-brand-red rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                    <datalist id="accounts-edit-list">
                      {accounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.Account_Name} />
                      ))}
                    </datalist>
                    <button
                      onClick={handleAccountSave}
                      disabled={updateAccountMutation.isPending || !editAccountValue.trim()}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      title="Save"
                    >
                      {updateAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingAccount(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {deal.Account_Name?.name || <span className="text-gray-400 italic">No account linked</span>}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditAccountValue(deal.Account_Name?.name || '');
                          setEditingAccount(true);
                        }}
                        className="p-0.5 text-gray-400 hover:text-brand-red transition-colors"
                        title="Edit account"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
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
                        <a 
                          href={`tel:${contactDetails.Phone}`} 
                          onClick={() => registerCallClick({ entityId: contactDetails.id, entityType: 'Contacts', name: deal.Contact_Name?.name })}
                          className="hover:text-brand-red transition-colors"
                        >
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
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500 font-medium">Project Owner</span>
            {currentOwner ? (
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                  {currentOwner}
                </span>
                <button 
                  onClick={() => claimDealMutation.mutate(null)}
                  disabled={claimDealMutation.isPending}
                  className="text-[10px] text-gray-400 hover:text-red-500 underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                onClick={() => claimDealMutation.mutate(initials)}
                disabled={claimDealMutation.isPending || !initials}
                className="text-xs font-semibold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded transition-colors"
              >
                + Claim Project
              </button>
            )}
          </div>
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
              className="mt-4 flex flex-col sm:flex-row gap-2" 
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskSubject.trim()) {
                  const subjectWithInitials = logAsInitials ? `${newTaskSubject.trim()} - ${logAsInitials}` : newTaskSubject.trim();
                  createTaskMutation.mutate({ subject: subjectWithInitials, dueDate: newTaskDate });
                }
              }}
            >
              <input 
                  type="text" 
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="Add a new follow-up..." 
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="block w-full sm:w-36 px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                  />
                  <button 
                    type="submit" 
                    disabled={createTaskMutation.isPending || !newTaskSubject.trim()}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 h-[38px] w-[38px] shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
            </form>
          )}

          {/* Attachments Section */}
            <div 
              className={`mt-8 p-3 -mx-3 rounded-xl border-2 transition-colors ${isDragging ? 'border-brand-red bg-red-50/50 border-dashed' : 'border-transparent bg-transparent'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Paperclip className="h-4 w-4 mr-2" /> Attachments / Proposals
              </h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="text-sm text-brand-red hover:text-brand-red/80 font-medium flex items-center disabled:opacity-50"
              >
                {uploadingFile ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</>
                ) : (
                  <>+ Add File</>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>
            
            {isLoadingAttachments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : isErrorAttachments ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md mb-4 border border-red-200">
                Failed to load attachments: {errorAttachments?.message || 'Unknown error'}
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {attachmentsData?.data && attachmentsData.data.length > 0 ? (
                  attachmentsData.data.map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between p-2 hover:bg-gray-50 border border-gray-100 rounded-md group">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">{att.File_Name}</span>
                        <span className="text-xs text-gray-400">({Math.round((att.Size || 0) / 1024)} KB)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments/${att.id}`}
                          
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Download"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this attachment?')) {
                                deleteAttachmentMutation.mutate(att.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                    No files attached yet. Drop a proposal here or click Add File.
                  </p>
                )}
              </div>
            )}
          </div>

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
                  if (newNoteContent.trim()) createNoteMutation.mutate({ content: newNoteContent, logAs: logAsInitials });
                }}
              >
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a new note..."
                  rows={2}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red resize-none bg-white text-gray-900"
                />
                <div className="flex items-center justify-end gap-3 w-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md shrink-0">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Log as:</span>
                    <input 
                      type="text" 
                      maxLength={3}
                      value={logAsInitials}
                      onChange={(e) => setLogAsInitials(e.target.value.toUpperCase())}
                      className="w-8 bg-transparent text-xs font-bold text-gray-900 border-none p-0 focus:ring-0 text-center"
                      placeholder="??"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={createNoteMutation.isPending || !newNoteContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
                  >
                    {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
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


