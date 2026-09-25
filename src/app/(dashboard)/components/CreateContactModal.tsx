'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { formatPhoneNumber } from '../../../lib/utils';
import SearchableSelect from './SearchableSelect';

export default function CreateContactModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Account_Name: '',
    Email: '',
    Phone: ''
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    }
  });

  const existingAccountNames = useMemo(() => {
    if (!accounts) return [];
    const names = new Set<string>();
    accounts.forEach((a: any) => {
      if (a.Account_Name) names.add(a.Account_Name);
    });
    return Array.from(names).sort();
  }, [accounts]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
      setFormData({ First_Name: '', Last_Name: '', Account_Name: '', Email: '', Phone: '' });
      toast.success('Contact created successfully!');
    },
    onError: () => {
      toast.error('Failed to create contact.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Contact" overflowVisible={true}>
      <form onSubmit={handleSubmit} className="space-y-4" style={{ overflow: 'visible' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input required type="text" value={formData.First_Name} onChange={e => setFormData({...formData, First_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input required type="text" value={formData.Last_Name} onChange={e => setFormData({...formData, Last_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Name (Optional)</label>
          <SearchableSelect 
            options={existingAccountNames} 
            value={formData.Account_Name} 
            onChange={(val) => setFormData({ ...formData, Account_Name: val })} 
            placeholder="Select or enter account..."
            allowCreate={true}
            searchPlaceholder="Search accounts..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input type="tel" value={formData.Phone} onChange={e => setFormData({...formData, Phone: formatPhoneNumber(e.target.value)})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        
        {createMutation.isError && <p className="text-red-600 text-sm">Error creating contact.</p>}
        
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-red border border-transparent rounded-md shadow-sm hover:bg-brand-red/90 disabled:opacity-50">
            {createMutation.isPending ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
