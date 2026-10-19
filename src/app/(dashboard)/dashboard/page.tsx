'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import MyToDos from './components/MyToDos';
import PipelineSnapshot from './components/PipelineSnapshot';
import StalledDeals from './components/StalledDeals';
import RecentActivity from './components/RecentActivity';
import DealDetailModal from './components/DealDetailModal';
import TodayPrioritiesBar from './components/TodayPrioritiesBar';
import UnspokenContacts from './components/UnspokenContacts';

const STAGES = [
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Identify Decision Makers",
  "Proposal/Price Quote",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost"
];

export default function DashboardHome() {
  const { orgRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    }
  });

  const selectedDeal = deals?.find((d: any) => d.id === selectedDealId) || null;

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string, stage: string }) => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stage })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update deal stage');
      }
      return res.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['deals'] });
      const previousDeals = queryClient.getQueryData<any[]>(['deals']);
      if (previousDeals) {
        queryClient.setQueryData<any[]>(['deals'], (old) => {
          return old?.map(deal => 
            deal.id === variables.dealId ? { ...deal, Stage: variables.stage } : deal
          );
        });
      }
      return { previousDeals };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals);
      }
      toast.error(err.message || "Failed to update deal stage.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });
  
  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Command Center</h2>
      </div>
      
      <TodayPrioritiesBar onSelectDeal={(id) => setSelectedDealId(id)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Left Column: Actionable items like To-Dos */}
        <div className="flex flex-col gap-6">
          <MyToDos onSelectDeal={(id) => setSelectedDealId(id)} />
          <RecentActivity onSelectDeal={(id) => setSelectedDealId(id)} />
        </div>
        
        {/* Right Column: Summaries, Reports, Recent Activity */}
        <div className="flex flex-col gap-6">
          <PipelineSnapshot />
          <StalledDeals onSelectDeal={(id) => setSelectedDealId(id)} />
          <UnspokenContacts />
        </div>

      </div>

      {/* Deal Detail Modal directly on the Dashboard */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDealId(null)}
          stages={STAGES}
          onUpdateStage={(dealId, stage) => {
            updateStageMutation.mutate({ dealId, stage });
          }}
          isUpdatingStage={updateStageMutation.isPending}
        />
      )}
    </div>
  );
}
