'use client';
import { formatPhoneNumber } from '@/lib/utils';


import { X, Loader2, Building, Phone, Globe, DollarSign, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import CreateDealModal from '../../../components/CreateDealModal';
import { useQuery } from '@tanstack/react-query';

interface AccountSlideOverProps {
  accountId: string | null;
  accountName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSlideOver({ accountId, accountName, isOpen, onClose }: AccountSlideOverProps) {
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['account-contacts', accountName],
    queryFn: async () => {
      if (!accountName) return [];
      const res = await fetch(`/website-demos/excellentzohocrm/api/accounts/${encodeURIComponent(accountName)}/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    enabled: !!accountName && isOpen,
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['account-deals', accountName],
    queryFn: async () => {
      if (!accountName) return [];
      const res = await fetch(`/website-demos/excellentzohocrm/api/accounts/${encodeURIComponent(accountName)}/deals`);
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
    enabled: !!accountName && isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-gray-50 shadow-2xl h-[100dvh] flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            {accountName || 'Account Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Linked Deals Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pipeline Deals</h3>
              <button onClick={() => setIsDealModalOpen(true)} className="inline-flex items-center text-xs font-medium text-brand-red hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                <Plus className="h-3 w-3 mr-1" /> New Deal
              </button>
            </div>
            {dealsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            ) : deals?.length > 0 ? (
              <div className="space-y-3">
                {deals.map((deal: any) => (
                  <div key={deal.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.Deal_Name}</p>
                      <p className="text-xs text-gray-500">${deal.Amount?.toLocaleString() || '0'}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {deal.Stage}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No deals linked to this account.</p>
            )}
          </section>

          {/* Linked Contacts Section */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Contacts</h3>
            {contactsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            ) : contacts?.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact: any) => (
                  <div key={contact.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{contact.First_Name} {contact.Last_Name}</p>
                    {contact.Email && <p className="text-xs text-gray-500 mt-1">{contact.Email}</p>}
                    {contact.Phone && <p className="text-xs text-gray-500 mt-1">{formatPhoneNumber(contact.Phone)}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No contacts linked to this account.</p>
            )}
          </section>

        </div>
      </div>
      {accountId && (
        <CreateDealModal 
          isOpen={isDealModalOpen} 
          onClose={() => setIsDealModalOpen(false)} 
          accountId={accountId}
          defaultName={`${accountName} Deal`}
        />
      )}
    </div>
  );
}


