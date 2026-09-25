'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface VendorEditPanelProps {
  vendor: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorEditPanel({ vendor, isOpen, onClose }: VendorEditPanelProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const queryClient = useQueryClient();

  const [trade, setTrade] = useState('');
  const [notes, setNotes] = useState('');

  // Sync form when vendor changes
  useEffect(() => {
    if (vendor) {
      setTrade(vendor.Industry || '');
      setNotes(vendor.Description || '');
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: async (data: { Industry: string; Description: string }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update vendor');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update vendor');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ Industry: trade, Description: notes });
  };

  const cityState = [vendor?.Billing_City, vendor?.Billing_State].filter(Boolean).join(', ');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {vendor?.Account_Name || 'Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Read-only fields */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Vendor Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">Name</span>
                <span className="font-medium text-gray-900">{vendor?.Account_Name || '—'}</span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">City / State</span>
                <span className="font-medium text-gray-900">{cityState || '—'}</span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">Phone</span>
                {vendor?.Phone ? (
                  <a href={`tel:${vendor.Phone}`} className="font-medium text-brand-red hover:underline">
                    {vendor.Phone}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">Email</span>
                {vendor?.Email ? (
                  <a href={`mailto:${vendor.Email}`} className="font-medium text-brand-red hover:underline truncate block">
                    {vendor.Email}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Editable Fields
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade (Industry)
              </label>
              <input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                disabled={!isAdmin || updateMutation.isPending}
                placeholder="e.g. Electrical, Plumbing..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-red focus:border-brand-red disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isAdmin || updateMutation.isPending}
                placeholder="Add notes about this vendor..."
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-red focus:border-brand-red disabled:bg-gray-50 disabled:text-gray-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-red hover:bg-brand-red/90 rounded-md disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
