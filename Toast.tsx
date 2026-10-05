import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastCallback: ((toast: Toast) => void) | null = null;

export function toast(type: ToastType, message: string) {
  if (toastCallback) {
    toastCallback({ id: Date.now().toString(), type, message });
  }
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-success-50 border-success-300 text-success-800',
  error: 'bg-error-50 border-error-300 text-error-800',
  warning: 'bg-warning-50 border-warning-300 text-warning-800',
  info: 'bg-secondary-50 border-secondary-300 text-secondary-800',
};

const iconColors = {
  success: 'text-success-600',
  error: 'text-error-600',
  warning: 'text-warning-600',
  info: 'text-secondary-600',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastCallback = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    return () => { toastCallback = null; };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed bottom-4 left-3 right-3 z-[100] flex flex-col gap-2 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-elevated animate-slide-up sm:min-w-[320px] ${colors[t.type]}`}
          >
            <Icon size={20} className={iconColors[t.type]} />
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => remove(t.id)} className="mr-2 opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
