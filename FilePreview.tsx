import { useState } from 'react';
import { FileText, ImageIcon, Eye, Download, Trash2, Upload, X, RefreshCw, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { formatFileSize, formatDate } from '@/utils';
import type { Evidence } from '@/types';

interface FilePreviewModalProps {
  evidence: Evidence | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function FilePreviewModal({ evidence, onClose, onDelete }: FilePreviewModalProps) {
  if (!evidence) return null;

  return (
    <Modal open={!!evidence} onClose={onClose} title="معاينة الشاهد" size="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-4">
          {evidence.fileType === 'pdf' ? (
            <FileText className="text-error-600" size={24} />
          ) : (
            <ImageIcon className="text-primary-600" size={24} />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-bold text-neutral-800">{evidence.fileName}</p>
            <p className="text-xs text-neutral-500">
              {formatFileSize(evidence.fileSize)} • {formatDate(evidence.uploadedAt)}
            </p>
          </div>
          <a
            href={evidence.fileData}
            download={evidence.fileName}
            className="btn-ghost"
          >
            <Download size={18} />
            تحميل
          </a>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا الشاهد؟')) {
                  onDelete(evidence.id);
                  onClose();
                }
              }}
              className="btn-ghost text-error-600 hover:bg-error-50"
            >
              <Trash2 size={18} />
              حذف
            </button>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          {evidence.fileType === 'pdf' ? (
            <iframe
              src={evidence.fileData}
              className="pdf-viewer"
              title={evidence.fileName}
            />
          ) : (
            <img
              src={evidence.fileData}
              alt={evidence.fileName}
              className="mx-auto max-h-[600px] object-contain"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  label?: string;
}

export function FileUploadButton({ onFileSelect, label = 'رفع شاهد' }: FileUploadButtonProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  return (
    <label className="btn-primary cursor-pointer">
      <Upload size={18} />
      {label}
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}

interface EvidenceFileCardProps {
  evidence: Evidence;
  onPreview: () => void;
  onDelete?: () => void;
  onReplace?: (file: File) => void;
  compact?: boolean;
}

export function EvidenceFileCard({ evidence, onPreview, onDelete, onReplace, compact }: EvidenceFileCardProps) {
  const [showReplace, setShowReplace] = useState(false);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) onReplace(file);
    setShowReplace(false);
    e.target.value = '';
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-neutral-200 bg-white ${compact ? 'p-2.5' : 'p-3'} transition-all hover:border-primary-300 hover:shadow-card`}>
      <div className={`flex-shrink-0 rounded-lg ${evidence.fileType === 'pdf' ? 'bg-error-50' : 'bg-primary-50'} p-2`}>
        {evidence.fileType === 'pdf' ? (
          <FileText className="text-error-600" size={compact ? 18 : 22} />
        ) : (
          <ImageIcon className="text-primary-600" size={compact ? 18 : 22} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate font-medium text-neutral-800 ${compact ? 'text-xs' : 'text-sm'}`}>{evidence.fileName}</p>
        {!compact && (
          <p className="text-xs text-neutral-500">{formatFileSize(evidence.fileSize)}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPreview}
          className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
          title="معاينة"
        >
          <Eye size={compact ? 16 : 18} />
        </button>
        {onReplace && (
          <label
            className="cursor-pointer rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-accent-50 hover:text-accent-600"
            title="استبدال"
          >
            <RefreshCw size={compact ? 16 : 18} />
            <input type="file" accept=".pdf,image/*" onChange={handleReplace} className="hidden" />
          </label>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-error-50 hover:text-error-600"
            title="حذف"
          >
            <Trash2 size={compact ? 16 : 18} />
          </button>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'تأكيد', danger }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-neutral-700">{message}</p>
        <div className="flex justify-start gap-2">
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            {confirmLabel}
          </button>
          <button onClick={onClose} className="btn-outline">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-2xl bg-neutral-100 p-4">
        <Icon size={32} className="text-neutral-400" />
      </div>
      <h4 className="text-sm font-bold text-neutral-700">{title}</h4>
      {message && <p className="mt-1 text-xs text-neutral-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
