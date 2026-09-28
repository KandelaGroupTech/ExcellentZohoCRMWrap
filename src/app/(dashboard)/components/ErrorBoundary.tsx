'use client';
import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 z-[9999] fixed inset-0 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Client Crash</h1>
          <pre className="whitespace-pre-wrap font-mono text-sm">{this.state.error?.toString()}</pre>
          <pre className="whitespace-pre-wrap mt-4 text-xs font-mono">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
