'use client';

import { useState, useEffect, useRef } from 'react';
import { useUrlState } from '@/hooks/useUrlState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckSquare, ChevronRight, ChevronLeft, ChevronDown, Search, Paperclip, Archive, ArchiveRestore, Columns, RotateCcw, Building2, Calendar, User } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  const [dealParam, setDealParam] = useUrlState('deal', '');
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [pipelineView, setPipelineView] = useState<'active' | 'archived'>('active');
  const queryClient = useQueryClient();
  const touchDragDealId = useRef<string | null>(null);
  const touchDragGhost = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kanban_collapsed_stages');
        if (saved) {
          setCollapsedStages(JSON.parse(saved));
        }
      } catch (e) {}
    }
  }, []);

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/deals');
      if (!res.ok) {
        let errStr = 'Failed to fetch deals';
        try {
          const errData = await res.json();
          errStr = errData.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }
      return res.json();
    }
  });

  // Auto-open a deal when arriving via ?deal=<id> (e.g. from the dashboard)
  useEffect(() => {
    if (!dealParam || !Array.isArray(deals)) return;
    const match = deals.find((d: any) => d.id === dealParam);
    if (match) {
      setSelectedDeal(match);
    } else {
      toast.error('That project could not be found.');
      setDealParam('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealParam, deals]);

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

  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ dealId, currentDesc, archive }: { dealId: string, currentDesc: string, archive: boolean }) => {
      let baseDesc = (currentDesc || '').split('\n---DEAL_META---')[0];
      let meta: any = {};
      try {
        const parts = (currentDesc || '').split('---DEAL_META---');
        if (parts.length > 1) meta = JSON.parse(parts[parts.length - 1].trim());
      } catch(e) {}
      
      const newMeta = {
        ...meta,
        archived: archive,
        archivedAt: archive ? new Date().toISOString() : null
      };
      
      const newDesc = baseDesc + '\n---DEAL_META---\n' + JSON.stringify(newMeta);
      const res = await fetch('/website-demos/excellentzohocrm/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, description: newDesc })
      });
      if (!res.ok) throw new Error(archive ? 'Failed to archive project' : 'Failed to restore project');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success(variables.archive ? 'Project moved to Archive' : 'Project restored to Active Pipeline');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update project')
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
        <p className="text-sm font-medium text-red-800">
          Error loading deals: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  // Parse owners and archive status from description
  const processedDeals = (deals || []).map((deal: any) => {
    let owner = null;
    let isArchived = false;
    let archivedAt = null;
    if (deal.Description) {
      if (deal.Description.includes('---DEAL_META---')) {
        const parts = deal.Description.split('---DEAL_META---');
        const metaStr = parts[parts.length - 1].trim();
        try {
          const parsed = JSON.parse(metaStr);
          owner = parsed.owner || null;
          isArchived = !!parsed.archived;
          archivedAt = parsed.archivedAt || null;
        } catch(e) {}
      }
    }
    return { ...deal, _owner: owner, _isArchived: isArchived, _archivedAt: archivedAt };
  });

  const activeDeals = processedDeals.filter((d: any) => !d._isArchived);
  const archivedDeals = processedDeals.filter((d: any) => d._isArchived);

  const filteredDeals = (pipelineView === 'active' ? activeDeals : archivedDeals).filter((d: any) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const dealName = (d.Deal_Name || '').toLowerCase();
    const accountName = (d.Account_Name?.name || '').toLowerCase();
    return dealName.includes(lowerQuery) || accountName.includes(lowerQuery);
  });

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredDeals.filter((d: any) => d.Stage === stage);
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

  const handleTouchStart = (e: React.TouchEvent, dealId: string) => {
    touchDragDealId.current = dealId;
    // Create a ghost element to follow the finger
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.8;
      background: white;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    const deal = deals?.find((d: any) => d.id === dealId);
    ghost.textContent = deal?.Deal_Name || 'Deal';
    document.body.appendChild(ghost);
    touchDragGhost.current = ghost;
    const touch = e.touches[0];
    ghost.style.left = `${touch.clientX - 100}px`;
    ghost.style.top = `${touch.clientY - 20}px`;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragDealId.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touchDragGhost.current) {
      touchDragGhost.current.style.left = `${touch.clientX - 100}px`;
      touchDragGhost.current.style.top = `${touch.clientY - 20}px`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragDealId.current) return;
    // Remove ghost
    if (touchDragGhost.current) {
      document.body.removeChild(touchDragGhost.current);
      touchDragGhost.current = null;
    }
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const stageEl = el?.closest('[data-stage]');
    const targetStage = stageEl?.getAttribute('data-stage');
    if (targetStage) {
      const deal = deals?.find((d: any) => d.id === touchDragDealId.current);
      if (deal && deal.Stage !== targetStage) {
        updateStageMutation.mutate({ dealId: touchDragDealId.current!, stage: targetStage });
      }
    }
    touchDragDealId.current = null;
  };

  const toggleCollapse = (stage: string) => {
    setCollapsedStages(prev => {
      const newState = { ...prev, [stage]: !prev[stage] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('kanban_collapsed_stages', JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-red focus:border-brand-red sm:text-sm"
            placeholder={pipelineView === 'active' ? "Search active deals by name or account..." : "Search archived deals..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View Switcher: Active Deals vs Archived / Stalled */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 self-start sm:self-auto border border-gray-200">
          <button
            onClick={() => setPipelineView('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              pipelineView === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Active Pipeline</span>
            <span className="bg-gray-200 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {activeDeals.length}
            </span>
          </button>
          
          <button
            onClick={() => setPipelineView('archived')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              pipelineView === 'archived' ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Projects on hold or stalled"
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" />
            <span>Archived / Stalled</span>
            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {archivedDeals.length}
            </span>
          </button>
        </div>
      </div>
      {pipelineView === 'archived' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-700" />
                Archived & Stalled Projects Shelf
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                These projects are on hold and excluded from your active pipeline stages and forecast totals.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full">
              {archivedDeals.length} {archivedDeals.length === 1 ? 'Project' : 'Projects'} Shelved
            </span>
          </div>

          {filteredDeals.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-gray-900">No archived projects found</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? "No archived projects matched your search query." 
                  : "Stalled or on-hold projects can be shelved from any deal's detail modal so they don't skew your active pipeline."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {filteredDeals.map((deal: any) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDeal(deal)}
                        className="text-left font-bold text-sm text-gray-900 hover:text-brand-red transition-colors line-clamp-2"
                      >
                        {deal.Deal_Name}
                      </button>
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 shrink-0">
                        {deal.Stage}
                      </span>
                    </div>

                    {deal.Account_Name?.name && (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{deal.Account_Name.name}</span>
                      </p>
                    )}
                    {deal.Contact_Name?.name && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-2">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{deal.Contact_Name.name}</span>
                      </p>
                    )}

                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      {formatCurrency(deal.Amount)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {deal._archivedAt ? new Date(deal._archivedAt).toLocaleDateString() : 'Archived'}
                    </span>
                    <button
                      type="button"
                      disabled={toggleArchiveMutation.isPending}
                      onClick={() => toggleArchiveMutation.mutate({ dealId: deal.id, currentDesc: deal.Description, archive: false })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-red hover:bg-brand-red/10 rounded-md transition-colors"
                      title="Restore to active pipeline"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Vertical Accordion Layout */}
      <div className="flex md:hidden flex-col h-full space-y-3 overflow-y-auto pb-6 px-1 custom-scrollbar">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage];
          const totalAmount = stageDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);
          const isExpanded = collapsedStages[`mobile_${stage}`] || false;

          return (
            <div key={`mobile-${stage}`} className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden shrink-0">
              <button 
                onClick={() => toggleCollapse(`mobile_${stage}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-sm text-left">{stage}</span>
                  <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{stageDeals.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{formatCurrency(totalAmount)}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 bg-gray-100/50 space-y-3 border-t border-gray-200">
                  {stageDeals.map((deal) => {
                    const outstandingTasks = Array.isArray(allTasks) 
                      ? allTasks.filter(t => (t.What_Id?.id === deal.id || t.SEMODULE_ID === deal.id) && t.Status !== 'Completed').length 
                      : 0;

                    return (
                      <div 
                        key={deal.id} 
                        onClick={() => setSelectedDeal(deal)}
                        className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200 hover:border-brand-red/50 hover:shadow transition-all relative cursor-pointer"
                      >
                        {deal.Modified_Time && (
                          <span className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                            {formatDate(deal.Modified_Time)}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-gray-900 mb-2 pr-16 leading-tight">{deal.Deal_Name}</h4>
                        {deal.Account_Name?.name && (
                          <p className="text-xs text-gray-600 mb-1 line-clamp-1">{deal.Account_Name.name}</p>
                        )}
                        {deal.Contact_Name?.name ? (
                          <p className="text-[11px] text-gray-500 mb-3 flex items-center gap-1 line-clamp-1">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{deal.Contact_Name.name}</span>
                          </p>
                        ) : (
                          <div className="mb-2" />
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
  <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.Amount)}</span>
  {deal._has_attachments && <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
  {deal._owner && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">{deal._owner}</span>}
</div>
                          {outstandingTasks > 0 && (
                            <div className="flex items-center bg-brand-red/10 text-brand-red px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <CheckSquare className="w-3 h-3 mr-1" />
                              {outstandingTasks}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-md bg-white">
                      No deals in this stage
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Horizontal Kanban Layout */}
      <div className="hidden md:flex h-full space-x-4 overflow-x-auto pb-4 custom-scrollbar">
        {STAGES.map((stage) => {
        const stageDeals = dealsByStage[stage];
        const totalAmount = stageDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);

        const isCollapsed = collapsedStages[stage];

        if (isCollapsed) {
          return (
            <div 
              key={stage} 
              data-stage={stage}
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
            data-stage={stage}
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
                  ? allTasks.filter(t => (t.What_Id?.id === deal.id || t.SEMODULE_ID === deal.id) && t.Status !== 'Completed').length 
                  : 0;

                return (
                  <div 
                    key={deal.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onTouchStart={(e) => handleTouchStart(e, deal.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => setSelectedDeal(deal)}
                    className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200 transition-all relative hover:border-brand-red/50 hover:shadow-lg cursor-grab active:cursor-grabbing touch-none select-none"
                  >
                    {deal.Modified_Time && (
                      <span className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {formatDate(deal.Modified_Time)}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900 mb-2 pr-16">{deal.Deal_Name}</h4>
                    {deal.Account_Name?.name && (
                      <p className="text-xs text-gray-600 mb-1">{deal.Account_Name.name}</p>
                    )}
                    {deal.Contact_Name?.name ? (
                      <p className="text-[11px] text-gray-500 mb-3 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{deal.Contact_Name.name}</span>
                      </p>
                    ) : (
                      <div className="mb-2" />
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
  <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.Amount)}</span>
  {deal._has_attachments && <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
  {deal._owner && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">{deal._owner}</span>}
</div>
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
      
      </div>
        </>
      )}

      {/* Deal Detail Modal */}
      <DealDetailModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => { setSelectedDeal(null); setDealParam(''); }} 
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




