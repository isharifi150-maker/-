import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, FileText, Eye, Star, Save, CheckCircle2, Award,
  MessageSquare, Lock
} from 'lucide-react';
import { EVALUATION_FORMS, RATING_LABELS, getRatingLabel, getRatingColor } from '@/forms';
import {
  getAllUsers, getEvidenceByUser, getScoresByPeriod, saveScore,
  getEvaluation, saveEvaluation
} from '@/db';
import { FilePreviewModal, EvidenceFileCard, EmptyState } from '@/components/ui/FilePreview';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { toast } from '@/components/ui/Toast';
import { generateId, formatDate } from '@/utils';
import type { User, Evidence, Score, Evaluation } from '@/types';

export function AdminEvaluationPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'midyear' | 'final'>('midyear');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);

  const loadEmployees = useCallback(async () => {
    try {
      const users = await getAllUsers();
      const emps = users.filter((u) => u.role === 'employee');
      setEmployees(emps);
      if (emps.length > 0 && !selectedUserId) setSelectedUserId(emps[0].id);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'تعذر مزامنة قائمة الموظفين');
    }
  }, [selectedUserId]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const loadData = useCallback(async () => {
    if (!selectedUserId) { setSyncing(false); return; }
    setSyncing(true);
    try {
      const [ev, sc, evalData] = await Promise.all([
        getEvidenceByUser(selectedUserId),
        getScoresByPeriod(selectedUserId, period),
        getEvaluation(selectedUserId, period),
      ]);
      setEvidence(ev);
      setScores(sc);
      setEvaluation(evalData || null);
      setGeneralNotes(evalData?.generalNotes || '');
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'تعذر مزامنة بيانات التقييم');
    } finally { setSyncing(false); }
  }, [selectedUserId, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedUser = employees.find((e) => e.id === selectedUserId);
  const form = selectedUser?.formType ? EVALUATION_FORMS[selectedUser.formType] : null;

  const getScore = (criterionId: string): Score | undefined =>
    scores.find((s) => s.criterionId === criterionId);

  const updateScore = async (criterionId: string, rating: number, notes: string) => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
    const existing = getScore(criterionId);
    if (existing) {
      const updated = { ...existing, rating, notes, updatedAt: Date.now() };
      await saveScore(updated);
    } else {
      const newScore: Score = {
        id: generateId(),
        userId: selectedUserId,
        criterionId,
        rating,
        notes,
        period,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveScore(newScore);
    }
    await loadData();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حفظ درجة البند');
    } finally { setLoading(false); }
  };

  const calculateTotal = (): number => {
    if (!form) return 0;
    let total = 0;
    for (const criterion of form.criteria) {
      const score = getScore(criterion.id);
      if (score) {
        total += (score.rating / 5) * criterion.weight;
      }
    }
    return total;
  };

  const handleSaveDraft = async () => {
    if (!selectedUserId || !form) return;
    setLoading(true);
    try {
      const total = calculateTotal();
      const existing = await getEvaluation(selectedUserId, period);
      const evalData: Evaluation = {
        id: existing?.id || generateId(),
        userId: selectedUserId,
        period,
        status: existing?.status === 'approved' ? 'approved' : 'submitted',
        generalNotes,
        totalScore: total,
        ratingLabel: getRatingLabel(total),
        approvedAt: existing?.approvedAt,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await saveEvaluation(evalData);
      await loadData();
      toast('success', 'تم حفظ التقييم');
    } catch {
      toast('error', 'فشل حفظ التقييم');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUserId || !form) return;
    setLoading(true);
    try {
      const total = calculateTotal();
      const existing = await getEvaluation(selectedUserId, period);
      const evalData: Evaluation = {
        id: existing?.id || generateId(),
        userId: selectedUserId,
        period,
        status: 'approved',
        generalNotes,
        totalScore: total,
        ratingLabel: getRatingLabel(total),
        approvedAt: Date.now(),
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await saveEvaluation(evalData);
      await loadData();
      toast('success', 'تم اعتماد التقييم بنجاح');
    } catch {
      toast('error', 'فشل اعتماد التقييم');
    } finally {
      setLoading(false);
    }
  };

  const totalScore = calculateTotal();

  if (employees.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ClipboardList}
          title="لا يوجد موظفون للتقييم"
          message="أضف موظفين من قسم إدارة الكادر أولاً"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {syncing && <div className="flex items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700"><Save size={16} className="animate-pulse" />جاري مزامنة بيانات التقييم...</div>}
      {/* Employee + period selector */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <label className="label-field">اختر الموظف</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input-field"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} — {emp.civilId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">فترة التقييم</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('midyear')}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  period === 'midyear' ? 'bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-card' : 'bg-white border border-neutral-200 text-neutral-600'
                }`}
              >
                نصف سنوي
              </button>
              <button
                onClick={() => setPeriod('final')}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  period === 'final' ? 'bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-card' : 'bg-white border border-neutral-200 text-neutral-600'
                }`}
              >
                سنوي
              </button>
            </div>
          </div>
        </div>

        {selectedUser && form && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 font-bold text-secondary-700">
              {selectedUser.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-neutral-800">{selectedUser.fullName}</p>
              <p className="text-xs text-neutral-500">
                {form.name} • {form.criteria.length} بند • {selectedUser.jobTitle || 'موظف'}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${getRatingColor(totalScore)}`}>{totalScore.toFixed(2)}</p>
              <p className="text-xs text-neutral-500">{getRatingLabel(totalScore)}</p>
            </div>
          </div>
        )}
      </div>

      {selectedUser && form && (
        <>
          {/* Criteria evaluation list */}
          <div className="space-y-4">
            {form.criteria.map((criterion, idx) => {
              const score = getScore(criterion.id);
              const criterionEvidence = evidence.filter((e) => e.criterionId === criterion.id);
              const weightedScore = score ? (score.rating / 5) * criterion.weight : 0;

              return (
                <AdminCriterionCard
                  key={criterion.id}
                  index={idx}
                  criterion={criterion}
                  score={score}
                  evidence={criterionEvidence}
                  onPreview={setPreviewEvidence}
                  onRate={(rating) => updateScore(criterion.id, rating, score?.notes || '')}
                  onNotesChange={(notes) => updateScore(criterion.id, score?.rating || 0, notes)}
                  weightedScore={weightedScore}
                />
              );
            })}
          </div>

          {/* General notes and actions */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="text-secondary-600" size={20} />
              <h3 className="text-base font-bold text-neutral-800">التوصيات والملاحظات العامة</h3>
            </div>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="أضف توصيات وملاحظات عامة للموظف..."
            />

            {/* Summary */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-neutral-50 p-4 text-center">
                <p className="text-xs text-neutral-500">الدرجة الكلية</p>
                <p className={`text-2xl font-bold ${getRatingColor(totalScore)}`}>{totalScore.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 text-center">
                <p className="text-xs text-neutral-500">التقدير</p>
                <p className="text-lg font-bold text-neutral-800">{getRatingLabel(totalScore)}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 text-center">
                <p className="text-xs text-neutral-500">الحالة</p>
                <p className="text-lg font-bold text-neutral-800">
                  {evaluation?.status === 'approved' ? 'معتمد' : evaluation?.status === 'submitted' ? 'محفوظ' : 'مسودة'}
                </p>
              </div>
            </div>

            {evaluation?.approvedAt && (
              <p className="mt-3 text-center text-xs text-neutral-400">
                اعتمد في: {formatDate(evaluation.approvedAt)}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-start gap-2">
              <button onClick={handleSaveDraft} disabled={loading} className="btn-secondary">
                <Save size={18} />
                {loading ? 'جاري الحفظ...' : 'حفظ التقييم'}
              </button>
              <button onClick={handleApprove} disabled={loading} className="btn-primary">
                <CheckCircle2 size={18} />
                {evaluation?.status === 'approved' ? 'إعادة الاعتماد' : 'اعتماد التقييم'}
              </button>
            </div>
          </div>
        </>
      )}

      <FilePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}

interface AdminCriterionCardProps {
  index: number;
  criterion: { id: string; label: string; weight: number };
  score: Score | undefined;
  evidence: Evidence[];
  onPreview: (ev: Evidence) => void;
  onRate: (rating: number) => void;
  onNotesChange: (notes: string) => void;
  weightedScore: number;
}

function AdminCriterionCard({ index, criterion, score, evidence, onPreview, onRate, onNotesChange, weightedScore }: AdminCriterionCardProps) {
  const [showNotes, setShowNotes] = useState(!!score?.notes);
  const [localNotes, setLocalNotes] = useState(score?.notes || '');

  useEffect(() => {
    setLocalNotes(score?.notes || '');
    setShowNotes(!!score?.notes);
  }, [score?.notes]);

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-sm font-bold text-secondary-700">
            {index + 1}
          </span>
          <div>
            <h4 className="text-sm font-bold text-neutral-800">{criterion.label}</h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge bg-primary-50 text-primary-700">الوزن: {criterion.weight}%</span>
              {score && (
                <span className="badge bg-secondary-50 text-secondary-700">
                  الدرجة: {weightedScore.toFixed(2)}%
                </span>
              )}
              {evidence.length > 0 && (
                <span className="badge bg-success-100 text-success-700">
                  {evidence.length} شاهد
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence preview */}
      {evidence.length > 0 ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {evidence.map((ev) => (
            <EvidenceFileCard
              key={ev.id}
              evidence={ev}
              onPreview={() => onPreview(ev)}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2">
          <Lock size={14} className="text-neutral-400" />
          <p className="text-xs text-neutral-400">لم يرفع الموظف أي شاهد لهذا البند</p>
        </div>
      )}

      {/* Rating selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-neutral-600">التقييم:</span>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
              score?.rating === rating
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-card'
                : 'border-neutral-200 bg-white text-neutral-500 hover:border-primary-300'
            }`}
          >
            <Star size={14} className={score?.rating === rating ? 'fill-primary-500 text-primary-500' : ''} />
            {rating} — {RATING_LABELS[rating]}
          </button>
        ))}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="btn-ghost text-xs"
        >
          <MessageSquare size={14} />
          {showNotes ? 'إخفاء الملاحظة' : 'إضافة ملاحظة'}
        </button>
      </div>

      {/* Notes */}
      {showNotes && (
        <div className="mt-3 animate-fade-in">
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => onNotesChange(localNotes)}
            className="input-field min-h-[60px] resize-y text-sm"
            placeholder="ملاحظات حول هذا البند..."
          />
        </div>
      )}
    </div>
  );
}
