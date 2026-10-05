import { useEffect, useState } from 'react';
import { Users, ClipboardList, Award, TrendingUp, UserCheck, FileText, BarChart3 } from 'lucide-react';
import { EVALUATION_FORMS, getRatingColor } from '@/forms';
import { getAllUsers, getEvidenceByUser, getEvaluationsByUser } from '@/db';
import type { User, Evidence, Evaluation } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { toast } from '@/components/ui/Toast';

export function AdminOverviewPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, Evidence[]>>({});
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const emp = users.filter((u) => u.role === 'employee');
        setEmployees(emp);
        const rows = await Promise.all(emp.map(async (u) => ({ id: u.id, evidence: await getEvidenceByUser(u.id), evaluations: await getEvaluationsByUser(u.id) })));
        const evMap: Record<string, Evidence[]> = {};
        const evalMap: Record<string, Evaluation[]> = {};
        rows.forEach((row) => { evMap[row.id] = row.evidence; evalMap[row.id] = row.evaluations; });
        setEvidenceCounts(evMap); setEvaluations(evalMap);
      } catch (error) {
        toast('error', error instanceof Error ? error.message : 'تعذر مزامنة لوحة المعلومات');
      } finally { setLoading(false); }
    })();
  }, []);

  const totalEmployees = employees.length;
  const totalEvidence = Object.values(evidenceCounts).reduce((acc, arr) => acc + arr.length, 0);
  const approvedCount = Object.values(evaluations).reduce(
    (acc, arr) => acc + arr.filter((e) => e.status === 'approved').length, 0
  );

  const avgProgress = employees.length > 0
    ? employees.reduce((acc, emp) => {
        if (!emp.formType) return acc;
        const form = EVALUATION_FORMS[emp.formType];
        const ev = evidenceCounts[emp.id] || [];
        const uploaded = new Set(ev.map((e) => e.criterionId)).size;
        return acc + (uploaded / form.criteria.length) * 100;
      }, 0) / employees.length
    : 0;

  const stats = [
    { label: 'إجمالي الموظفين', value: totalEmployees.toString(), icon: Users, bg: 'bg-secondary-50', iconColor: 'text-secondary-600' },
    { label: 'إجمالي الشواهد', value: totalEvidence.toString(), icon: FileText, bg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { label: 'تقييمات معتمدة', value: approvedCount.toString(), icon: Award, bg: 'bg-success-50', iconColor: 'text-success-600' },
    { label: 'متوسط الإنجاز', value: `${avgProgress.toFixed(0)}%`, icon: TrendingUp, bg: 'bg-accent-50', iconColor: 'text-accent-600' },
  ];

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-center text-sm text-primary-700">جاري المزامنة مع Supabase...</div>}
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-bl from-secondary-700 via-secondary-600 to-primary-600 p-6 text-white shadow-elevated">
        <h3 className="text-xl font-bold">لوحة معلومات المدير</h3>
        <p className="mt-1 text-sm opacity-90">نظرة عامة على أداء الكادر وتقدم التقييمات</p>
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

      {/* Staff overview table */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-800">تقدّم الموظفين</h3>
          <button
            onClick={() => onNavigate('staff')}
            className="btn-ghost text-primary-600"
          >
            <Users size={16} />
            إدارة الكادر
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Users size={28} className="mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-500">لا يوجد موظفون بعد</p>
            <button onClick={() => onNavigate('staff')} className="btn-primary mt-3">
              إضافة موظف جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-right text-xs text-neutral-500">
                  <th className="pb-3 pr-2 font-bold">الاسم</th>
                  <th className="hidden pb-3 px-2 font-bold md:table-cell">النموذج</th>
                  <th className="hidden pb-3 px-2 font-bold sm:table-cell">الشواهد</th>
                  <th className="hidden pb-3 px-2 font-bold lg:table-cell">نسبة الإنجاز</th>
                  <th className="hidden pb-3 px-2 font-bold sm:table-cell">التقييم</th>
                  <th className="pb-3 pl-2 font-bold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const form = emp.formType ? EVALUATION_FORMS[emp.formType] : null;
                  const ev = evidenceCounts[emp.id] || [];
                  const evals = evaluations[emp.id] || [];
                  const uploaded = form ? new Set(ev.map((e) => e.criterionId)).size : 0;
                  const progress = form ? (uploaded / form.criteria.length) * 100 : 0;
                  const approvedEval = evals.find((e) => e.status === 'approved');

                  return (
                    <tr key={emp.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-800">{emp.fullName}</p>
                            <p className="text-xs text-neutral-500">{emp.civilId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-2 text-xs text-neutral-600 md:table-cell">{form?.shortName || '—'}</td>
                      <td className="hidden px-2 text-xs text-neutral-600 sm:table-cell">{ev.length}</td>
                      <td className="hidden px-2 lg:table-cell">
                        <ProgressBar value={progress} size="sm" showValue={false} />
                        <span className="mt-1 block text-xs text-neutral-500">{progress.toFixed(0)}%</span>
                      </td>
                      <td className="hidden px-2 sm:table-cell">
                        {approvedEval ? (
                          <span className={`font-bold ${getRatingColor(approvedEval.totalScore)}`}>
                            {approvedEval.totalScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-2">
                        <button
                          onClick={() => onNavigate('evaluation')}
                          className="btn-ghost text-xs text-primary-600"
                        >
                          <ClipboardList size={14} />
                          تقييم
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
