'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Edit2, Search } from 'lucide-react';
import VendorEditPanel from './components/VendorEditPanel';

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [editingVendor, setEditingVendor] = useState<any | null>(null);

  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/vendors');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch vendors');
      }
      return res.json();
    },
  });

  // Build distinct trade options from returned data
  const tradeOptions = useMemo(() => {
    if (!vendors) return [];
    const set = new Set<string>();
    vendors.forEach((v: any) => {
      if (v.Industry) set.add(v.Industry);
    });
    return Array.from(set).sort();
  }, [vendors]);

  // Apply search + trade filter
  const filtered = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter((v: any) => {
      const nameMatch = !search || (v.Account_Name || '').toLowerCase().includes(search.toLowerCase());
      const tradeMatch = !tradeFilter || v.Industry === tradeFilter;
      return nameMatch && tradeMatch;
    });
  }, [vendors, search, tradeFilter]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">
          Error loading vendors: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Vendors</h2>
      </div>

      {/* Table card */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-lg shadow border border-gray-200">
        {/* Toolbar: search + trade filter */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-red focus:border-brand-red sm:text-sm"
              placeholder="Search by Vendor Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Trade filter */}
          <div className="w-full sm:w-48">
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
            >
              <option value="">All Trades</option>
              {tradeOptions.map((trade) => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City / State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((vendor: any, idx: number) => {
                  const cityState = [vendor.Billing_City, vendor.Billing_State].filter(Boolean).join(', ');
                  return (
                    <tr key={vendor.id || idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vendor.Account_Name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.Industry || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cityState || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.Phone ? (
                          <a href={`tel:${vendor.Phone}`} className="text-brand-red hover:underline">
                            {vendor.Phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.Email ? (
                          <a href={`mailto:${vendor.Email}`} className="text-brand-red hover:underline">
                            {vendor.Email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <span className="line-clamp-2">{vendor.Description || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => setEditingVendor(vendor)}
                          className="p-1 text-gray-400 hover:text-brand-red transition-colors"
                          title="Edit vendor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit slide-out panel */}
      <VendorEditPanel
        vendor={editingVendor}
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
      />
    </div>
  );
}
