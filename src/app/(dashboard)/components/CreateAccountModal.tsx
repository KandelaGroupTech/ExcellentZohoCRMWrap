'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { formatPhoneNumber } from '../../../lib/utils';

export default function CreateAccountModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    Account_Name: '',
    Industry: '',
    Website: '',
    Phone: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
      setFormData({ Account_Name: '', Industry: '', Website: '', Phone: '' });
      toast.success('Account created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create account.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Name</label>
          <input required type="text" value={formData.Account_Name} onChange={e => setFormData({...formData, Account_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Industry</label>
          <input type="text" value={formData.Industry} onChange={e => setFormData({...formData, Industry: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input type="url" value={formData.Website} onChange={e => setFormData({...formData, Website: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input type="tel" value={formData.Phone} onChange={e => setFormData({...formData, Phone: formatPhoneNumber(e.target.value)})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        
        {createMutation.isError && <p className="text-red-600 text-sm">{createMutation.error?.message || 'Error creating account.'}</p>}
        
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-red border border-transparent rounded-md shadow-sm hover:bg-brand-red/90 disabled:opacity-50">
            {createMutation.isPending ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
