import os

content = ''''use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import CreateDealModal from './components/CreateDealModal';

export default function DashboardIndex() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Pipeline</h2>
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
    </div>
  );
}
'''

with open('src/app/(dashboard)/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
