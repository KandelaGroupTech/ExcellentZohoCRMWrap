'use client';

import { useAuth } from '@clerk/nextjs';
import MyToDos from './components/MyToDos';
// Later we can import other widgets like PipelineSummary, ActivityFeed, etc.

export default function DashboardHome() {
  const { orgRole } = useAuth();
  
  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Command Center</h2>
      </div>
      
      {/* 
        For now, a simple grid that will hold the To-Dos list.
        As we add more dashboard items (reports, summaries), we can expand this grid.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Left Column: Actionable items like To-Dos */}
        <div className="flex flex-col gap-6">
          <MyToDos />
        </div>
        
        {/* Right Column: Summaries, Reports, Recent Activity (Placeholders for now) */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-8 flex flex-col items-center justify-center h-[300px] text-center">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Reports & Summaries</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              This space is reserved for future pipeline metrics, recent activity feeds, and custom reports.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
