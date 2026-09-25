'use client';

import { useState, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface PullToRefreshProps {
  children: React.ReactNode;
  className?: string;
}

export default function PullToRefresh({ children, className = '' }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest('.overflow-auto, .overflow-y-auto') as HTMLElement | null;
    
    // Only allow pull-to-refresh if the touched scrollable container is at the top
    if (!scrollable || scrollable.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    
    if (diff > 0) {
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.overflow-auto, .overflow-y-auto') as HTMLElement | null;
      if (!scrollable || scrollable.scrollTop <= 0) {
        // Add resistance by multiplying by 0.5
        setPullDistance(Math.min(diff * 0.5, MAX_PULL));
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    } else {
      // If we scroll down (diff < 0), cancel the pull
      isPullingRef.current = false;
      setPullDistance(0);
    }
  };

  const onTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    
    if (pullDistance > THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(60); // Snap back to loading position
      
      try {
        await queryClient.refetchQueries();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0); // Snap closed
    }
  };

  return (
    <main 
      ref={scrollRef}
      className={`relative overflow-hidden overscroll-y-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Refresh Indicator Header */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-end justify-center pb-4 overflow-hidden transition-all duration-200 ease-out z-0"
        style={{ height: `${pullDistance}px`, opacity: pullDistance / THRESHOLD }}
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <ArrowDown 
              className="h-5 w-5 mb-1 transition-transform duration-200"
              style={{ transform: `rotate(${pullDistance > THRESHOLD ? 180 : 0}deg)` }}
            />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {pullDistance > THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Main Content Area */}
      <div 
        className={`relative z-10 transition-transform duration-200 ease-out min-h-full ${
          pullDistance > 0 ? 'bg-[#D9D9D9] md:bg-transparent rounded-t-xl md:rounded-none shadow-sm md:shadow-none' : ''
        }`}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </main>
  );
}
