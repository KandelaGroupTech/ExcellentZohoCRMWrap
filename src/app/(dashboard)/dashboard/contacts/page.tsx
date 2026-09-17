'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import DataTable from '../../components/DataTable';
import CreateContactModal from '../../components/CreateContactModal';

export default function ContactsPage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
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
        <p className="text-sm font-medium text-red-800">Error loading contacts.</p>
      </div>
    );
  }

  const columns = [
    { 
      key: 'First_Name', 
      label: 'Name',
      render: (row: any) => `${row.First_Name || ''} ${row.Last_Name || ''}`.trim() || '-'
    },
    { key: 'Account_Name', label: 'Account' },
    { key: 'Email', label: 'Email' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Title', label: 'Title' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Contacts</h2>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90">
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={contacts || []} 
          columns={columns} 
          searchPlaceholder="Search by Last Name..." 
          searchKey="Last_Name" 
        />
      </div>
      <CreateContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
