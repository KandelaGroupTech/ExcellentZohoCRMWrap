'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import DataTable from '../../components/DataTable';

export default function AccountsPage() {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    }
  });

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
        <p className="text-sm font-medium text-red-800">Error loading accounts.</p>
      </div>
    );
  }

  const columns = [
    { key: 'Account_Name', label: 'Account Name' },
    { key: 'Industry', label: 'Industry' },
    { key: 'Website', label: 'Website' },
    { key: 'Phone', label: 'Phone' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Accounts</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={accounts || []} 
          columns={columns} 
          searchPlaceholder="Search by Account Name..." 
          searchKey="Account_Name" 
        />
      </div>
    </div>
  );
}
