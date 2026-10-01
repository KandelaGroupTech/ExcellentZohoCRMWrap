'use client';

import { Loader2 } from 'lucide-react';

export function ReportLoading({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
        <p className="mt-3 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-md bg-red-50 p-4 space-y-2">
      <p className="text-sm font-medium text-red-800">Error: {message}</p>
      <button type="button" onClick={onRetry} className="text-xs text-red-700 underline">
        Tap to retry
      </button>
    </div>
  );
}
