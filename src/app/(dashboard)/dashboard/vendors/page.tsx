'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Edit2, Search, ChevronUp, ChevronDown, ChevronsUpDown, Phone, Mail, Plus } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import VendorEditPanel from './components/VendorEditPanel';
import SwipeableCard from '../../components/SwipeableCard';
import { useCallLogger } from '../../components/CallLoggerProvider';
import CreateVendorModal from '../../components/CreateVendorModal';

function MultiSelectDropdown({ 
  options, 
  selected, 
  onChange, 
  placeholder 
}: { 
  options: string[], 
  selected: string[], 
  onChange: (s: string[]) => void, 
  placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(o => o !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate mr-2 text-gray-700 select-none">
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map(opt => (
            <div 
              key={opt}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(opt);
              }}
            >
              <input 
                type="checkbox"
                checked={selected.includes(opt)}
                readOnly
                className="mr-2 rounded border-gray-300 text-brand-red focus:ring-brand-red pointer-events-none"
              />
              <span className="text-gray-700 select-none pointer-events-none">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Preferred':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Preferred</span>;
    case 'Backup':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Backup</span>;
    case 'Used':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Used</span>;
    case 'Do Not Use':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Do Not Use</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">Uncategorized</span>;
  }
};

export default function VendorsPage() {
  const { registerCallClick } = useCallLogger();
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState<'Account_Name' | 'Industry' | 'Rating' | null>(null);
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

  const tradeOptions = useMemo(() => {
    if (!vendors) return [];
    const set = new Set<string>();
    vendors.forEach((v: any) => {
      if (v.Industry) set.add(v.Industry);
    });
    return Array.from(set).sort();
  }, [vendors]);

  const handleSort = (key: 'Account_Name' | 'Industry' | 'Rating') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!vendors) return [];
    const result = vendors.filter((v: any) => {
      const nameMatch = !search || (v.Account_Name || '').toLowerCase().includes(search.toLowerCase());
      const tradeMatch = !tradeFilter || v.Industry === tradeFilter;
      const statusMatch = statusFilter.length === 0 || statusFilter.some(filter => {
        return filter === 'Uncategorized' ? (!v.Rating || v.Rating === '') : v.Rating === filter;
      });
      return nameMatch && tradeMatch && statusMatch;
    });

    if (sortKey) {
      result.sort((a: any, b: any) => {
        const aVal = (a[sortKey] || '').toLowerCase();
        const bVal = (b[sortKey] || '').toLowerCase();
        
        // Custom sort order for Status to keep Preferred at top when asc
        if (sortKey === 'Rating') {
          const statusOrder: Record<string, number> = { 'preferred': 1, 'backup': 2, 'used': 3, 'do not use': 4, '': 5 };
          const aRank = statusOrder[aVal] || 5;
          const bRank = statusOrder[bVal] || 5;
          if (aRank < bRank) return sortDir === 'asc' ? -1 : 1;
          if (aRank > bRank) return sortDir === 'asc' ? 1 : -1;
          return 0;
        }

        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vendors, search, tradeFilter, statusFilter, sortKey, sortDir]);

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Vendors</h2>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90">
            <Plus className="h-4 w-4 mr-2" />
            New Vendor
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/90 backdrop-blur-md rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
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

          <div className="w-full sm:w-48">
            <MultiSelectDropdown
              options={['Preferred', 'Backup', 'Used', 'Do Not Use', 'Uncategorized']}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
            />
          </div>

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

        <div className="flex-1 overflow-auto">
          {/* Desktop Table */}
          <div className="hidden md:block min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('Account_Name')} className="flex items-center gap-1 group hover:text-brand-red transition-colors">
                      Vendor Name
                      <span className="text-gray-400 group-hover:text-brand-red">
                        {sortKey === 'Account_Name' ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('Rating')} className="flex items-center gap-1 group hover:text-brand-red transition-colors">
                      Status
                      <span className="text-gray-400 group-hover:text-brand-red">
                        {sortKey === 'Rating' ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('Industry')} className="flex items-center gap-1 group hover:text-brand-red transition-colors">
                      Trade
                      <span className="text-gray-400 group-hover:text-brand-red">
                        {sortKey === 'Industry' ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City / State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-gray-200">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(vendor.Rating)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vendor.Industry || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vendor.Ticker_Symbol ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{vendor.Ticker_Symbol}</span>
                              {vendor.Fax && (
                                <a 
                                  href={`tel:${vendor.Fax}`} 
                                  className="text-gray-500 hover:text-brand-red text-xs mt-0.5" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    registerCallClick({ entityId: vendor.id, entityType: 'Accounts', name: vendor.Account_Name });
                                  }}
                                >
                                  {vendor.Fax}
                                </a>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cityState || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vendor.Phone ? (
                            <a
                              href={`tel:${vendor.Phone}`}
                              className="text-brand-red hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                registerCallClick({ entityId: vendor.id, entityType: 'Accounts', name: vendor.Account_Name });
                              }}
                            >
                              {vendor.Phone}
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
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden">
            {filtered.length > 0 ? (
              filtered.map((vendor: any, idx: number) => {
                const cityState = [vendor.Billing_City, vendor.Billing_State].filter(Boolean).join(', ');
                return (
                  <SwipeableCard
                    key={vendor.id || idx}
                    onEdit={() => setEditingVendor(vendor)}
                    onClick={() => setEditingVendor(vendor)}
                  >
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-brand-red text-base">{vendor.Account_Name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{vendor.Industry || 'No Trade'}</p>
                        </div>
                        <div>{getStatusBadge(vendor.Rating)}</div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                        {vendor.Phone && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Main Phone</span>
                            <a 
                              href={`tel:${vendor.Phone}`} 
                              className="text-brand-red font-medium" 
                              onClick={e => {
                                e.stopPropagation();
                                registerCallClick({ entityId: vendor.id, entityType: 'Accounts', name: vendor.Account_Name });
                              }}
                            >
                              {vendor.Phone}
                            </a>
                          </div>
                        )}
                        {vendor.Ticker_Symbol && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">POC: {vendor.Ticker_Symbol}</span>
                            {vendor.Fax && (
                              <a 
                                href={`tel:${vendor.Fax}`} 
                                className="text-gray-700" 
                                onClick={e => {
                                  e.stopPropagation();
                                  registerCallClick({ entityId: vendor.id, entityType: 'Accounts', name: vendor.Account_Name });
                                }}
                              >
                                {vendor.Fax}
                              </a>
                            )}
                          </div>
                        )}
                        {cityState && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-xs text-gray-500">Location</span>
                            <span className="text-gray-900">{cityState}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </SwipeableCard>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                No vendors found.
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateVendorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <VendorEditPanel
        vendor={editingVendor}
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
      />
    </div>
  );
}


