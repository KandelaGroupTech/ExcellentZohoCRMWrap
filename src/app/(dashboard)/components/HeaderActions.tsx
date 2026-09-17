'use client';

import { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import LogCallModal from './LogCallModal';

export default function HeaderActions() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="ml-auto">
      <button 
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-brand-red shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red/90"
      >
        <PhoneCall className="h-4 w-4 mr-2" />
        Log Call
      </button>
      <LogCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
