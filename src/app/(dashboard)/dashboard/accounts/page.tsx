'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Edit2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import AccountSlideOver from './components/AccountSlideOver';
import EditModal from '../../components/EditModal';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState('');
  
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
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
    { 
      key: 'actions', 
      label: '', 
      render: (row: any) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setEditingRecord(row);
          }}
          className="p-1 text-gray-400 hover:text-brand-red transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) 
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Accounts</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={accounts || []} 
          columns={columns} 
          searchPlaceholder="Search by Account Name..." 
          searchKey="Account_Name"
          onRowClick={(row) => {
            setSelectedAccountId(row.id);
            setSelectedAccountName(row.Account_Name);
          }}
          onEdit={(row) => setEditingRecord(row)}
        />
      </div>

      <AccountSlideOver 
        accountId={selectedAccountId}
        accountName={selectedAccountName}
        isOpen={!!selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
      />

      {editingRecord && (
        <EditModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          title="Edit Account"
          fields={[
            { key: 'Account_Name', label: 'Account Name' },
            { key: 'Industry', label: 'Industry' },
            { key: 'Website', label: 'Website' },
            { key: 'Phone', label: 'Phone' },
          ]}
          initialData={editingRecord}
          onSave={async (data) => {
            await updateMutation.mutateAsync({ id: editingRecord.id, data });
          }}
        />
      )}
    </div>
  );
}
