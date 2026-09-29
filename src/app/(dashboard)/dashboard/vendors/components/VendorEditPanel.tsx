'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { formatPhoneNumber } from '../../../../../lib/utils';
import SearchableSelect from '../../../components/SearchableSelect';
import MultiSearchableSelect from '../../../components/MultiSearchableSelect';
import ActivityHistory from '../../../components/ActivityHistory';

interface POC {
  id: string;
  name: string;
  phone: string;
  note: string;
}

interface VendorEditPanelProps {
  vendor: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorEditPanel({ vendor, isOpen, onClose }: VendorEditPanelProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const queryClient = useQueryClient();

  // Fetch all vendors to extract trades
  const { data: allVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/vendors');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    }
  });

  const existingTrades = useMemo(() => {
    if (!allVendors) return [];
    const trades = new Set<string>();
    allVendors.forEach((v: any) => {
      if (v.Industry) trades.add(v.Industry);
    });
    return Array.from(trades).sort();
  }, [allVendors]);

  const [trade, setTrade] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // New custom fields
  const [status, setStatus] = useState('');
  const [pocs, setPocs] = useState<POC[]>([]);
  
  const [accountName, setAccountName] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCode, setBillingCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [website, setWebsite] = useState('');

  // Sync form when vendor changes
  useEffect(() => {
    if (vendor) {
      setTrade(vendor.Industry || '');
      setPhone(vendor.Phone || '');
      setEmail(vendor.Account_Site || '');
      let vendorNote = vendor.Description || '';
      let parsedPocs: POC[] = [];

      if (vendorNote.includes('\n---POC_DATA---\n')) {
        const parts = vendorNote.split('\n---POC_DATA---\n');
        vendorNote = parts[0];
        try {
          parsedPocs = JSON.parse(parts[1]);
        } catch (e) {
          console.error("Failed to parse POC data", e);
        }
      }

      if (parsedPocs.length === 0) {
        if (vendor.Ticker_Symbol || vendor.Fax) {
          parsedPocs.push({
            id: Math.random().toString(),
            name: vendor.Ticker_Symbol || '',
            phone: vendor.Fax || '',
            note: ''
          });
        } else {
          parsedPocs.push({ id: Math.random().toString(), name: '', phone: '', note: '' });
        }
      }

      setNotes(vendorNote);
      setStatus(vendor.Rating || '');
      setPocs(parsedPocs);
      setAccountName(vendor.Account_Name || '');
      setBillingCity(vendor.Billing_City || '');
      setBillingState(vendor.Billing_State || '');
      setBillingStreet(vendor.Billing_Street || '');
      setBillingCode(vendor.Billing_Code || '');
      setBillingCountry(vendor.Billing_Country || '');
      setWebsite(vendor.Website || '');
    }
  }, [vendor]);

  const updatePoc = (index: number, field: keyof POC, value: string) => {
    const newPocs = [...pocs];
    newPocs[index] = { ...newPocs[index], [field]: value };
    setPocs(newPocs);
  };

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
      Account_Site: email, 
      Description: pocs.length > 0 ? notes + '\n---POC_DATA---\n' + JSON.stringify(pocs) : notes,
      Rating: status,
      Ticker_Symbol: pocs[0]?.name || '',
      Fax: pocs[0]?.phone || '',
      Account_Name: accountName,
      Billing_City: billingCity,
      Billing_State: billingState,
      Billing_Street: billingStreet,
      Billing_Code: billingCode,
      Billing_Country: billingCountry,
      Website: website
    });
  };

  const cityState = [vendor?.Billing_City, vendor?.Billing_State].filter(Boolean).join(', ');
  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-red focus:border-brand-red disabled:bg-gray-50 disabled:text-gray-400 bg-white text-gray-900";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if ((!vendor && !isOpen) || !mounted) return null;

  return createPortal(
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
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-gray-50 shadow-xl flex flex-col h-[100dvh] transition-transform duration-300 ${
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

          {/* Editable: Name & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Vendor Profile
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={!isAdmin || updateMutation.isPending}
                className={inputClass}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={billingStreet}
                  onChange={(e) => setBillingStreet(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  placeholder="123 Main St"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postal Code</label>
                  <input
                    type="text"
                    value={billingCode}
                    onChange={(e) => setBillingCode(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
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
                {(!isAdmin || updateMutation.isPending) ? (
                  <input
                    type="text"
                    value={trade}
                    disabled
                    className={inputClass}
                  />
                ) : (
                  <MultiSearchableSelect
                    options={existingTrades}
                    value={trade}
                    onChange={setTrade}
                    placeholder="Select trades..."
                    allowCreate={true}
                  />
                )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Points of Contact
              </h3>
              <div className="space-y-4">
                {pocs.map((poc, idx) => (
                  <div key={poc.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                    {pocs.length > 1 && isAdmin && (
                      <button 
                        onClick={() => setPocs(pocs.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        title="Remove Contact"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={poc.name}
                          onChange={(e) => updatePoc(idx, 'name', e.target.value)}
                          disabled={!isAdmin || updateMutation.isPending}
                          placeholder="John Doe"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={poc.phone}
                          onChange={(e) => updatePoc(idx, 'phone', formatPhoneNumber(e.target.value))}
                          disabled={!isAdmin || updateMutation.isPending}
                          placeholder="(555) 555-5555"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                      <input
                        type="text"
                        value={poc.note}
                        onChange={(e) => updatePoc(idx, 'note', e.target.value)}
                        disabled={!isAdmin || updateMutation.isPending}
                        placeholder="e.g. Works Tuesdays and Thursdays"
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
                
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPocs([...pocs, { id: Math.random().toString(), name: '', phone: '', note: '' }])}
                    className="flex items-center gap-2 text-sm text-brand-red font-medium hover:text-red-700"
                  >
                    <Plus className="h-4 w-4" /> Add Another Contact
                  </button>
                )}
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
    </>,
    document.body
  );
}





