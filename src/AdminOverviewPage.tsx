import { useEffect, useState } from 'react';
import { 
  Users, 
  Award, 
  TrendingUp, 
  FileText, 
  Printer 
} from 'lucide-react';
import { getAllUsers, getEvidenceByUser, getEvaluationsByUser } from './db';
import type { User, Evaluation } from './types';
import { toast } from './Toast';

export function AdminOverviewPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({});
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);

  // حالة التحكم بنافذة طباعة استمارة المعلم
  const [selectedForPrint, setSelectedForPrint] = useState<{ emp: User; evalData?: Evaluation } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const staff = users.filter(u => u.role !== 'admin');
        setEmployees(staff);

        const evCounts: Record<string, number> = {};
        const evals: Record<string, Evaluation> = {};

        await Promise.all(
          staff.map(async (emp) => {
            const [userEvs, userEvals] = await Promise.all([
              getEvidenceByUser(emp.id).catch(() => []),
              getEvaluationsByUser(emp.id).catch(() => [])
            ]);
            evCounts[emp.id] = userEvs.length;
            if (userEvals && userEvals.length > 0) {
              evals[emp.id] = userEvals[0];
            }
          })
        );

        setEvidenceCounts(evCounts);
        setEvaluations(evals);
      } catch (err) {
        toast('error', 'حدث خطأ أثناء تحميل بيانات لوحة القيادة');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // دالة تصدير تقرير التقييمات الشامل بصيغة Excel (CSV)
  const handleExportCSV = () => {
    if (!employees.length) {
      toast('info', 'لا توجد بيانات معلمين لتصديرها');
      return;
    }
    const headers = ['رقم السجل المدني', 'اسم المعلم / الموظف', 'المسمى الوظيفي', 'عدد الشواهد', 'المجموع الكلي', 'المدير المعتمد'];
    const rows = employees.map(emp => {
      const ev = evaluations[emp.id];
      const count = evidenceCounts[emp.id] || 0;
      return [
        `'${emp.civilId || ''}`,
        `"${emp.fullName || ''}"`,
        `"${emp.jobTitle || 'معلم'}"`,
        count,
        ev ? `${ev.totalScore || 0}%` : 'غير مقيّم',
        '"فيصل علي قحل"'
      ];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_تقييمات_المعلمين_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast('success', 'تم تصدير كشف التقرير بنجاح');
  };

  const totalEvaluated = Object.keys(evaluations).length;
  const avgScore = totalEvaluated > 0
    ? Math.round(
        Object.values(evaluations).reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalEvaluated
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-gray-500 text-sm">جاري تحميل لوحة الإدارة...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* ترويسة الصفحة مع زر تصدير التقرير */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة المتابعة والتقارير</h1>
          <p className="text-sm text-gray-500 mt-1">نظرة عامة على أداء المعلمين ونسب الإنجاز في التقييمات</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <FileText className="w-4 h-4" />
          تصدير كشف التقييمات (Excel)
        </button>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">إجمالي المعلمين المقيّمين</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalEvaluated} / {employees.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">متوسط درجات الأداء</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{avgScore}%</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">نسبة إنجاز التقييمات</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {employees.length > 0 ? Math.round((totalEvaluated / employees.length) * 100) : 0}%
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* جدول كشف المعلمين مع أزرار الإجراءات والطباعة */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-base">سجل أداء المعلمين</h2>
          <span className="text-xs text-gray-500">{employees.length} معلم وموظف</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs">
              <tr>
                <th className="p-3.5">المعلم</th>
                <th className="p-3.5 text-center">السجل المدني</th>
                <th className="p-3.5 text-center">الشواهد المرفوعة</th>
                <th className="p-3.5 text-center">المجموع</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const ev = evaluations[emp.id];
                const count = evidenceCounts[emp.id] || 0;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-medium text-gray-900">{emp.fullName}</div>
                      <div className="text-xs text-gray-500">{emp.jobTitle || 'معلم'}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono text-xs text-gray-600">
                      {emp.civilId || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {count} شاهد
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-600">
                      {ev ? `${ev.totalScore || 0}%` : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedForPrint({ emp, evalData: ev })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          title="طباعة استمارة التقييم الرسمية"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          طباعة الاستمارة
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة معاينة الاستمارة الرسمية للطباعة (A4 / PDF) */}
      {selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-4xl w-full p-6 relative print:p-0 print:m-0 print:shadow-none print:w-full">
            {/* شريط الإغلاق وأمر الطباعة */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">معاينة استمارة التقييم الرسمية</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  طباعة / حفظ كـ PDF
                </button>
                <button
                  onClick={() => setSelectedForPrint(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* الاستمارة الرسمية A4 */}
            <div id="official-print-modal" className="font-sans text-right dir-rtl leading-relaxed p-4 border border-gray-300 rounded-lg print:border-none print:p-0">
              <div className="border-b-2 border-gray-900 pb-3 mb-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold">المملكة العربية السعودية</p>
                  <p>وزارة التعليم</p>
                  <p>الإدارة العامة للتعليم</p>
                </div>
                <div className="text-center">
                  <h1 className="text-base font-black underline mb-1">استمارة تقييم الأداء الوظيفي</h1>
                  <p className="text-gray-600">العام الدراسي: 1447 - 1448 هـ</p>
                </div>
                <div className="text-left text-gray-500">
                  <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              {/* بيانات المعلم */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 border border-gray-300 rounded p-2.5 mb-4 text-xs">
                <p><strong>اسم الموظف:</strong> {selectedForPrint.emp.fullName}</p>
                <p><strong>السجل المدني:</strong> {selectedForPrint.emp.civilId}</p>
                <p><strong>المسمى الوظيفي:</strong> {selectedForPrint.emp.jobTitle || 'معلم'}</p>
              </div>

              {/* النتيجة النهائية */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center my-4">
                <span className="text-sm font-bold text-gray-700">الدرجة الكلية المستحقة: </span>
                <span className="text-xl font-extrabold text-emerald-700">
                  {selectedForPrint.evalData?.totalScore ? `${selectedForPrint.evalData.totalScore}%` : '100%'}
                </span>
              </div>

              {/* خانة التوقيعات والاعتماد الرسمي باسم المدير فيصل علي قحل */}
              <div className="grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-gray-300 text-center text-xs">
                <div>
                  <p className="font-bold mb-6">توقيع المعلم بالعلم</p>
                  <p className="font-bold text-gray-900">{selectedForPrint.emp.fullName}</p>
                  <p className="text-gray-400 mt-2">التوقيع: ........................................</p>
                </div>
                <div>
                  <p className="font-bold mb-6">مدير المدرسة (المعتمد)</p>
                  <p className="font-extrabold text-gray-900 text-sm">فيصل علي قحل</p>
                  <p className="text-gray-400 mt-2">الختم والتوقيع: ........................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
