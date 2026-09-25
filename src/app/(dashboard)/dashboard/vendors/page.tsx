'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Edit2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import VendorEditPanel from './components/VendorEditPanel';

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState<'Account_Name' | 'Industry' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  // Toggle sort: same column flips direction; new column resets to asc
  const handleSort = (key: 'Account_Name' | 'Industry') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Apply search + trade filter + sort
  const filtered = useMemo(() => {
    if (!vendors) return [];
    const result = vendors.filter((v: any) => {
      const nameMatch = !search || (v.Account_Name || '').toLowerCase().includes(search.toLowerCase());
      const tradeMatch = !tradeFilter || v.Industry === tradeFilter;
      return nameMatch && tradeMatch;
    });

    if (sortKey) {
      result.sort((a: any, b: any) => {
        const aVal = (a[sortKey] || '').toLowerCase();
        const bVal = (b[sortKey] || '').toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vendors, search, tradeFilter, sortKey, sortDir]);

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('Account_Name')}
                    className="flex items-center gap-1 group hover:text-brand-red transition-colors"
                  >
                    Vendor Name
                    <span className="text-gray-400 group-hover:text-brand-red">
                      {sortKey === 'Account_Name'
                        ? sortDir === 'asc'
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronsUpDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('Industry')}
                    className="flex items-center gap-1 group hover:text-brand-red transition-colors"
                  >
                    Trade
                    <span className="text-gray-400 group-hover:text-brand-red">
                      {sortKey === 'Industry'
                        ? sortDir === 'asc'
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronsUpDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </th>
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
                    <tr
                      key={vendor.id || idx}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setEditingVendor(vendor)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-red hover:underline">
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
                          <a
                            href={`tel:${vendor.Phone}`}
                            className="text-brand-red hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {vendor.Phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.Email ? (
                          <a
                            href={`mailto:${vendor.Email}`}
                            className="text-brand-red hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {vendor.Email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <span className="line-clamp-2">{vendor.Description || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVendor(vendor);
                          }}
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
