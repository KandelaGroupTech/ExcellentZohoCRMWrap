'use client';

import { useState, useEffect } from 'react';
import { useUrlState } from '@/hooks/useUrlState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Edit2, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { parseLastConnection, formatPhoneNumber, getConnectionStatusInfo } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import DataTable from '../../components/DataTable';
import CreateContactModal from '../../components/CreateContactModal';
import EditModal from '../../components/EditModal';

import ContactSidePanel from './components/ContactSidePanel';

import { ErrorBoundary } from '../../components/ErrorBoundary';
export default function ContactsPage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [sortBy, setSortBy] = useUrlState('sortBy', 'name') as any;
  const [sortDir, setSortDir] = useUrlState('sortDir', 'asc') as any;
  const [accountFilter, setAccountFilter] = useUrlState('account', 'all');
  
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
      // If we are currently viewing the updated contact in the side panel, update its state
      if (selectedContact && editingRecord && selectedContact.id === editingRecord.id) {
        setSelectedContact({ ...selectedContact, ...editingRecord });
      }
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
      setSelectedContact(null);
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
      if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status} ${res.statusText}`);
      return res.json();
    }
  });

  useEffect(() => {
    if (selectedContact && contacts) {
      const freshContact = contacts.find((c: any) => c.id === selectedContact.id);
      if (freshContact && JSON.stringify(freshContact) !== JSON.stringify(selectedContact)) {
        setSelectedContact(freshContact);
      }
    }
  }, [contacts, selectedContact]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 space-y-2">
        <p className="text-sm font-medium text-red-800">Error: {(error as Error)?.message || 'Error loading contacts.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-red-700 underline"
        >
          Tap to retry
        </button>
      </div>
    );
  }

  const uniqueAccounts = Array.from(new Set((contacts || []).map((c: any) => {
    const acc = c.Account_Name;
    return typeof acc === 'object' ? acc?.name : acc;
  }).filter(Boolean))).sort() as string[];

  let processedContacts = [...(contacts || [])];
  
  if (accountFilter !== 'all') {
    processedContacts = processedContacts.filter(c => {
      const acc = c.Account_Name;
      const accName = typeof acc === 'object' ? acc?.name : acc;
      return accName === accountFilter;
    });
  }

  processedContacts.sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.First_Name || ''} ${a.Last_Name || ''}`.trim().toLowerCase();
      const nameB = `${b.First_Name || ''} ${b.Last_Name || ''}`.trim().toLowerCase();
      return sortDir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      const accA = (typeof a.Account_Name === 'object' ? a.Account_Name?.name : a.Account_Name)?.toLowerCase() || '';
      const accB = (typeof b.Account_Name === 'object' ? b.Account_Name?.name : b.Account_Name)?.toLowerCase() || '';
      return sortDir === 'asc' ? accA.localeCompare(accB) : accB.localeCompare(accA);
    }
  });

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => {
        const conn = parseLastConnection(row.Skype_ID);
        const status = getConnectionStatusInfo(conn?.date);
        return (
          <div className="flex justify-center items-center h-full pt-1">
            <div className={`w-3.5 h-3.5 rounded-full ${status.colorClass}`} title={status.text} />
          </div>
        );
      }
    },
    { 
      key: 'First_Name', 
      label: 'Name',
      render: (row: any) => {
        const conn = parseLastConnection(row.Skype_ID);
        const status = getConnectionStatusInfo(conn?.date);
        return (
          <span className="font-medium text-brand-red hover:underline cursor-pointer inline-flex items-center">
            {status.isRed && <AlertTriangle className="h-4 w-4 text-red-600 mr-1.5 flex-shrink-0" />}
            {`${row.First_Name || ''} ${row.Last_Name || ''}`.trim() || '-'}
          </span>
        );
      }
    },
    { key: 'Account_Name', label: 'Accounts' },
    { key: 'Email', label: 'Emails' },
    { key: 'Phone', label: 'Phones', render: (row: any) => formatPhoneNumber(row.Phone) },
    { key: 'Title', label: 'Titles' },
    { 
      key: 'Skype_ID', 
      label: 'Last Connection',
      render: (row: any) => {
        const conn = parseLastConnection(row.Skype_ID);
        const status = getConnectionStatusInfo(conn?.date);
        return (
          <div className="flex items-center gap-2">
            {conn ? (
              <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-200 border border-gray-300 px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-sm">
                <span>{conn.icon}</span>
                <span>{conn.date}</span>
              </span>
            ) : null}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap font-medium ${status.pillClass}`}>
              {status.text}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: '',
      render: (row: any) => isAdmin ? (
        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
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
    <ErrorBoundary>
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

      <div className="mb-4 flex flex-wrap items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter Account:</span>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="text-sm border-gray-300 rounded-md py-1.5 pl-3 pr-8 focus:ring-brand-red focus:border-brand-red border"
          >
            <option value="all">All Accounts</option>
            {uniqueAccounts.map((acc: string) => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md py-1.5 pl-3 pr-8 focus:ring-brand-red focus:border-brand-red border"
          >
            <option value="name">Name</option>
            <option value="account">Account</option>
          </select>
          <button
            onClick={() => setSortDir((d: any) => d === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-md transition-colors border border-gray-200 bg-gray-50 ml-1"
            title={sortDir === 'asc' ? "Sort Descending" : "Sort Ascending"}
          >
            {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={processedContacts} 
          columns={columns} 
          searchPlaceholder="Search by Name..." 
          searchKey={['First_Name', 'Last_Name']} 
          onRowClick={(row) => setSelectedContact(row)}
          onEdit={isAdmin ? (row) => setEditingRecord(row) : undefined}
          onDelete={isAdmin ? (row) => handleDelete(row.id) : undefined}
        />
      </div>
      <div className="mt-2 text-[11px] text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
        STATUS: Green=&lt;30 days, Amber=31-60 days, Red=61+ days; PILLS: Green=Recent, Amber=Approach, Red=Neglected
      </div>
      <CreateContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Side Panel for viewing Contact profile */}
      <ContactSidePanel
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(c) => setEditingRecord(c)}
        onDelete={(id) => handleDelete(id)}
      />

      {/* Edit Modal (opens over the side panel if needed) */}
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
            { key: 'Skype_ID', label: 'Last Connection (e.g. Phone | 2026-10-14)' },
          ]}
          initialData={editingRecord}
          onSave={async (data) => {
            await updateMutation.mutateAsync({ id: editingRecord.id, data });
            // The side panel will read updated data if we successfully mutate, but we handled that in onSuccess
          }}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}








