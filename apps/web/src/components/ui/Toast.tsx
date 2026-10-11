import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface ToastItem {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (options: { message: string; title?: string; type?: 'success' | 'error' | 'info' }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, title, type = 'info' }: { message: string; title?: string; type?: 'success' | 'error' | 'info' }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, title, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <aside aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto p-4 rounded-lg shadow-lg border text-xs flex items-start gap-3 bg-white transition-all',
              t.type === 'success' && 'border-emerald-200 text-slate-900',
              t.type === 'error' && 'border-red-200 text-slate-900',
              t.type === 'info' && 'border-slate-200 text-slate-900'
            )}
          >
            <div className="mt-0.5 flex-shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-slate-600" />}
            </div>
            <div className="flex-1">
              {t.title && <h5 className="font-bold text-slate-900 mb-0.5">{t.title}</h5>}
              <p className="text-slate-600 leading-relaxed">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: ({ message }: { message: string }) => console.log('[Toast fallback]:', message),
      removeToast: () => {},
    };
  }
  return ctx;
}
