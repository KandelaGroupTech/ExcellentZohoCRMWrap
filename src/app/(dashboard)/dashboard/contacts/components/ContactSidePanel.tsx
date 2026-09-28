import { X, Edit2, Trash2, Mail, Phone, Building2, User, UserPlus, Clock, MessageSquare, Handshake, Share2, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useCallLogger } from '../../../components/CallLoggerProvider';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { parseLastConnection } from '../../../lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ContactSidePanelProps {
  contact: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: any) => void;
  onDelete: (id: string) => void;
}

export default function ContactSidePanel({ contact, isOpen, onClose, onEdit, onDelete }: ContactSidePanelProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const { registerCallClick } = useCallLogger();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isLoggingTouch, setIsLoggingTouch] = useState(false);
  
  const [touchType, setTouchType] = useState('Email');
  const [touchDate, setTouchDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if ((!contact && !isOpen) || !mounted) return null;

  const fullName = \\ \\.trim() || 'Unnamed Contact';
  const accountName = typeof contact?.Account_Name === 'object' ? contact?.Account_Name?.name : contact?.Account_Name;

  const lastConnection = parseLastConnection(contact?.Skype_ID);

  const handleSaveToPhone = () => {
    if (!contact) return;
    const vcard = \BEGIN:VCARD\r\nVERSION:3.0\r\nN:\;\;;;\r\nFN:\\r\nORG:\\r\nTITLE:\\r\nTEL;TYPE=WORK,VOICE:\\r\nEMAIL;TYPE=PREF,INTERNET:\\r\nEND:VCARD\;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \\.vcf\;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const logTouchMutation = useMutation({
    mutationFn: async () => {
      const payload = { Skype_ID: \\ | \\ };
      const res = await fetch(\/website-demos/excellentzohocrm/api/contacts/\\, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to log touch');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Interaction logged!');
      setIsLoggingTouch(false);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // update local state so UI updates immediately
      if (contact) contact.Skype_ID = \\ | \\;
    },
    onError: () => toast.error('Failed to save log.')
  });

  const handleLogTouchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logTouchMutation.mutate();
  };

  return createPortal(
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div 
        className={\ixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-gray-50 shadow-2xl flex flex-col h-[100dvh] transition-transform duration-300 ease-in-out \\}
      >
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
          
          {lastConnection && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full self-start shadow-sm">
              <span>{lastConnection.icon}</span>
              <span>Last Touch: {lastConnection.date}</span>
            </div>
          )}
        </div>

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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsLoggingTouch(!isLoggingTouch)}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group text-left w-full bg-white shadow-sm"
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
              <form onSubmit={handleLogTouchSubmit} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Interaction Type</label>
                  <select 
                    value={touchType}
                    onChange={e => setTouchType(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-brand-red focus:border-brand-red border"
                  >
                    <option value="Phone">?? Phone Call</option>
                    <option value="Email">?? Email</option>
                    <option value="Text">?? Text Message</option>
                    <option value="Meeting">?? In-Person Meeting</option>
                    <option value="Social">?? Social Media</option>
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
                    {logTouchMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save
                  </button>
                </div>
              </form>
            )}

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
                href={\	el:\\}
                onClick={() => registerCallClick({ entityId: contact.id, entityType: 'Contacts', name: fullName })}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-brand-red">{contact.Phone}</p>
                </div>
              </a>
            )}

            {contact?.Email && (
              <a 
                href={\mailto:\\}
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
                  {accountName || '—'}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  Title
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {contact?.Title || '—'}
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
