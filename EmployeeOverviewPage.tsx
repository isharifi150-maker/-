import { useEffect, useState } from 'react';
import { FolderOpen, CheckCircle2, Award, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EVALUATION_FORMS, getRatingLabel, getRatingColor } from '@/forms';
import { getEvidenceByUser, getEvaluationsByUser, getScoresByUser } from '@/db';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Evidence, Evaluation, Score } from '@/types';
import { formatDate } from '@/utils';
import { toast } from '@/components/ui/Toast';

export function EmployeeOverviewPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [ev, evals, sc] = await Promise.all([
          getEvidenceByUser(user.id), getEvaluationsByUser(user.id), getScoresByUser(user.id),
        ]);
        setEvidence(ev); setEvaluations(evals); setScores(sc);
      } catch (error) {
        toast('error', error instanceof Error ? error.message : 'تعذر مزامنة بياناتك');
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (!user || !user.formType) return null;

  const form = EVALUATION_FORMS[user.formType];
  const totalCriteria = form.criteria.length;
  const uploadedCriteria = new Set(evidence.map((e) => e.criterionId)).size;
  const progressPercentage = (uploadedCriteria / totalCriteria) * 100;
  const approvedEvals = evaluations.filter((e) => e.status === 'approved');

  const stats = [
    {
      label: 'نسبة الإنجاز',
      value: `${progressPercentage.toFixed(0)}%`,
      icon: TrendingUp,
      color: 'from-primary-600 to-primary-400',
      bg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      label: 'إجمالي الشواهد',
      value: evidence.length.toString(),
      icon: FolderOpen,
      color: 'from-secondary-600 to-secondary-400',
      bg: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
    },
    {
      label: 'البنود المكتملة',
      value: `${uploadedCriteria}/${totalCriteria}`,
      icon: CheckCircle2,
      color: 'from-success-600 to-success-400',
      bg: 'bg-success-50',
      iconColor: 'text-success-600',
    },
    {
      label: 'التقييمات المعتمدة',
      value: approvedEvals.length.toString(),
      icon: Award,
      color: 'from-accent-600 to-accent-400',
      bg: 'bg-accent-50',
      iconColor: 'text-accent-600',
    },
  ];

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-center text-sm text-primary-700">جاري المزامنة مع Supabase...</div>}
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-bl from-secondary-700 via-secondary-600 to-primary-600 p-6 text-white shadow-elevated">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">أهلاً، {user.fullName}</h3>
            <p className="mt-1 text-sm opacity-90">
              نموذج التقييم: {form.shortName} — {form.criteria.length} بنداً
            </p>
          </div>
          <div className="hidden rounded-2xl bg-white/15 px-6 py-4 backdrop-blur-sm sm:block">
            <p className="text-3xl font-bold">{progressPercentage.toFixed(0)}%</p>
            <p className="text-xs opacity-80">نسبة الإنجاز</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={progressPercentage} showValue={false} size="lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className={`mb-3 inline-flex rounded-xl ${stat.bg} p-2.5`}>
                <Icon size={22} className={stat.iconColor} />
              </div>
              <p className="text-2xl font-bold text-neutral-800">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Criteria progress breakdown */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-800">تقدّم البنود</h3>
          <button
            onClick={() => onNavigate('evidence')}
            className="btn-ghost text-primary-600"
          >
            <FolderOpen size={16} />
            إدارة الشواهد
          </button>
        </div>
        <div className="space-y-3">
          {form.criteria.map((criterion, idx) => {
            const hasEvidence = evidence.some((e) => e.criterionId === criterion.id);
            const evCount = evidence.filter((e) => e.criterionId === criterion.id).length;
            return (
              <div key={criterion.id} className="flex items-center gap-3">
                <span className="w-6 flex-shrink-0 text-center text-xs font-bold text-neutral-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">{criterion.label}</span>
                    <span className={`badge ${hasEvidence ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {hasEvidence ? `${evCount} شاهد` : 'لم يُرفع'}
                    </span>
                  </div>
                </div>
                {hasEvidence ? (
                  <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-neutral-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation results */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-800">نتائج التقييم</h3>
          <button
            onClick={() => onNavigate('results')}
            className="btn-ghost text-primary-600"
          >
            <Award size={16} />
            عرض التفاصيل
          </button>
        </div>
        {approvedEvals.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle size={28} className="mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-500">لا توجد تقييمات معتمدة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedEvals.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary-50 p-2">
                    <FileText size={20} className="text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800">
                      {ev.period === 'midyear' ? 'التقييم النصف سنوي' : 'التقييم السنوي'}
                    </p>
                    <p className="text-xs text-neutral-500">{formatDate(ev.approvedAt || ev.updatedAt)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xl font-bold ${getRatingColor(ev.totalScore)}`}>
                    {ev.totalScore.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500">{ev.ratingLabel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
