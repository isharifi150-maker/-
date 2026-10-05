import { useEffect, useState } from 'react';
import { Award, FileText, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EVALUATION_FORMS, getRatingLabel, getRatingColor } from '@/forms';
import { getEvaluationsByUser, getScoresByUser, getEvidenceByUser } from '@/db';
import { FilePreviewModal } from '@/components/ui/FilePreview';
import { EmptyState } from '@/components/ui/FilePreview';
import { formatDate } from '@/utils';
import type { Evaluation, Score, Evidence } from '@/types';
import { toast } from '@/components/ui/Toast';

const periodLabels: Record<string, string> = {
  midyear: 'التقييم النصف سنوي',
  final: 'التقييم السنوي',
};

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: 'مسودة', class: 'bg-neutral-100 text-neutral-600' },
  submitted: { label: 'قيد المراجعة', class: 'bg-accent-100 text-accent-700' },
  approved: { label: 'معتمد', class: 'bg-success-100 text-success-700' },
};

export function EmployeeResultsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'midyear' | 'final'>('midyear');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [evals, sc, ev] = await Promise.all([
          getEvaluationsByUser(user.id), getScoresByUser(user.id), getEvidenceByUser(user.id),
        ]);
        setEvaluations(evals); setScores(sc); setEvidence(ev);
      } catch (error) {
        toast('error', error instanceof Error ? error.message : 'تعذر مزامنة النتائج');
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (!user || !user.formType) return null;

  const form = EVALUATION_FORMS[user.formType];
  const currentEval = evaluations.find((e) => e.period === selectedPeriod);
  const periodScores = scores.filter((s) => s.period === selectedPeriod);
  const status = currentEval?.status || 'draft';

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-center text-sm text-primary-700">جاري مزامنة النتائج...</div>}
      {/* Period selector */}
      <div className="grid grid-cols-1 gap-2 sm:flex">
        {(['midyear', 'final'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`w-full rounded-xl px-5 py-2.5 text-sm font-bold transition-all sm:w-auto ${
              selectedPeriod === p
                ? 'bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-card'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Overall result card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-secondary-50 p-3">
              <Award className="text-secondary-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-800">{periodLabels[selectedPeriod]}</h3>
              <span className={`badge ${statusLabels[status].class}`}>
                {statusLabels[status].label}
              </span>
            </div>
          </div>
          {currentEval && currentEval.status === 'approved' && (
            <div className="text-left">
              <p className={`text-3xl font-bold ${getRatingColor(currentEval.totalScore)}`}>
                {currentEval.totalScore.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500">{currentEval.ratingLabel}</p>
            </div>
          )}
        </div>

        {currentEval && currentEval.status === 'approved' && currentEval.generalNotes && (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-1 text-xs font-bold text-neutral-500">ملاحظات المدير:</p>
            <p className="text-sm text-neutral-700">{currentEval.generalNotes}</p>
            {currentEval.approvedAt && (
              <p className="mt-2 text-xs text-neutral-400">اعتمد في: {formatDate(currentEval.approvedAt)}</p>
            )}
          </div>
        )}

        {currentEval && currentEval.status !== 'approved' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
            <Clock size={18} className="text-accent-600" />
            <p className="text-sm text-accent-800">
              {status === 'draft'
                ? 'لم يتم تقييم هذا الفترة بعد'
                : 'التقييم قيد المراجعة من قبل المدير'}
            </p>
          </div>
        )}

        {!currentEval && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <AlertCircle size={18} className="text-neutral-400" />
            <p className="text-sm text-neutral-500">لا يوجد تقييم لهذه الفترة</p>
          </div>
        )}
      </div>

      {/* Detailed scores */}
      <div className="card">
        <h3 className="mb-4 text-base font-bold text-neutral-800">تفاصيل التقييم حسب البنود</h3>
        {periodScores.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا توجد درجات"
            message="لم يتم تقييم أي بند في هذه الفترة بعد"
          />
        ) : (
          <div className="space-y-3">
            {form.criteria.map((criterion) => {
              const score = periodScores.find((s) => s.criterionId === criterion.id);
              const criterionEvidence = evidence.filter((e) => e.criterionId === criterion.id);
              if (!score) return null;

              const weightedScore = (score.rating / 5) * criterion.weight;
              return (
                <div key={criterion.id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-800">{criterion.label}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="badge bg-primary-50 text-primary-700">وزن {criterion.weight}%</span>
                        <span className="badge bg-secondary-50 text-secondary-700">
                          التقييم: {score.rating}/5
                        </span>
                        <span className="badge bg-neutral-100 text-neutral-600">
                          الدرجة: {weightedScore.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {score.notes && (
                    <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-2">
                      <p className="text-xs text-neutral-500">ملاحظة المدير:</p>
                      <p className="text-sm text-neutral-700">{score.notes}</p>
                    </div>
                  )}

                  {criterionEvidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {criterionEvidence.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setPreviewEvidence(ev)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-all hover:border-primary-300 hover:text-primary-600"
                        >
                          {ev.fileType === 'pdf' ? <FileText size={14} /> : <Eye size={14} />}
                          {ev.fileName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total */}
            {currentEval && currentEval.status === 'approved' && (
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-l from-primary-600 to-primary-500 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  <span className="font-bold">الدرجة الكلية</span>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold">{currentEval.totalScore.toFixed(2)}%</span>
                  <span className="mr-2 text-sm opacity-90">{currentEval.ratingLabel}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FilePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}
