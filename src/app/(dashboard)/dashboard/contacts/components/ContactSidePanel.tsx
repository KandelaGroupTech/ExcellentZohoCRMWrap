'use client';
import CreateDealModal from '../../../components/CreateDealModal';
import { useQuery } from '@tanstack/react-query';
import { formatPhoneNumber, getConnectionStatusInfo } from '@/lib/utils';

import { X, Edit2, Trash2, Mail, Phone, Building2, User, UserPlus, Clock, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useCallLogger } from '../../../components/CallLoggerProvider';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function parseLastTouch(skypeId?: any) {
  if (!skypeId || typeof skypeId !== 'string') return null;
  const parts = skypeId.split('|').map(s => s.trim());
  if (parts.length < 2) return { type: 'Unknown', date: skypeId, icon: '\uD83D\uDCC5' };
  const type = parts[0];
  const date = parts[1];
  let icon = '\uD83D\uDCC5';
  if (type.toLowerCase().includes('phone')) icon = '\uD83D\uDCDE';
  if (type.toLowerCase().includes('email')) icon = '\u2709\uFE0F';
  if (type.toLowerCase().includes('text')) icon = '\uD83D\uDCAC';
  if (type.toLowerCase().includes('meet')) icon = '\uD83E\uDD1D';
  if (type.toLowerCase().includes('social')) icon = '\uD83D\uDD17';
  return { type, date, icon };
}

interface ContactSidePanelProps {
  contact: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: any) => void;
  onDelete: (id: string) => void;
}

export default function ContactSidePanel({ contact, isOpen, onClose, onEdit, onDelete }: ContactSidePanelProps) {
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['contact-deals', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return [];
      const res = await fetch(`/website-demos/excellentzohocrm/api/contacts/${contact.id}/deals`);
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
    enabled: !!contact?.id && isOpen,
  });

  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const { registerCallClick } = useCallLogger();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isLoggingTouch, setIsLoggingTouch] = useState(false);
  const [touchType, setTouchType] = useState('Email');
  const [touchDate, setTouchDate] = useState(new Date().toISOString().split('T')[0]);

  const logTouchMutation = useMutation({
    mutationFn: async (vars: { type: string; date: string }) => {
      const skypeVal = vars.type + ' | ' + vars.date;
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts/' + contact.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Skype_ID: skypeVal })
      });
      if (!res.ok) throw new Error('Failed to log touch');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Interaction logged!');
      setIsLoggingTouch(false);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast.error('Failed to save log.');
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if ((!contact && !isOpen) || !mounted) return null;

  const fullName = `${contact?.First_Name || ''} ${contact?.Last_Name || ''}`.trim() || 'Unnamed Contact';
  const accountName = typeof contact?.Account_Name === 'object' ? contact?.Account_Name?.name : contact?.Account_Name;
  const lastConnection = parseLastTouch(contact?.Skype_ID);

  const handleSaveToPhone = () => {
    if (!contact) return;
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:${contact.Last_Name || ''};${contact.First_Name || ''};;;\r\nFN:${fullName}\r\nORG:${accountName || ''}\r\nTITLE:${contact.Title || ''}\r\nTEL;TYPE=WORK,VOICE:${contact.Phone || ''}\r\nEMAIL;TYPE=PREF,INTERNET:${contact.Email || ''}\r\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  const handleLogTouchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logTouchMutation.mutate({ type: touchType, date: touchDate });
  };

  return createPortal(
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-gray-50 shadow-2xl flex flex-col h-[100dvh] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">{fullName}</h2>
                <p className="text-sm text-gray-500">{contact?.Title || 'Contact'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {lastConnection && (() => {
            const status = getConnectionStatusInfo(lastConnection.date);
            return (
              <div className="mt-3 flex items-center gap-2 self-start">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full shadow-sm">
                  <span>{lastConnection.icon}</span>
                  <span>Last Touch: {lastConnection.date}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs whitespace-nowrap font-medium shadow-sm ${status.pillClass}`}>
                  {status.text}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Linked Deals Section */}
        <section className="px-5 mb-6">
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
            <p className="text-sm text-gray-500 italic">No deals linked to this contact.</p>
          )}
        </section>

        {/* Action Bar (Edit / Delete) */}
        {isAdmin && (
          <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100">
            <button
              onClick={() => onEdit(contact)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-brand-red bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(contact.id);
              }}
              className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Contact Links (Mobile Friendly) */}
          <div className="flex flex-col gap-3">
            {/* Log a Touch */}
            <button
              onClick={() => setIsLoggingTouch(!isLoggingTouch)}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group text-left w-full"
            >
              <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3 shrink-0">
                <Clock className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Track Interaction</p>
                <p className="text-sm font-medium text-brand-red">Log a Touch</p>
              </div>
            </button>

            {isLoggingTouch && (
              <form onSubmit={handleLogTouchSubmit} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Interaction Type</label>
                  <select
                    value={touchType}
                    onChange={e => setTouchType(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-brand-red focus:border-brand-red border"
                  >
                    <option value="Phone">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="Text">Text Message</option>
                    <option value="Meeting">In-Person Meeting</option>
                    <option value="Social">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={touchDate}
                    onChange={e => setTouchDate(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-brand-red focus:border-brand-red border"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsLoggingTouch(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
                  <button type="submit" disabled={logTouchMutation.isPending} className="px-3 py-1.5 text-xs text-white bg-brand-red hover:bg-brand-red/90 rounded-md font-medium inline-flex items-center">
                    {logTouchMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Save to Phone */}
            <button
              onClick={handleSaveToPhone}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group text-left w-full"
            >
              <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3 shrink-0">
                <UserPlus className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Save to Phone</p>
                <p className="text-sm font-medium text-brand-red">Add Contact</p>
              </div>
            </button>

            {contact?.Phone && (
              <a
                href={`tel:`}
                onClick={() => registerCallClick({ entityId: contact.id, entityType: 'Contacts', name: fullName })}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-brand-red">{formatPhoneNumber(contact.Phone)}</p>
                </div>
              </a>
            )}

            {contact?.Email && (
              <a
                href={`mailto:${contact.Email}`}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3">
                  <Mail className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-brand-red">{contact.Email}</p>
                </div>
              </a>
            )}
          </div>

          {/* Details Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Contact Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">

              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Account / Company
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {accountName || '\u2014'}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  Title
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {contact?.Title || '\u2014'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}


