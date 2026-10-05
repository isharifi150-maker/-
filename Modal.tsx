import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; }
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 animate-fade-in">
    <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={onClose}/>
    <div className={`relative z-10 w-full ${sizeClasses[size]} max-h-[94dvh] overflow-hidden rounded-t-2xl bg-white shadow-elevated sm:max-h-[90vh] sm:rounded-2xl animate-scale-in`}>
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6 sm:py-4"><h3 className="min-w-0 truncate text-base font-bold text-secondary-800 sm:text-lg">{title}</h3><button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200"><X size={20}/></button></div>
      <div className="max-h-[calc(94dvh-56px)] overflow-y-auto overflow-x-hidden p-4 sm:max-h-[calc(90vh-64px)] sm:p-6">{children}</div>
    </div>
  </div>;
}
