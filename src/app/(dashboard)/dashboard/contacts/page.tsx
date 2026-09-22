'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import DataTable from '../../components/DataTable';
import CreateContactModal from '../../components/CreateContactModal';
import EditModal from '../../components/EditModal';

export default function ContactsPage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update contact');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update contact');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts/' + contactId, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete contact');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete contact');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

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
    {
      key: 'actions',
      label: '',
      render: (row: any) => isAdmin ? (
        <div className="flex items-center gap-2 justify-end">
          <button 
            onClick={() => setEditingRecord(row)}
            className="text-gray-400 hover:text-brand-red transition-colors p-1"
            title="Edit Contact"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)} 
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            title="Delete Contact"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
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
      
      {editingRecord && (
        <EditModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          title="Edit Contact"
          fields={[
            { key: 'First_Name', label: 'First Name' },
            { key: 'Last_Name', label: 'Last Name' },
            { key: 'Email', label: 'Email', type: 'email' },
            { key: 'Phone', label: 'Phone', type: 'tel' },
            { key: 'Title', label: 'Title' },
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
