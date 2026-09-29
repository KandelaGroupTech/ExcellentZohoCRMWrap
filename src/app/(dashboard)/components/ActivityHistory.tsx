import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, FileText, Loader2, Calendar } from 'lucide-react';

interface ActivityHistoryProps {
  entityId: string;
  entityType: 'Accounts' | 'Contacts' | 'Leads' | 'Deals';
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

export default function ActivityHistory({ entityId, entityType }: ActivityHistoryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: async () => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/activities?entityId=${entityId}&entityType=${entityType}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
    enabled: !!entityId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
        Failed to load activity history.
      </div>
    );
  }

  const activities = data?.activities || [];

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm border-t border-gray-100 mt-4">
        No recent activity found.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 border-t border-gray-100 pt-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((act: any) => (
          <div key={act.id} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:border-0 last:pb-0">
            <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border-2 border-gray-100">
              {act.type === 'call' ? (
                <Phone className="w-3 h-3 text-brand-red" />
              ) : (
                <FileText className="w-3 h-3 text-blue-500" />
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {act.type === 'call' ? `Call: ${act.result || act.status}` : act.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(act.date)}
                </div>
              </div>
              
              {act.description && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                  {act.description}
                </p>
              )}
              
              {act.type === 'note' && act.owner && (
                <div className="mt-2 text-xs text-gray-400">
                  Added by {act.owner}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
