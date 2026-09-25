'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export default function SwipeableCard({ children, onEdit, onDelete, onClick }: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  
  // Calculate how many action buttons we have to determine max swipe distance
  const actionCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const MAX_SWIPE = actionCount * 80; // 80px per button

  const handleTouchStart = (e: React.TouchEvent) => {
    if (actionCount === 0) return;
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || actionCount === 0) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = startXRef.current - currentXRef.current;
    
    // Only allow swiping left to reveal right-side buttons
    if (diff > 0) {
      setOffset(Math.min(diff, MAX_SWIPE + 20)); // Allow a little over-drag
    } else {
      setOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || actionCount === 0) return;
    isDraggingRef.current = false;
    
    // Snap open or closed based on how far they dragged
    if (offset > MAX_SWIPE / 2) {
      setOffset(MAX_SWIPE);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gray-100 border-b border-gray-200 w-full group">
      
      {/* Background Actions (Hidden underneath) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end z-0">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOffset(0);
              onEdit();
            }}
            className="flex items-center justify-center w-[80px] h-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOffset(0);
              onDelete();
            }}
            className="flex items-center justify-center w-[80px] h-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Foreground Content (The Card) */}
      <div 
        className="relative z-10 bg-gray-50 w-full transition-transform duration-200 ease-out cursor-pointer active:bg-gray-50"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (offset > 0) {
            setOffset(0); // If open, close it
          } else if (onClick) {
            onClick();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}


