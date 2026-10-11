import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage = 'No records found.',
  className,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View: Standard tabular grid */}
      <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 font-bold uppercase tracking-wider text-slate-600"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-slate-50/70 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-800 whitespace-nowrap">
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (360px - 640px) */}
      <div className="sm:hidden space-y-3">
        {data.map((row) => (
          <div
            key={String(row[keyField])}
            className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2 text-xs"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-2 border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                <span className="font-semibold text-slate-500 uppercase text-[10px]">
                  {col.header}
                </span>
                <span className="text-slate-900 font-medium text-right">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
