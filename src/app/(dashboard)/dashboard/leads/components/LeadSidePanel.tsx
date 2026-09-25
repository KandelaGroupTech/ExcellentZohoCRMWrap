import { X, Edit2, Trash2, Mail, Phone, Building2, User, Target } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface LeadSidePanelProps {
  lead: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: any) => void;
  onDelete: (id: string) => void;
}

export default function LeadSidePanel({ lead, isOpen, onClose, onEdit, onDelete }: LeadSidePanelProps) {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';

  if (!lead && !isOpen) return null;

  const fullName = `${lead?.First_Name || ''} ${lead?.Last_Name || ''}`.trim() || 'Unnamed Lead';

  return (
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
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-2xl flex flex-col h-[100dvh] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">{fullName}</h2>
              <p className="text-sm text-gray-500">{lead?.Company || 'No Company'}</p>
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
          <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => onEdit(lead)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-brand-red bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Lead
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(lead.id);
              }}
              className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          
          {/* Quick Contact Links (Mobile Friendly) */}
          <div className="flex flex-col gap-3">
            {lead?.Phone && (
              <a 
                href={`tel:${lead.Phone}`}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-brand-red">{lead.Phone}</p>
                </div>
              </a>
            )}

            {lead?.Email && (
              <a 
                href={`mailto:${lead.Email}`}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mr-3">
                  <Mail className="h-4 w-4 text-gray-500 group-hover:text-brand-red" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-brand-red">{lead.Email}</p>
                </div>
              </a>
            )}
          </div>

          {/* Details Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Lead Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Company
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {lead?.Company || '—'}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Status
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lead?.Lead_Status || 'New'}
                </span>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  Source
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {lead?.Lead_Source || '—'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
