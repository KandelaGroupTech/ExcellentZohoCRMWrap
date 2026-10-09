'use client';

import { useAuth } from '@clerk/nextjs';
import MyToDos from './components/MyToDos';
import PipelineSnapshot from './components/PipelineSnapshot';
import StalledDeals from './components/StalledDeals';
import RecentActivity from './components/RecentActivity';

export default function DashboardHome() {
  const { orgRole } = useAuth();
  
  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Command Center</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Left Column: Actionable items like To-Dos */}
        <div className="flex flex-col gap-6">
          <MyToDos />
          <RecentActivity />
        </div>
        
        {/* Right Column: Summaries, Reports, Recent Activity */}
        <div className="flex flex-col gap-6">
          <PipelineSnapshot />
          <StalledDeals />
        </div>

      </div>
    </div>
  );
}
