'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import DealDetailModal from './DealDetailModal';

import { useAuth } from '@clerk/nextjs';

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

function formatCurrency(amount: any) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function KanbanBoard() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'org:admin';
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const queryClient = useQueryClient();
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    }
  });

  const { data: allTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!deals
  });

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
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['deals'] });
      
      // Snapshot the previous value
      const previousDeals = queryClient.getQueryData<any[]>(['deals']);
      
      // Optimistically update to the new value
      if (previousDeals) {
        queryClient.setQueryData<any[]>(['deals'], (old) => {
          return old?.map(deal => 
            deal.id === variables.dealId ? { ...deal, Stage: variables.stage } : deal
          );
        });
      }
      
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals);
      }
      toast.error(err.message || "Failed to update deal stage.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Error loading deals.</p>
      </div>
    );
  }

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals?.filter((d: any) => d.Stage === stage) || [];
    return acc;
  }, {} as Record<string, any[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      // Only mutate if the stage actually changed
      const deal = deals?.find((d: any) => d.id === dealId);
      if (deal && deal.Stage !== newStage) {
        updateStageMutation.mutate({ dealId, stage: newStage });
      }
    }
  };

  return (
    <div className="flex h-full space-x-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageDeals = dealsByStage[stage];
        const totalAmount = stageDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);

        return (
          <div 
            key={stage} 
            className="flex flex-col w-80 shrink-0 bg-gray-50 rounded-lg p-4 transition-colors hover:bg-gray-100"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">{stage}</h3>
              <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {stageDeals.length}
              </span>
            </div>
            
            <div className="mb-4 text-xs font-medium text-gray-500">
              Total: {formatCurrency(totalAmount)}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {stageDeals.map((deal) => {
                const outstandingTasks = Array.isArray(allTasks) 
                  ? allTasks.filter(t => t.What_Id?.id === deal.id && t.Status !== 'Completed').length 
                  : 0;

                return (
                  <div 
                    key={deal.id} 
                    draggable={isAdmin}
                    onDragStart={(e) => isAdmin && handleDragStart(e, deal.id)}
                    onClick={() => setSelectedDeal(deal)}
                    className={`bg-white p-4 rounded shadow-sm border border-gray-200 transition-colors relative ${isAdmin ? 'hover:border-brand-red/50 cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  >
                    {deal.Modified_Time && (
                      <span className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {formatDate(deal.Modified_Time)}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 mb-1 pr-16">{deal.Deal_Name}</h4>
                    {deal.Account_Name?.name && (
                      <p className="text-xs text-gray-500 mb-2">{deal.Account_Name.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(deal.Amount)}</span>
                      {outstandingTasks > 0 && (
                        <div className="flex items-center bg-brand-red/10 text-brand-red px-2 py-0.5 rounded text-xs font-medium" title={`${outstandingTasks} outstanding to-do${outstandingTasks > 1 ? 's' : ''}`}>
                          <CheckSquare className="w-3 h-3 mr-1" />
                          {outstandingTasks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {stageDeals.length === 0 && (
                <div className="text-center p-4 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded">
                  Drop deals here
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Deal Detail Modal */}
      <DealDetailModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        stages={STAGES}
        onUpdateStage={(dealId, stage) => {
          updateStageMutation.mutate({ dealId, stage });
          // Update selected deal optimistic
          setSelectedDeal((prev: any) => prev ? { ...prev, Stage: stage } : prev);
        }}
        isUpdatingStage={updateStageMutation.isPending}
      />
    </div>
  );
}
