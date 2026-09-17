'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';

export default function LogCallModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [formData, setFormData] = useState({
    Subject: '',
    Call_Purpose: '',
    Description: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to log call');
      return res.json();
    },
    onSuccess: () => {
      onClose();
      setFormData({ Subject: '', Call_Purpose: '', Description: '' });
      toast.success('Call logged successfully!');
    },
    onError: () => {
      toast.error('Failed to log call.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log a Call">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <input required type="text" value={formData.Subject} onChange={e => setFormData({...formData, Subject: e.target.value})} placeholder="e.g. Initial Outreach" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Call Purpose</label>
          <select value={formData.Call_Purpose} onChange={e => setFormData({...formData, Call_Purpose: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border">
            <option value="">Select Purpose...</option>
            <option value="Prospecting">Prospecting</option>
            <option value="Administrative">Administrative</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Demo">Demo</option>
            <option value="Project">Project</option>
            <option value="Desk">Desk</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description / Notes</label>
          <textarea rows={3} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        
        {createMutation.isError && <p className="text-red-600 text-sm">Error logging call.</p>}
        
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-red border border-transparent rounded-md shadow-sm hover:bg-brand-red/90 disabled:opacity-50">
            {createMutation.isPending ? 'Saving...' : 'Log Call'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
