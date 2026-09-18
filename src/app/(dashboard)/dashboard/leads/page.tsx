'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import DataTable from '../../components/DataTable';
import CreateLeadModal from '../../components/CreateLeadModal';

export default function LeadsPage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/leads/' + leadId, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete lead');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete lead');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
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
        <p className="text-sm font-medium text-red-800">Error loading leads.</p>
      </div>
    );
  }

  const columns = [
    { 
      key: 'First_Name', 
      label: 'Name',
      render: (row: any) => `${row.First_Name || ''} ${row.Last_Name || ''}`.trim() || '-'
    },
    { key: 'Company', label: 'Company' },
    { key: 'Email', label: 'Email' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Lead_Status', label: 'Status' },
    { key: 'Lead_Source', label: 'Source' },
    {
      key: 'actions',
      label: '',
      render: (row: any) => isAdmin ? (
        <button 
          onClick={() => handleDelete(row.id)} 
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Delete Lead"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Leads</h2>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90">
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={leads || []} 
          columns={columns} 
          searchPlaceholder="Search by Company..." 
          searchKey="Company" 
        />
      </div>
      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
