'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Search, X, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

function getAccountName(c: any): string {
  const acct = c?.Account_Name && typeof c.Account_Name === 'object' ? c.Account_Name.name : c?.Account_Name;
  return acct ? String(acct) : '';
}

function getContactName(c: any): string {
  return `${c?.First_Name || ''} ${c?.Last_Name || ''}`.trim() || 'Unnamed Contact';
}

export default function LogCallModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contactSearch, setContactSearch] = useState('');
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
    setSelectedContactId('');
    setContactSearch('');
    setNotes('');
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async (result: string) => {
      if (!selectedContactId) throw new Error('Please select a contact first.');
      
      const d = new Date(); d.setMinutes(d.getMinutes() - 6);
      
      const callData: any = {
        initials,
        Subject: `Call from ${initials || 'User'}`,
        Call_Type: 'Outbound',
        Call_Result: result,
        Description: notes || '',
        Call_Start_Time: d.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
        Call_Duration: '00:05',
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
    },
    onSuccess: () => {
      toast.success('Call logged successfully!');
      // Optionally invalidate contacts if you want recent activity to update
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      resetAndClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to log call.');
    }
  });

  const handleLogCall = (result: string) => {
    if (!selectedContactId) {
      toast.error('Please select a contact.');
      return;
    }
    createMutation.mutate(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={resetAndClose} />
      <div className="relative w-full max-w-sm bg-gray-50 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Log a Call</h3>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>

          {selectedContact ? (
            /* Selected contact chip */
            <div className="flex items-center justify-between gap-2 border border-brand-red/40 bg-brand-red/5 rounded-md px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getContactName(selectedContact)}</p>
                {getAccountName(selectedContact) && (
                  <p className="text-xs text-gray-500 truncate">{getAccountName(selectedContact)}</p>
                )}
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
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                />
              </div>

              <div className="mt-2 max-h-56 overflow-y-auto border border-gray-200 rounded-md bg-white divide-y divide-gray-100 custom-scrollbar">
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

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input 
            type="text" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
            placeholder="What was discussed?"
            disabled={createMutation.isPending}
          />
        </div>
        
        <div className="flex gap-3 mb-4">
          <button 
            type="button"
            onClick={() => handleLogCall('Connected')}
            disabled={createMutation.isPending || !selectedContactId}
            className="flex-1 bg-brand-red text-white py-2 rounded-md font-medium text-sm hover:bg-brand-red/90 disabled:opacity-50 transition-colors inline-flex justify-center items-center"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connected'}
          </button>
          <button 
            type="button"
            onClick={() => handleLogCall('No Answer')}
            disabled={createMutation.isPending || !selectedContactId}
            className="flex-1 bg-gray-100 text-gray-800 border border-gray-200 py-2 rounded-md font-medium text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors inline-flex justify-center items-center"
          >
            No Answer
          </button>
        </div>
        
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
