'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';

export default function CreateDealModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    Deal_Name: '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        Amount: parseFloat(data.Amount) || 0
      };
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
      onClose();
      setFormData({
        Deal_Name: '',
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
