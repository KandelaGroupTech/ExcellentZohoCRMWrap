'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface CallData {
  entityId: string;
  entityType: 'Contacts' | 'Leads' | 'Accounts';
  name?: string;
}

interface CallLoggerContextType {
  registerCallClick: (data: CallData) => void;
}

const CallLoggerContext = createContext<CallLoggerContextType>({
  registerCallClick: () => {},
});

export const useCallLogger = () => useContext(CallLoggerContext);

export function CallLoggerProvider({ children }: { children: React.ReactNode }) {
  const [modalData, setModalData] = useState<CallData | null>(null);
  const [notes, setNotes] = useState('');
  
  const pendingCallRef = useRef<CallData | null>(null);
  const blurFiredRef = useRef(false);

  const registerCallClick = (data: CallData) => {
    pendingCallRef.current = data;
    blurFiredRef.current = false;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurFiredRef.current = true;
      } else if (document.visibilityState === 'visible' && blurFiredRef.current) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (pendingCallRef.current) {
          setModalData(pendingCallRef.current);
          pendingCallRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // Give them 10 seconds to confirm the OS "Call" prompt.
    // If they cancel or stay in the app, clean up so it doesn't fire later.
    setTimeout(() => {
      if (!blurFiredRef.current) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        pendingCallRef.current = null;
      }
    }, 10000);
  };

  const logCallMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to log call');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Call logged successfully');
      setModalData(null);
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to log call');
    }
  });

  const handleLogCall = (result: 'Connected' | 'No Answer') => {
    if (!modalData) return;
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - 6); // Set start time to 6 minutes ago so that 5 min duration is valid
    
    const callData: any = {
      Subject: 'Outbound Call',
      Call_Type: 'Outbound',
      Call_Result: result,
      Description: notes || '',
      Call_Start_Time: d.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
      Call_Duration: '00:05',
      Outgoing_Call_Status: 'Completed'
    };

    if (modalData.entityType === 'Accounts') {
      callData['$se_module'] = 'Accounts';
      callData['What_Id'] = { id: modalData.entityId };
    } else {
      callData['Who_Id'] = { id: modalData.entityId };
    }

    logCallMutation.mutate(callData);
  };

  return (
    <CallLoggerContext.Provider value={{ registerCallClick }}>
      {children}
      
      {modalData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-gray-50 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Log Call</h3>
            <p className="text-sm text-gray-500 mb-4">
              Did you speak with {modalData.name || 'them'}?
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input 
                type="text" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-red focus:border-brand-red"
                placeholder="What was discussed?"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => handleLogCall('Connected')}
                disabled={logCallMutation.isPending}
                className="flex-1 bg-brand-red text-white py-2 rounded-md font-medium text-sm hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
              >
                Connected
              </button>
              <button 
                onClick={() => handleLogCall('No Answer')}
                disabled={logCallMutation.isPending}
                className="flex-1 bg-gray-100 text-gray-800 border border-gray-200 py-2 rounded-md font-medium text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                No Answer
              </button>
            </div>
            
            <div className="text-center">
              <button 
                onClick={() => {
                  setModalData(null);
                  setNotes('');
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </CallLoggerContext.Provider>
  );
}


