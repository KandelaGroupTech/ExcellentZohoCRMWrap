'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LogCallModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch contacts for the dropdown
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    enabled: isOpen
  });

  const createMutation = useMutation({
    mutationFn: async (result: string) => {
      if (!selectedContactId) throw new Error('Please select a contact first.');
      
      const d = new Date(); d.setMinutes(d.getMinutes() - 6);
      
      const callData: any = {
        Subject: 'Outbound Call',
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
      onClose();
      setSelectedContactId('');
      setNotes('');
      toast.success('Call logged successfully!');
      // Optionally invalidate contacts if you want recent activity to update
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-50 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Log a Call</h3>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Contact</label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            disabled={isLoadingContacts || createMutation.isPending}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-red focus:border-brand-red bg-white disabled:bg-gray-100"
          >
            <option value="">-- Choose a Contact --</option>
            {contacts.map((c: any) => {
              const name = `${c.First_Name || ''} ${c.Last_Name || ''}`.trim() || 'Unnamed Contact';
              const acct = typeof c.Account_Name === 'object' ? c.Account_Name?.name : c.Account_Name;
              return (
                <option key={c.id} value={c.id}>
                  {name} {acct ? `(${acct})` : ''}
                </option>
              );
            })}
          </select>
          {isLoadingContacts && <p className="text-xs text-gray-500 mt-1">Loading contacts...</p>}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input 
            type="text" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-red focus:border-brand-red bg-white"
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
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
