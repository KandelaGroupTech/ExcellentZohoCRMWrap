'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';

export default function CreateDealModal({ isOpen, onClose, accountId, contactId, defaultName }: { isOpen: boolean, onClose: () => void, accountId?: string, contactId?: string, defaultName?: string }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    Deal_Name: defaultName || '',
    Account_Name: '',
    Contact_Name: '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !accountId
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !contactId
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    const targetAcctId = accountId;
    const targetAcctName = formData.Account_Name.trim().toLowerCase();
    const matchingAcct = targetAcctName ? accounts?.find((a: any) => a.Account_Name?.toLowerCase() === targetAcctName) : null;
    const acctIdToMatch = targetAcctId || matchingAcct?.id;

    return [...contacts].sort((a: any, b: any) => {
      const aMatch = acctIdToMatch ? (a.Account_Name?.id === acctIdToMatch || a.Account_Name?.name?.toLowerCase() === targetAcctName) : false;
      const bMatch = acctIdToMatch ? (b.Account_Name?.id === acctIdToMatch || b.Account_Name?.name?.toLowerCase() === targetAcctName) : false;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [contacts, accounts, accountId, formData.Account_Name]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        ...data,
        Amount: parseFloat(data.Amount) || 0
      };
      if (accountId) {
        payload.Account_Name = accountId;
      } else if (data.Account_Name.trim()) {
        const matchingAccount = accounts?.find((a: any) => a.Account_Name === data.Account_Name.trim());
        if (matchingAccount) {
          payload.Account_Name = matchingAccount.id;
        } else {
          payload.Account_Name = data.Account_Name.trim();
        }
      }
      if (contactId) {
        payload.Contact_Name = { id: contactId };
      } else if (data.Contact_Name.trim()) {
        const matchingContact = contacts?.find((c: any) => 
          `${c.First_Name || ''} ${c.Last_Name || ''}`.trim().toLowerCase() === data.Contact_Name.trim().toLowerCase()
        );
        if (matchingContact) {
          payload.Contact_Name = { id: matchingContact.id };
        } else {
          payload.Contact_Name = data.Contact_Name.trim();
        }
      }
      
      const res = await fetch('/website-demos/excellentzohocrm/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create deal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['account-deals'] });
      queryClient.invalidateQueries({ queryKey: ['contact-deals'] });
      onClose();
      setFormData({
        Deal_Name: defaultName || '',
        Account_Name: '',
        Contact_Name: '',
        Amount: '',
        Stage: 'Qualification',
        Closing_Date: new Date().toISOString().split('T')[0]
      });
      toast.success('Deal created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create deal.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Deal Name</label>
          <input required type="text" value={formData.Deal_Name} onChange={e => setFormData({...formData, Deal_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>

        {!accountId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Account (Optional)</label>
            <input 
              type="text" 
              list="accounts-list"
              value={formData.Account_Name} 
              onChange={e => setFormData({...formData, Account_Name: e.target.value})} 
              placeholder="Select or type a new account..."
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" 
            />
            <datalist id="accounts-list">
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.Account_Name} />
              ))}
            </datalist>
          </div>
        )}
        
        {!contactId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact</label>
            <input 
              type="text" 
              list="contacts-list"
              value={formData.Contact_Name} 
              onChange={e => setFormData({...formData, Contact_Name: e.target.value})} 
              placeholder="Select or type contact name..."
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Select or enter a contact so customer notification alerts upon deal closing are properly addressed.
            </p>
            <datalist id="contacts-list">
              {filteredContacts.map((c: any) => {
                const fullName = `${c.First_Name || ''} ${c.Last_Name || ''}`.trim();
                const acct = typeof c.Account_Name === 'object' ? c.Account_Name?.name : c.Account_Name;
                return (
                  <option key={c.id} value={fullName}>
                    {acct ? `${fullName} (${acct})` : fullName}
                  </option>
                );
              })}
            </datalist>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
            <input required type="number" min="0" step="0.01" value={formData.Amount} onChange={e => setFormData({...formData, Amount: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Closing Date</label>
            <input required type="date" value={formData.Closing_Date} onChange={e => setFormData({...formData, Closing_Date: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stage</label>
          <select value={formData.Stage} onChange={e => setFormData({...formData, Stage: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border">
            <option value="Qualification">Qualification</option>
            <option value="Needs Analysis">Needs Analysis</option>
            <option value="Value Proposition">Value Proposition</option>
            <option value="Identify Decision Makers">Identify Decision Makers</option>
            <option value="Proposal/Price Quote">Proposal/Price Quote</option>
            <option value="Negotiation/Review">Negotiation/Review</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>
        
        {createMutation.isError && <p className="text-red-600 text-sm">{createMutation.error?.message || 'Error creating deal.'}</p>}
        
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-red border border-transparent rounded-md shadow-sm hover:bg-brand-red/90 disabled:opacity-50">
            {createMutation.isPending ? 'Saving...' : 'Save Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
