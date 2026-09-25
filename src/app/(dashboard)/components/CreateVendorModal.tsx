'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { formatPhoneNumber } from '../../../lib/utils';
import { ChevronDown, Search } from 'lucide-react';

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder
}: {
  options: string[],
  value: string,
  onChange: (val: string) => void,
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-8 pr-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red border"
                placeholder="Search trades..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-auto flex-1 p-1">
            <div 
              className={`px-3 py-2 text-sm cursor-pointer rounded-md ${!value ? 'bg-brand-red/10 text-brand-red' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              (Blank)
            </div>
            {filtered.map(opt => (
              <div 
                key={opt}
                className={`px-3 py-2 text-sm cursor-pointer rounded-md ${value === opt ? 'bg-brand-red/10 text-brand-red' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateVendorModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/vendors');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    }
  });

  const tradeOptions = useMemo(() => {
    if (!vendors) return [];
    const set = new Set<string>();
    vendors.forEach((v: any) => {
      if (v.Industry) set.add(v.Industry);
    });
    return Array.from(set).sort();
  }, [vendors]);

  const [formData, setFormData] = useState({
    Vendor_Name: '',
    Phone: '',
    Email: '',
    Website: '',
    Category: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create vendor');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
      setFormData({ Vendor_Name: '', Phone: '', Email: '', Website: '', Category: '' });
      toast.success('Vendor created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create vendor.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Vendor" maxWidth="max-w-lg" overflowVisible={true}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
          <input required type="text" value={formData.Vendor_Name} onChange={e => setFormData({...formData, Vendor_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={formData.Phone} onChange={e => setFormData({...formData, Phone: formatPhoneNumber(e.target.value)})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input type="url" value={formData.Website} onChange={e => setFormData({...formData, Website: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trade (Category)</label>
          <SearchableSelect
            options={tradeOptions}
            value={formData.Category}
            onChange={val => setFormData({...formData, Category: val})}
            placeholder="Select a trade..."
          />
        </div>
        
        {createMutation.isError && <p className="text-red-600 text-sm">{createMutation.error?.message || 'Error creating vendor.'}</p>}
        
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-red border border-transparent rounded-md shadow-sm hover:bg-brand-red/90 disabled:opacity-50">
            {createMutation.isPending ? 'Saving...' : 'Save Vendor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
