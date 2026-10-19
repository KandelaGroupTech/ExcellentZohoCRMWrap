'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Search, X, Check, PhoneCall, Mail, MessageSquare, Handshake } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

type ContactMethod = 'Call' | 'Email' | 'Text' | 'Meeting';

interface LogContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContactId?: string;
}

function getAccountName(c: any): string {
  const acct = c?.Account_Name && typeof c.Account_Name === 'object' ? c.Account_Name.name : c?.Account_Name;
  return acct ? String(acct) : '';
}

function getContactName(c: any): string {
  return `${c?.First_Name || ''} ${c?.Last_Name || ''}`.trim() || 'Unnamed Contact';
}

export default function LogContactModal({ isOpen, onClose, defaultContactId }: LogContactModalProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>(defaultContactId || '');
  const [contactSearch, setContactSearch] = useState('');
  const [method, setMethod] = useState<ContactMethod>('Call');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();
  const { user } = useUser();
  const initials = user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  // Fetch contacts for the picker
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    enabled: isOpen
  });

  const sortedContacts = useMemo(() => {
    if (!Array.isArray(contacts)) return [];
    return [...contacts].sort((a: any, b: any) => getContactName(a).localeCompare(getContactName(b)));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return sortedContacts;
    const q = contactSearch.toLowerCase();
    return sortedContacts.filter((c: any) => {
      const name = getContactName(c).toLowerCase();
      const acct = getAccountName(c).toLowerCase();
      const phone = String(c.Phone || '').toLowerCase();
      const email = String(c.Email || '').toLowerCase();
      return name.includes(q) || acct.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [sortedContacts, contactSearch]);

  const selectedContact = useMemo(
    () => (Array.isArray(contacts) ? contacts.find((c: any) => c.id === selectedContactId) : null),
    [contacts, selectedContactId]
  );

  const resetAndClose = () => {
    setSelectedContactId(defaultContactId || '');
    setContactSearch('');
    setMethod('Call');
    setNotes('');
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async ({ methodType, callResult }: { methodType: ContactMethod; callResult?: string }) => {
      if (!selectedContactId) throw new Error('Please select a contact first.');

      if (methodType === 'Call') {
        const d = new Date();
        d.setMinutes(d.getMinutes() - 5);

        const callData: any = {
          initials,
          Subject: `Call from ${initials || 'User'}`,
          Call_Type: 'Outbound',
          Call_Result: callResult || 'Connected',
          Description: notes || '',
          Call_Start_Time: d.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
          Call_Duration: callResult === 'Connected' ? '00:05' : '00:01',
          Outgoing_Call_Status: 'Completed',
          Entity_Type: 'Contacts',
          Who_Id: { id: selectedContactId }
        };

        const res = await fetch('/website-demos/excellentzohocrm/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(callData)
        });
        if (!res.ok) throw new Error('Failed to log call');
        return res.json();
      } else {
        const res = await fetch(`/website-demos/excellentzohocrm/api/contacts/${selectedContactId}/touch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: methodType,
            notes: notes || '',
            initials
          })
        });
        if (!res.ok) throw new Error(`Failed to log ${methodType}`);
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.methodType} logged successfully!`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['all-calls'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      resetAndClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to log contact interaction.');
    }
  });

  const handleLogCall = (result: string) => {
    if (!selectedContactId) {
      toast.error('Please select a contact first.');
      return;
    }
    createMutation.mutate({ methodType: 'Call', callResult: result });
  };

  const handleLogOther = () => {
    if (!selectedContactId) {
      toast.error('Please select a contact first.');
      return;
    }
    createMutation.mutate({ methodType: method });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={resetAndClose} />
      <div className="relative w-full max-w-md bg-gray-50 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Log Contact</h3>
            <p className="text-xs text-gray-500">Record a touchpoint with a client or partner</p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>

          {selectedContact ? (
            /* Selected contact chip */
            <div className="flex items-center justify-between gap-2 border border-brand-red/40 bg-brand-red/5 rounded-md px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getContactName(selectedContact)}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                  {getAccountName(selectedContact) && <span>{getAccountName(selectedContact)}</span>}
                  {selectedContact.Phone && <span>• {selectedContact.Phone}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactId('')}
                disabled={createMutation.isPending}
                className="shrink-0 p-1 text-gray-400 hover:text-brand-red transition-colors"
                title="Change contact"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search by name, company, or phone..."
                  autoFocus
                  disabled={createMutation.isPending}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red bg-white text-gray-900 shadow-sm"
                />
              </div>

              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white divide-y divide-gray-100 custom-scrollbar shadow-inner">
                {isLoadingContacts ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading contacts...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-500">No contacts match &quot;{contactSearch}&quot;</p>
                ) : (
                  filteredContacts.map((c: any) => {
                    const acct = getAccountName(c);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedContactId(c.id)}
                        className="w-full text-left px-3 py-2 hover:bg-brand-red/5 active:bg-brand-red/10 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getContactName(c)}</p>
                          {acct && <p className="text-xs text-gray-500 truncate">{acct}</p>}
                        </div>
                        {selectedContactId === c.id && <Check className="h-4 w-4 text-brand-red shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Method Picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Method</label>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-200/60 rounded-lg">
            <button
              type="button"
              onClick={() => setMethod('Call')}
              disabled={createMutation.isPending}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                method === 'Call'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('Email')}
              disabled={createMutation.isPending}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                method === 'Email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('Text')}
              disabled={createMutation.isPending}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                method === 'Text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('Meeting')}
              disabled={createMutation.isPending}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                method === 'Meeting'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Handshake className="h-3.5 w-3.5" />
              <span>Meeting</span>
            </button>
          </div>
        </div>

        {/* Notes Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900 shadow-sm"
            placeholder={
              method === 'Call'
                ? 'What was discussed on the call?'
                : method === 'Email'
                ? 'Subject or summary of email...'
                : method === 'Text'
                ? 'Summary of SMS or text exchange...'
                : 'Meeting discussion or outcome...'
            }
            disabled={createMutation.isPending}
          />
        </div>

        {/* Actions based on method */}
        {method === 'Call' ? (
          <div className="flex gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => handleLogCall('Connected')}
              disabled={createMutation.isPending || !selectedContactId}
              className="flex-1 bg-brand-red text-white py-2 rounded-md font-medium text-sm hover:bg-brand-red/90 disabled:opacity-50 transition-colors inline-flex justify-center items-center shadow-sm"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connected'}
            </button>
            <button
              type="button"
              onClick={() => handleLogCall('No Answer')}
              disabled={createMutation.isPending || !selectedContactId}
              className="flex-1 bg-white text-gray-800 border border-gray-300 py-2 rounded-md font-medium text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors inline-flex justify-center items-center shadow-sm"
            >
              No Answer
            </button>
          </div>
        ) : (
          <div className="mb-3">
            <button
              type="button"
              onClick={handleLogOther}
              disabled={createMutation.isPending || !selectedContactId}
              className="w-full bg-brand-red text-white py-2 rounded-md font-medium text-sm hover:bg-brand-red/90 disabled:opacity-50 transition-colors inline-flex justify-center items-center gap-2 shadow-sm"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {method === 'Email' && <Mail className="h-4 w-4" />}
                  {method === 'Text' && <MessageSquare className="h-4 w-4" />}
                  {method === 'Meeting' && <Handshake className="h-4 w-4" />}
                  <span>Log {method}</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={resetAndClose}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
