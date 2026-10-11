import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Static skeleton blocks without any pulse animation */}
      <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
      <div className="h-4 w-96 bg-slate-100 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 bg-slate-100 border border-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-100 border border-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-100 border border-slate-200 rounded-lg" />
      </div>
    </div>
  );
}
