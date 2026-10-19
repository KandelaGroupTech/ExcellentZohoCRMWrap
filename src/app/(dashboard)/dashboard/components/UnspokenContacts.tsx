'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Phone, Mail, Clock, ArrowRight, UserCheck, AlertTriangle, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { parseLastConnection, getConnectionStatusInfo, formatPhoneNumber } from '@/lib/utils';
import { useCallLogger } from '../../components/CallLoggerProvider';

export default function UnspokenContacts() {
  const { registerCallClick } = useCallLogger();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center h-[350px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red mb-2" />
        <p className="text-xs text-gray-400">Loading contacts...</p>
      </div>
    );
  }

  const now = new Date();

  // Filter ONLY contacts who have a valid past connection recorded (exclude "Never" / uncontacted)
  const unspokenContacts: any[] = (contacts || [])
    .map((c: any) => {
      const conn = parseLastConnection(c.Skype_ID);
      if (!conn || !conn.date) return null;

      const d = new Date(conn.date);
      if (isNaN(d.getTime())) return null;

      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const status = getConnectionStatusInfo(conn.date);

      // Must be a valid past contact
      if (status.text === 'Never') return null;

      return {
        ...c,
        _conn: conn,
        _diffDays: diffDays,
        _status: status
      };
    })
    .filter(Boolean)
    // Sort oldest first (longest time since last touch)
    .sort((a: any, b: any) => b._diffDays - a._diffDays);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Contacts to Reconnect With
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {unspokenContacts.length}
            </span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Previously spoken with • Sorted by longest time since last touch
          </p>
        </div>

        <Link
          href="/dashboard/contacts"
          className="text-xs text-brand-red hover:underline font-medium flex items-center shrink-0 ml-2"
        >
          All Contacts <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>

      {/* Container calibrated so ~10 contacts are visible with smooth scrolling for more */}
      <div className="divide-y divide-gray-100 overflow-y-auto max-h-[520px] custom-scrollbar">
        {unspokenContacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            All contacted prospects and clients have been touched recently!
          </div>
        ) : (
          unspokenContacts.map((contact: any) => {
            const fullName = `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || 'Unnamed Contact';
            const accountName = contact.Account_Name?.name || contact.Title || '';

            return (
              <div
                key={contact.id}
                className="p-3 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/contacts`}
                      className="text-xs font-bold text-gray-900 hover:text-brand-red transition-colors truncate"
                      title={fullName}
                    >
                      {fullName}
                    </Link>

                    <span
                      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.2 rounded-full whitespace-nowrap shrink-0 ${contact._status.pillClass}`}
                    >
                      {contact._status.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 truncate">
                    {accountName && <span className="truncate">{accountName}</span>}
                    {contact._conn?.date && (
                      <span className="text-gray-400 flex items-center gap-1 shrink-0">
                        <span>{contact._conn.icon}</span>
                        <span>{new Date(contact._conn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {contact.Phone && (
                    <a
                      href={`tel:${contact.Phone}`}
                      onClick={() =>
                        registerCallClick({
                          entityId: contact.id,
                          entityType: 'Contacts',
                          name: fullName
                        })
                      }
                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      title={`Call ${formatPhoneNumber(contact.Phone)}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {contact.Email && (
                    <a
                      href={`mailto:${contact.Email}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title={`Email ${contact.Email}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
