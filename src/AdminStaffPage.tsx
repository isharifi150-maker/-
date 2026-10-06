import { useEffect, useState, useCallback } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, KeyRound, RefreshCw, Eye, EyeOff, 
  Users, GraduationCap, FlaskConical, Trophy, HeartPulse, Compass, 
  X, Check, Printer, FileSpreadsheet, type LucideIcon 
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

  // استمارة الطباعة A4
  const [printUser, setPrintUser] = useState<User | null>(null);

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

  const loadStaff = useCallback(async () => {
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
    loadStaff();
  }, [loadStaff]);

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
      await loadStaff();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteUser(deleteTarget.id);
      toast('success', 'تم حذف الموظف وكل بياناته');
      setDeleteTarget(null);
      await loadStaff();
    } catch (error) {
      toast('error', 'فشل حذف الموظف');
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
      await loadStaff();
    } catch (error) {
      toast('error', 'فشل تحديث كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const openResetDialog = (user: User) => {
    setResetTarget(user);
    setResetPasswordValue(generatePassword());
  };

  // تصدير كشف إكسل عربي CSV
  const handleExportExcel = () => {
    if (employees.length === 0) {
      toast('info', 'لا يوجد موظفون لتصدير بياناتهم');
      return;
    }
    const headers = ['م', 'الاسم الكامل', 'رقم السجل المدني', 'المسمى الوظيفي', 'نموذج التقييم', 'حالة التقييم', 'الدرجة الكلية', 'المدير المعتمد'];
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
        userEval?.totalScore ?? '-',
        '"فيصل علي قحل"'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_تقييمات_الكادر_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast('success', 'تم تنزيل كشف Excel بنجاح');
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
          {/* زر تصدير Excel */}
          <button
            onClick={handleExportExcel}
            className="btn-outline flex-1 sm:flex-initial flex items-center justify-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
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

      {/* قائمة الموظفين */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Users size={32} className="mb-3 text-neutral-400" />
            <p className="text-sm font-bold text-neutral-700">
              {employees.length === 0 ? 'لا يوجد موظفون بعد' : 'لا توجد نتائج مطابقة'}
            </p>
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
                  <th className="pb-3 pl-2 font-bold text-center">الاستمارة والإجراءات</th>
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
                        ) : <span className="text-xs text-neutral-400">—</span>}
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
                          {/* زر طباعة الاستمارة الرسمية A4 */}
                          <button
                            onClick={() => setPrintUser(emp)}
                            className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            title="طباعة استمارة التقييم الرسمية A4"
                          >
                            <Printer size={15} />
                            استمارة
                          </button>

                          <button onClick={() => openEditForm(emp)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600" title="تعديل">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => openResetDialog(emp)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-accent-50 hover:text-accent-600" title="إعادة ضبط كلمة المرور">
                            <KeyRound size={16} />
                          </button>
                          <button onClick={() => setDeleteTarget(emp)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-error-50 hover:text-error-600" title="حذف">
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

      {/* نافذة استمارة A4 الرسمية للطباعة */}
      {printUser && (
        <Modal open={!!printUser} onClose={() => setPrintUser(null)} title="معاينة استمارة التقييم الرسمية" size="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <p className="text-sm text-neutral-600">جاهزة للطباعة المباشرة بصيغة A4 أو الحفظ كـ PDF.</p>
              <button
                onClick={() => window.print()}
                className="btn-primary flex items-center gap-2 bg-primary-700 hover:bg-primary-800"
              >
                <Printer size={18} />
                طباعة الآن (A4 / PDF)
              </button>
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm dir-rtl">
              <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-4 text-xs font-bold leading-relaxed">
                <div className="text-right space-y-1">
                  <p>المملكة العربية السعودية</p>
                  <p>وزارة التعليم</p>
                  <p>إدارة التعليم</p>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold text-neutral-900">استمارة تقييم الأداء الوظيفي السنوي</h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    النموذج: {printUser.formType ? EVALUATION_FORMS[printUser.formType]?.name : 'شاغلي الوظائف التعليمية'}
                  </p>
                </div>
                <div className="text-left space-y-1">
                  <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                  <p>العام الدراسي: 1447 - 1448 هـ</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs">
                <div><span className="font-bold text-neutral-600">اسم الموظف: </span><span className="font-extrabold text-neutral-900">{printUser.fullName}</span></div>
                <div><span className="font-bold text-neutral-600">رقم السجل: </span><span className="font-mono font-bold text-neutral-900">{printUser.civilId}</span></div>
                <div><span className="font-bold text-neutral-600">المسمى الوظيفي: </span><span className="font-bold text-neutral-900">{printUser.jobTitle || 'معلم'}</span></div>
                <div><span className="font-bold text-neutral-600">الدرجة المستحقة: </span><span className="font-bold text-emerald-700">{evaluations.find(e => e.employeeId === printUser.id)?.totalScore ?? '100'}%</span></div>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-neutral-300">
                <table className="w-full text-right text-xs">
                  <thead className="bg-neutral-100 font-bold border-b border-neutral-300">
                    <tr>
                      <th className="p-2 w-12 text-center border-l border-neutral-300">#</th>
                      <th className="p-2 border-l border-neutral-300">معيار التقييم ومؤشر الأداء</th>
                      <th className="p-2 w-24 text-center border-l border-neutral-300">الوزن</th>
                      <th className="p-2 w-24 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printUser.formType ? EVALUATION_FORMS[printUser.formType]?.criteria : []).map((crit, idx) => (
                      <tr key={crit.id} className="border-b border-neutral-200 last:border-0">
                        <td className="p-2 text-center border-l border-neutral-200 font-bold">{idx + 1}</td>
                        <td className="p-2 border-l border-neutral-200">
                          <p className="font-bold text-neutral-800">{crit.name}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{crit.description}</p>
                        </td>
                        <td className="p-2 text-center border-l border-neutral-200 font-mono">{crit.weight}%</td>
                        <td className="p-2 text-center font-bold text-emerald-700">مكتمل</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* التواقيع الرسمية باسم المدير فيصل علي قحل */}
              <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs font-bold pt-6 border-t border-neutral-200">
                <div className="space-y-4">
                  <p>الموظف (بالعلم والاطلاع)</p>
                  <p className="font-extrabold text-neutral-900">{printUser.fullName}</p>
                  <p className="text-neutral-400">التوقيع: .......................................</p>
                </div>
                <div className="space-y-4">
                  <p>مدير المدرسة (المعتمد)</p>
                  <p className="font-extrabold text-neutral-900 text-sm">فيصل علي قحل</p>
                  <p className="text-neutral-400">التوقيع والختم: .......................................</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* نموذج إضافة / تعديل */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'} size="md">
        <div className="space-y-4">
          <div><label className="label-field">الاسم الكامل *</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-field" placeholder="اسم الموظف" /></div>
          <div><label className="label-field">رقم السجل المدني *</label><input type="text" value={formData.civilId} onChange={(e) => setFormData({ ...formData, civilId: e.target.value })} className="input-field" placeholder="رقم السجل المدني" /></div>
          <div><label className="label-field">المسمى الوظيفي</label><input type="text" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="input-field" placeholder="معلم..." /></div>
          <div><label className="label-field">نموذج التقييم *</label>
            <select value={formData.formType} onChange={(e) => setFormData({ ...formData, formType: e.target.value as FormType })} className="input-field">
              {Object.values(EVALUATION_FORMS).map((f) => (<option key={f.type} value={f.type}>{f.name} ({f.criteria.length} بند)</option>))}
            </select>
          </div>
          <div><label className="label-field">كلمة المرور *</label>
            <div className="flex gap-2">
              <input type={showFormPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" placeholder="كلمة المرور" />
              <button type="button" onClick={() => { const pwd = generatePassword(); setFormData({ ...formData, password: pwd }); setShowFormPassword(true); }} className="btn-outline whitespace-nowrap"><RefreshCw size={16} /> توليد</button>
            </div>
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto"><Check size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button onClick={() => setShowForm(false)} className="btn-outline"><X size={18} /> إلغاء</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف الموظف" message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟`} confirmLabel="حذف" danger />

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="إعادة ضبط كلمة المرور" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">إعادة ضبط كلمة مرور {resetTarget?.fullName}</p>
          <div className="flex gap-2">
            <input type="text" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} className="input-field font-mono" />
            <button type="button" onClick={() => setResetPasswordValue(generatePassword())} className="btn-outline"><RefreshCw size={16} /> توليد</button>
          </div>
          <div className="flex justify-start gap-2">
            <button onClick={handleResetPassword(resetPasswordValue)} className="btn-primary"><Check size={18} /> تأكيد</button>
            <button onClick={() => setResetTarget(null)} className="btn-outline">إلغاء</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
