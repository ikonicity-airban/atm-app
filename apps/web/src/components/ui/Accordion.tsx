'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { Icon } from './Icon.tsx';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  defaultOpenId,
  allowMultiple = false,
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="py-2">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              className="w-full py-3.5 flex items-center justify-between text-left font-semibold text-foreground hover:text-primary transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 cursor-pointer"
            >
              <span className="text-sm sm:text-base pr-4">{item.title}</span>
              <Icon
                icon={ChevronDown}
                className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  isOpen && 'transform rotate-180 text-primary'
                )}
              />
            </button>
            {isOpen && (
              <div className="pb-4 pt-1 px-1 text-sm text-muted-foreground leading-relaxed">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
