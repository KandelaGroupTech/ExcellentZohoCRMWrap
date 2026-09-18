'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import DealDetailModal from './DealDetailModal';

import { useAuth, useUser } from '@clerk/nextjs';

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const isAdmin = orgRole === 'org:admin';
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kanban_collapsed_stages');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isUserLoaded && user && user.unsafeMetadata?.collapsedStages) {
      const remoteStages = user.unsafeMetadata.collapsedStages as Record<string, boolean>;
      setCollapsedStages(prev => {
        const merged = { ...prev, ...remoteStages };
        if (typeof window !== 'undefined') {
          localStorage.setItem('kanban_collapsed_stages', JSON.stringify(merged));
        }
        return merged;
      });
    }
  }, [isUserLoaded, user]);

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

  const toggleCollapse = async (stage: string) => {
    const newState = { ...collapsedStages, [stage]: !collapsedStages[stage] };
    setCollapsedStages(newState); // Optimistic UI update
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanban_collapsed_stages', JSON.stringify(newState));
    }

    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            collapsedStages: newState
          }
        });
      } catch (err) {
        console.error("Failed to save collapsed state to Clerk", err);
      }
    }
  };

  return (
    <div className="flex h-full space-x-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageDeals = dealsByStage[stage];
        const totalAmount = stageDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);

        const isCollapsed = collapsedStages[stage];

        if (isCollapsed) {
          return (
            <div 
              key={stage} 
              className="flex flex-col w-12 shrink-0 bg-[#1a1a1a] rounded-xl py-4 items-center justify-between border border-[#333] transition-colors hover:bg-black shadow-lg"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex flex-col items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold text-black mb-6 shadow-sm">
                  {stageDeals.length}
                </span>
                <div 
                  className="text-sm font-bold text-white tracking-widest whitespace-nowrap" 
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {stage.toUpperCase()}
                </div>
              </div>
              <button 
                onClick={() => toggleCollapse(stage)}
                className="mt-6 p-1 text-gray-400 hover:text-white rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          );
        }

        return (
          <div 
            key={stage} 
            className="flex flex-col w-80 shrink-0 bg-transparent transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="relative mb-4">
              <div className="w-[90%] bg-brand-red rounded-t-xl px-4 py-3 shadow-md border-b-2 border-brand-red">
                <h3 className="text-sm font-semibold text-white truncate">{stage}</h3>
                <div className="text-[11px] font-medium text-white/90 mt-0.5">
                  Total: {formatCurrency(totalAmount)}
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-black text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-red">
                {stageDeals.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
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
                    className={`bg-white p-4 rounded-md shadow-md border border-gray-100 transition-all relative ${isAdmin ? 'hover:border-brand-red/50 hover:shadow-lg cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  >
                    {deal.Modified_Time && (
                      <span className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {formatDate(deal.Modified_Time)}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900 mb-2 pr-16">{deal.Deal_Name}</h4>
                    {deal.Account_Name?.name && (
                      <p className="text-xs text-gray-600 mb-3">{deal.Account_Name.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.Amount)}</span>
                      {outstandingTasks > 0 && (
                        <div className="flex items-center bg-brand-red/10 text-brand-red px-2 py-0.5 rounded text-xs font-bold" title={`${outstandingTasks} outstanding to-do${outstandingTasks > 1 ? 's' : ''}`}>
                          <CheckSquare className="w-3 h-3 mr-1" />
                          {outstandingTasks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {stageDeals.length === 0 && (
                <div className="text-center p-4 text-sm text-gray-400 border-2 border-dashed border-gray-600 rounded-md">
                  Drop deals here
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-2 flex justify-start pl-1">
              <button 
                onClick={() => toggleCollapse(stage)}
                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
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
