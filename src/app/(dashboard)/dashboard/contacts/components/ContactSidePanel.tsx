import { X, Edit2, Trash2, Mail, Phone, Building2, User } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useCallLogger } from '../../../components/CallLoggerProvider';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if ((!contact && !isOpen) || !mounted) return null;

  const fullName = `${contact?.First_Name || ''} ${contact?.Last_Name || ''}`.trim() || 'Unnamed Contact';
  const accountName = typeof contact?.Account_Name === 'object' ? contact?.Account_Name?.name : contact?.Account_Name;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
            {contact?.Phone && (
              <a 
                href={`tel:${contact.Phone}`}
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


