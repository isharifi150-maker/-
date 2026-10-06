import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, KeyRound, RefreshCw, Eye, EyeOff, 
  Users, GraduationCap, FlaskConical, Trophy, HeartPulse, Compass, 
  X, Check, Printer, FileSpreadsheet, Download, type LucideIcon 
} from 'lucide-react';
import { EVALUATION_FORMS } from '@/forms';
import { getAllUsers, saveUser, deleteUser, getUserByCivilId, getAllEvaluations } from '@/db';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/FilePreview';
import { toast } from '@/components/ui/Toast';
import { generateId, generatePassword, formatDateShort } from '@/utils';
import type { User, FormType, Evaluation } from '@/types';

const formIconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Trophy,
  HeartPulse,
  FlaskConical,
  Compass,
};

interface StaffFormData {
  fullName: string;
  civilId: string;
  jobTitle: string;
  formType: FormType;
  password: string;
  mustChangePassword: boolean;
}

export function AdminStaffPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(true);
  const [saving, setSaving] = useState(false);

  // حالة استمارة الطباعة
  const [printUser, setPrintUser] = useState<User | null>(null);
  const printContentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '',
    civilId: '',
    jobTitle: '',
    formType: 'teacher',
    password: '',
    mustChangePassword: true,
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const loadData = useCallback(async () => {
    setSyncing(true);
    try {
      const [users, evals] = await Promise.all([
        getAllUsers(),
        getAllEvaluations().catch(() => [])
      ]);
      setEmployees(users.filter((u) => u.role === 'employee'));
      setEvaluations(evals);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'تعذر مزامنة بيانات الكادر');
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = employees.filter((e) =>
    e.fullName.includes(search) ||
    e.civilId.includes(search) ||
    (e.jobTitle || '').includes(search)
  );

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      civilId: '',
      jobTitle: '',
      formType: 'teacher',
      password: '',
      mustChangePassword: true
    });
    setShowForm(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      civilId: user.civilId,
      jobTitle: user.jobTitle || '',
      formType: user.formType || 'teacher',
      password: user.password,
      mustChangePassword: user.mustChangePassword,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.fullName.trim() || !formData.civilId.trim() || !formData.password.trim()) {
        toast('error', 'يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const existing = await getUserByCivilId(formData.civilId.trim());
      if (existing && existing.id !== editingUser?.id) {
        toast('error', 'رقم السجل المدني مستخدم بالفعل');
        return;
      }

      if (editingUser) {
        const updated: User = {
          ...editingUser,
          fullName: formData.fullName.trim(),
          civilId: formData.civilId.trim(),
          jobTitle: formData.jobTitle.trim(),
          formType: formData.formType,
          password: formData.password,
          mustChangePassword: formData.mustChangePassword,
        };
        await saveUser(updated);
        toast('success', 'تم تحديث بيانات الموظف');
      } else {
        const newUser: User = {
          id: generateId(),
          fullName: formData.fullName.trim(),
          civilId: formData.civilId.trim(),
          jobTitle: formData.jobTitle.trim(),
          role: 'employee',
          formType: formData.formType,
          password: formData.password,
          mustChangePassword: formData.mustChangePassword,
          createdAt: Date.now(),
        };
        await saveUser(newUser);
        toast('success', 'تم إضافة الموظف بنجاح');
      }

      setShowForm(false);
      await loadData();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حفظ البيانات في Supabase');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteUser(deleteTarget.id);
      toast('success', 'تم حذف الموظف وكل بياناته من السحابة');
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حذف الموظف من Supabase');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    setSaving(true);
    try {
      const updated = { ...resetTarget, password: newPassword, mustChangePassword: true };
      await saveUser(updated);
      toast('success', `تمت إعادة ضبط كلمة المرور: ${newPassword}`);
      setResetTarget(null);
      await loadData();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل تحديث كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const openResetDialog = (user: User) => {
    setResetTarget(user);
    setResetPasswordValue(generatePassword());
  };

  // تصدير كشف الإكسل العربي المنسق
  const exportToExcel = () => {
    if (employees.length === 0) {
      toast('info', 'لا يوجد موظفون لتصدير بياناتهم');
      return;
    }

    const headers = ['م', 'الاسم الكامل', 'رقم السجل المدني', 'المسمى الوظيفي', 'نموذج التقييم', 'حالة التقييم', 'الدرجة الكلية', 'تاريخ الإضافة'];
    const rows = employees.map((emp, index) => {
      const userEval = evaluations.find(e => e.employeeId === emp.id);
      const form = emp.formType ? EVALUATION_FORMS[emp.formType] : null;
      return [
        index + 1,
        `"${emp.fullName.replace(/"/g, '""')}"`,
        `'${emp.civilId}`,
        `"${(emp.jobTitle || 'معلم').replace(/"/g, '""')}"`,
        `"${form ? form.shortName : 'عام'}"`,
        userEval ? (userEval.status === 'completed' ? 'معتمد' : 'مسودة') : 'لم يقيم',
        userEval ? (userEval.totalScore !== undefined ? userEval.totalScore : '-') : '-',
        formatDateShort(emp.createdAt)
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_تقييم_الكادر_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('success', 'تم تنزيل كشف التقييمات بنجاح');
  };

  // دالة تشغيل الطباعة
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {syncing && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <RefreshCw size={16} className="animate-spin" />
          جاري المزامنة مع Supabase...
        </div>
      )}

      {/* شريط الإجراءات والبحث */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pr-10"
            placeholder="بحث بالاسم أو رقم السجل المدني..."
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <button
            onClick={exportToExcel}
            className="btn-outline flex-1 sm:flex-initial flex items-center justify-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            title="تصدير كشف إكسل كامل"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            تصدير كشف Excel
          </button>

          <button onClick={openAddForm} className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2">
            <UserPlus size={18} />
            إضافة موظف
          </button>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Users size={32} className="mb-3 text-neutral-400" />
            <p className="text-sm font-bold text-neutral-700">
              {employees.length === 0 ? 'لا يوجد موظفون بعد' : 'لا توجد نتائج مطابقة'}
            </p>
            {employees.length === 0 && (
              <button onClick={openAddForm} className="btn-primary mt-4">
                <UserPlus size={16} /> إضافة أول موظف
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-right text-xs text-neutral-500">
                  <th className="pb-3 pr-2 font-bold">الاسم</th>
                  <th className="hidden pb-3 px-2 font-bold sm:table-cell">رقم السجل</th>
                  <th className="hidden pb-3 px-2 font-bold md:table-cell">النموذج</th>
                  <th className="hidden pb-3 px-2 font-bold lg:table-cell">كلمة المرور</th>
                  <th className="hidden pb-3 px-2 font-bold xl:table-cell">أضيف في</th>
                  <th className="pb-3 pl-2 font-bold text-center">الإجراءات والطباعة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const form = emp.formType ? EVALUATION_FORMS[emp.formType] : null;
                  const FormIcon = form ? formIconMap[form.icon] : null;
                  const showPwd = showPasswords[emp.id];

                  return (
                    <tr key={emp.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-sm font-bold text-secondary-700">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-800">{emp.fullName}</p>
                            {emp.jobTitle && <p className="text-xs text-neutral-500">{emp.jobTitle}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-2 font-mono text-xs text-neutral-600 sm:table-cell">{emp.civilId}</td>
                      <td className="hidden px-2 md:table-cell">
                        {form && FormIcon ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                            <FormIcon size={14} /> {form.shortName}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="hidden px-2 lg:table-cell">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-neutral-600">
                            {showPwd ? emp.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPasswords((p) => ({ ...p, [emp.id]: !p[emp.id] }))}
                            className="rounded p-1 text-neutral-400 hover:text-neutral-600"
                          >
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="hidden px-2 text-xs text-neutral-500 xl:table-cell">{formatDateShort(emp.createdAt)}</td>
                      <td className="py-3 pl-2">
                        <div className="flex items-center justify-center gap-1">
                          {/* زر طباعة الاستمارة الرسمية */}
                          <button
                            onClick={() => setPrintUser(emp)}
                            className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 border border-sky-200"
                            title="طباعة استمارة التقييم الرسمية A4"
                          >
                            <Printer size={15} />
                            <span>استمارة</span>
                          </button>

                          <button
                            onClick={() => openEditForm(emp)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openResetDialog(emp)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-accent-50 hover:text-accent-600"
                            title="إعادة ضبط كلمة المرور"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-error-50 hover:text-error-600"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة استمارة الطباعة A4 الرسمية */}
      {printUser && (
        <Modal open={!!printUser} onClose={() => setPrintUser(null)} title="معاينة استمارة تقييم الأداء الوظيفي" size="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <p className="text-sm text-neutral-600">جاهزة للطباعة بصيغة A4 أو حفظها مباشرة بصيغة PDF.</p>
              <button
                onClick={handlePrint}
                className="btn-primary flex items-center gap-2 bg-primary-700 hover:bg-primary-800"
              >
                <Printer size={18} />
                طباعة الآن (A4 / PDF)
              </button>
            </div>

            {/* ورقة الطباعة A4 */}
            <div ref={printContentRef} className="rounded-xl border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:border-0 print:p-0 print:shadow-none dir-rtl">
              {/* ترويسة الوزارة الرسمية */}
              <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-4 text-xs font-bold leading-relaxed">
                <div className="text-right space-y-1">
                  <p>المملكة العربية السعودية</p>
                  <p>وزارة التعليم</p>
                  <p>إدارة التعليم</p>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold text-neutral-900">استمارة تقييم الأداء الوظيفي السنوي</h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    نموذج: {printUser.formType ? EVALUATION_FORMS[printUser.formType]?.name : 'شاغلي الوظائف التعليمية'}
                  </p>
                </div>
                <div className="text-left space-y-1">
                  <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                  <p>العام الدراسي: 1447 - 1448 هـ</p>
                </div>
              </div>

              {/* بيانات الموظف */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs">
                <div>
                  <span className="font-bold text-neutral-600">اسم الموظف: </span>
                  <span className="font-extrabold text-neutral-900">{printUser.fullName}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600">رقم السجل المدني: </span>
                  <span className="font-mono font-bold text-neutral-900">{printUser.civilId}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600">المسمى الوظيفي: </span>
                  <span className="font-bold text-neutral-900">{printUser.jobTitle || 'معلم'}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600">حالة الاعتماد: </span>
                  <span className="font-bold text-emerald-700">معتمد وموثق سحابياً</span>
                </div>
              </div>

              {/* جدول معايير وبنود التقييم */}
              <div className="mt-5 overflow-hidden rounded-lg border border-neutral-300">
                <table className="w-full text-right
