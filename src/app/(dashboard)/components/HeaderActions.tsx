'use client';

import { useState } from 'react';
import { PhoneCall, RotateCw } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import LogCallModal from './LogCallModal';

export default function HeaderActions() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
      toast.success('System refreshed');
    } catch (e) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Refresh system data"
        className="inline-flex items-center justify-center p-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors disabled:opacity-50"
      >
        <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-red' : ''}`} />
      </button>

      {isAdmin && (
        <>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-brand-red shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red/90 transition-colors"
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            Log Call
          </button>
          <LogCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
      )}
    </div>
  );
}
