'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { formatPhoneNumber } from '../../../../../lib/utils';

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // New custom fields
  const [status, setStatus] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocPhone, setPocPhone] = useState('');

  // Sync form when vendor changes
  useEffect(() => {
    if (vendor) {
      setTrade(vendor.Industry || '');
      setPhone(vendor.Phone || '');
      setEmail(vendor.Email || '');
      setNotes(vendor.Description || '');
      setStatus(vendor.Rating || '');
      setPocName(vendor.Ticker_Symbol || '');
      setPocPhone(vendor.Fax || '');
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/vendors/${vendor?.id}`, {
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
    updateMutation.mutate({ 
      Industry: trade, 
      Phone: phone, 
      Email: email, 
      Description: notes,
      Rating: status,
      Ticker_Symbol: pocName,
      Fax: pocPhone
    });
  };

  const cityState = [vendor?.Billing_City, vendor?.Billing_State].filter(Boolean).join(', ');
  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-red focus:border-brand-red disabled:bg-gray-50 disabled:text-gray-400 bg-white";

  if (!vendor && !isOpen) return null;

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
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-xl flex flex-col h-[100dvh] transition-transform duration-300 ${
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

          {/* Read-only: Name & Location */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Vendor Profile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">Name</span>
                <span className="font-medium text-gray-900">{vendor?.Account_Name || '—'}</span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-0.5">City / State</span>
                <span className="font-medium text-gray-900">{cityState || '—'}</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Categorization
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  className={inputClass}
                >
                  <option value="">Uncategorized</option>
                  <option value="Preferred">Preferred</option>
                  <option value="Backup">Backup</option>
                  <option value="Used">Used</option>
                  <option value="Do Not Use">Do Not Use</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade (Industry)</label>
                <input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  placeholder="e.g. Electrical..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main Company Info
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="(555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="contact@..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Point of Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POC Name</label>
                  <input
                    type="text"
                    value={pocName}
                    onChange={(e) => setPocName(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POC Phone</label>
                  <input
                    type="tel"
                    value={pocPhone}
                    onChange={(e) => setPocPhone(formatPhoneNumber(e.target.value))}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="Direct/Cell..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isAdmin || updateMutation.isPending}
                placeholder="Add notes about this vendor..."
                rows={4}
                className={`${inputClass} resize-none`}
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

