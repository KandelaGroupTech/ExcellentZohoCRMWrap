'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import CreateDealModal from '../../components/CreateDealModal';

export default function DashboardIndex() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Pipeline</h2>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
      <CreateDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Mobile FAB */}
      {isAdmin && (
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="md:hidden fixed bottom-20 right-4 z-50 h-14 w-14 bg-brand-red text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-red/90 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

    </div>
  );
}
