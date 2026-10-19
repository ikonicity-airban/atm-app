import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns?: Column<T>[];
  data?: T[];
  keyField?: keyof T;
  emptyMessage?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standard Compound Table Primitives
 */
export function TableRoot({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-xs text-foreground', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted border-b border-border', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border bg-card', className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn('bg-muted/50 border-t border-border font-medium text-foreground', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle font-medium uppercase tracking-wider text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('p-4 align-middle text-foreground [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn('mt-4 text-xs text-muted-foreground', className)} {...props} />;
}

/**
 * Polymorphic Table component supporting both legacy columns/data props and compound children
 */
export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage = 'No records found.',
  className,
  children,
  ...props
}: TableProps<T> & React.HTMLAttributes<HTMLTableElement>) {
  // If compound children are provided, render as a table container
  if (!columns || !data || !keyField) {
    return (
      <TableRoot className={className} {...props}>
        {children}
      </TableRoot>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-10 text-center border border-border rounded-xl bg-muted text-muted-foreground text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View: Standard tabular grid */}
      <div className="hidden sm:block overflow-x-auto border border-border rounded-xl bg-card">
        <table className="min-w-full divide-y divide-border text-left text-xs">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-muted/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground whitespace-nowrap">
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
            className="p-4 bg-card border border-border rounded-xl shadow-xs space-y-2 text-xs"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-2 border-b border-border/50 last:border-b-0 pb-1.5 last:pb-0">
                <span className="font-medium text-muted-foreground uppercase text-[10px]">
                  {col.header}
                </span>
                <span className="text-foreground font-medium text-right">
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
