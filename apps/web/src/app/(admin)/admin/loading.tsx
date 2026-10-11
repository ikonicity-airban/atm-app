import React from 'react';

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4">
      {/* Static skeleton blocks without pulse */}
      <div className="h-6 w-48 bg-slate-200 rounded" />
      <div className="h-4 w-72 bg-slate-100 rounded mb-6" />
      <div className="h-64 bg-white border border-slate-200 rounded-lg" />
    </div>
  );
}
