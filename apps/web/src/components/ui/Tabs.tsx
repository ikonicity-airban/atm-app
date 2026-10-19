'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const tabsListVariants = cva(
  'inline-flex items-center gap-1 rounded-xl transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-muted p-1 text-muted-foreground',
        segmented: 'bg-muted p-1 text-muted-foreground',
        underline: 'border-b border-border bg-transparent gap-4 p-0 rounded-none w-full overflow-x-auto min-w-max',
      },
      size: {
        default: 'h-11',
        sm: 'h-9',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const tabsTabVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium min-h-[44px] cursor-pointer select-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[selected]:bg-card data-[selected]:text-card-foreground data-[selected]:shadow-xs text-muted-foreground hover:text-foreground',
        segmented: 'data-[selected]:bg-card data-[selected]:text-card-foreground data-[selected]:shadow-xs text-muted-foreground hover:text-foreground',
        underline: 'rounded-none border-b-2 border-transparent px-2 py-3 text-muted-foreground data-[selected]:border-primary data-[selected]:text-primary hover:text-foreground hover:border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps extends Omit<React.ComponentProps<typeof TabsPrimitive.Root>, 'onChange'> {
  tabs?: TabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  // Backwards compatibility for legacy caller: <Tabs tabs={items} activeTab={active} onChange={setActive} />
  if (tabs && tabs.length > 0) {
    const currentTab = activeTab || (typeof value === 'string' ? value : undefined) || tabs[0]?.id;
    const handleChange = (newId: string) => {
      onChange?.(newId);
      onValueChange?.(newId as any, undefined as any);
    };

    return (
      <div className={cn('border-b border-border overflow-x-auto', className)}>
        <nav className="flex space-x-4 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === currentTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleChange(tab.id)}
                className={cn(
                  'py-3 px-2 border-b-2 font-semibold text-xs whitespace-nowrap min-h-[44px] flex items-center gap-2 transition-colors cursor-pointer',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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

  const effectiveValue = value !== undefined ? value : activeTab;
  const effectiveChange = onValueChange || (onChange ? (val: any) => onChange(String(val)) : undefined);

  return (
    <TabsPrimitive.Root
      value={effectiveValue}
      defaultValue={defaultValue}
      onValueChange={effectiveChange}
      className={className}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

export interface TabsListProps
  extends React.ComponentProps<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

export function TabsList({ className, variant, size, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export interface TabsTabProps
  extends React.ComponentProps<typeof TabsPrimitive.Tab>,
    VariantProps<typeof tabsTabVariants> {}

export function TabsTab({ className, variant, ...props }: TabsTabProps) {
  return (
    <TabsPrimitive.Tab
      className={cn(tabsTabVariants({ variant }), className)}
      {...props}
    />
  );
}

// Aliases for shadcn and standard naming conventions
export const TabsTrigger = TabsTab;

export function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      className={cn('mt-3 outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      {...props}
    />
  );
}

export const TabsContent = TabsPanel;
export const TabsIndicator = TabsPrimitive.Indicator;
