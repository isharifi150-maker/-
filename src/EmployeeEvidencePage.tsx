import { useEffect, useState, useCallback } from 'react';
import { Upload, FileText, ImageIcon, Trash2, Eye, RefreshCw, FolderOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EVALUATION_FORMS } from '@/forms';
import { getEvidenceByUser, uploadEvidenceFile, deleteEvidence } from '@/db';
import { FilePreviewModal, EmptyState, EvidenceFileCard } from '@/components/ui/FilePreview';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/ui/FilePreview';
import { toast } from '@/components/ui/Toast';
import { generateId } from '@/utils';
import type { Evidence } from '@/types';

export function EmployeeEvidencePage() {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(true);

  const loadEvidence = useCallback(async () => {
    if (!user) return;
    setLoadingEvidence(true);
    try {
      const data = await getEvidenceByUser(user.id);
      setEvidence(data);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'تعذر مزامنة الشواهد مع السحابة');
    } finally {
      setLoadingEvidence(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  if (!user || !user.formType) return null;

  const form = EVALUATION_FORMS[user.formType];
  const totalCriteria = form.criteria.length;
  const uploadedCriteria = new Set(evidence.map((e) => e.criterionId)).size;
  const progressPercentage = (uploadedCriteria / totalCriteria) * 100;

  const handleFileUpload = async (criterionId: string, file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('error', 'حجم الملف يجب ألا يتجاوز 10 ميجابايت');
      return;
    }
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      toast('error', 'يُسمح فقط برفع ملفات PDF أو الصور');
      return;
    }

    setUploadingFor(criterionId);
    try {
      await uploadEvidenceFile({
        id: generateId(),
        userId: user.id,
        criterionId,
        file,
      });
      await loadEvidence();
      toast('success', 'تم رفع الشاهد بنجاح');
    } catch {
      toast('error', 'فشل رفع الملف');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvidence(deleteTarget.id);
      await loadEvidence();
      toast('success', 'تم حذف الشاهد من السحابة');
      setDeleteTarget(null);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حذف الشاهد');
    }
  };

  const handleReplace = async (criterionId: string, oldId: string, file: File) => {
    if (!user) return;
    setUploadingFor(criterionId);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يجب ألا يتجاوز 10 ميجابايت');
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      if (!isPdf && !isImage) throw new Error('يُسمح فقط برفع ملفات PDF أو الصور');
      // Upload first, then remove the old object to avoid data loss on failed uploads.
      await uploadEvidenceFile({ id: generateId(), userId: user.id, criterionId, file });
      await deleteEvidence(oldId);
      await loadEvidence();
      toast('success', 'تم استبدال الشاهد بنجاح');
    } catch {
      toast('error', 'فشل استبدال الملف');
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <div className="space-y-6">
      {loadingEvidence && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <RefreshCw size={16} className="animate-spin" />
          جاري مزامنة الشواهد مع Supabase...
        </div>
      )}
      {/* Progress bar */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-primary-600" size={20} />
            <h3 className="text-base font-bold text-neutral-800">نسبة الإنجاز الكلية</h3>
          </div>
          <span className="text-sm font-bold text-primary-600">
            {uploadedCriteria} / {totalCriteria} بند
          </span>
        </div>
        <ProgressBar value={progressPercentage} size="lg" />
      </div>

      {/* Criteria list */}
      <div className="space-y-4">
        {form.criteria.map((criterion, idx) => {
          const criterionEvidence = evidence.filter((e) => e.criterionId === criterion.id);
          const hasEvidence = criterionEvidence.length > 0;
          return (
            <div key={criterion.id} className="card">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-sm font-bold text-secondary-700">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-800">{criterion.label}</h4>
                    <span className="badge bg-primary-50 text-primary-700">الوزن: {criterion.weight}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasEvidence ? (
                    <span className="badge bg-success-100 text-success-700">
                      <CheckCircle2 size={12} /> مكتمل
                    </span>
                  ) : (
                    <span className="badge bg-neutral-100 text-neutral-500">غير مكتمل</span>
                  )}
                  <label className={`btn-primary cursor-pointer text-xs ${uploadingFor === criterion.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload size={14} />
                    {uploadingFor === criterion.id ? 'جاري الرفع...' : 'رفع شاهد'}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(criterion.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {criterionEvidence.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {criterionEvidence.map((ev) => (
                    <EvidenceFileCard
                      key={ev.id}
                      evidence={ev}
                      onPreview={() => setPreviewEvidence(ev)}
                      onDelete={() => setDeleteTarget(ev)}
                      onReplace={(file) => handleReplace(criterion.id, ev.id, file)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-neutral-200 py-6 text-center">
                  <FileText className="mx-auto mb-2 text-neutral-300" size={24} />
                  <p className="text-xs text-neutral-400">لم يتم رفع أي شاهد لهذا البند</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FilePreviewModal
        evidence={previewEvidence}
        onClose={() => setPreviewEvidence(null)}
        onDelete={(id) => {
          const ev = evidence.find((e) => e.id === id);
          if (ev) setDeleteTarget(ev);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الشاهد"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fileName}"؟ سيؤثر ذلك على نسبة الإنجاز.`}
        confirmLabel="نعم، حذف"
        danger
      />
    </div>
  );
}
