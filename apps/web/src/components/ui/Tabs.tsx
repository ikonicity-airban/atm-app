import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-slate-200 overflow-x-auto', className)}>
      <nav className="flex space-x-4 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'py-3 px-2 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap min-h-[44px] flex items-center gap-2 transition-colors cursor-pointer',
                isActive
                  ? 'border-[#ca2484] text-[#ca2484]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-pink-100 text-[#ca2484]' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
