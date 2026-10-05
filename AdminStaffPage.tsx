import { useEffect, useState, useCallback } from 'react';
import {
  UserPlus, Search, Edit2, Trash2, KeyRound, RefreshCw, Eye, EyeOff,
  Users, GraduationCap, FlaskConical, Trophy, HeartPulse, Compass, X, Check,
  type LucideIcon
} from 'lucide-react';
import { EVALUATION_FORMS } from '@/forms';
import { getAllUsers, saveUser, deleteUser, getUserByCivilId } from '@/db';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/FilePreview';
import { toast } from '@/components/ui/Toast';
import { generateId, generatePassword, formatDateShort } from '@/utils';
import type { User, FormType } from '@/types';

const formIconMap: Record<string, LucideIcon> = {
  GraduationCap, Trophy, HeartPulse, FlaskConical, Compass,
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
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '', civilId: '', jobTitle: '', formType: 'teacher', password: '', mustChangePassword: true,
  });
  const [showFormPassword, setShowFormPassword] = useState(false);

  const loadStaff = useCallback(async () => {
    setSyncing(true);
    try {
      const users = await getAllUsers();
      setEmployees(users.filter((u) => u.role === 'employee'));
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'تعذر مزامنة بيانات الكادر');
    } finally { setSyncing(false); }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const filtered = employees.filter((e) =>
    e.fullName.includes(search) || e.civilId.includes(search) || (e.jobTitle || '').includes(search)
  );

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({ fullName: '', civilId: '', jobTitle: '', formType: 'teacher', password: '', mustChangePassword: true });
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

    // Check for duplicate civilId
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
      toast('error', error instanceof Error ? error.message : 'فشل حفظ البيانات في Supabase');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteUser(deleteTarget.id);
      toast('success', 'تم حذف الموظف وكل بياناته من السحابة');
      setDeleteTarget(null);
      await loadStaff();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل حذف الموظف من Supabase');
    } finally { setSaving(false); }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    setSaving(true);
    try {
      const updated = { ...resetTarget, password: newPassword, mustChangePassword: true };
      await saveUser(updated);
      toast('success', `تم إعادة ضبط كلمة المرور. كلمة المرور الجديدة: ${newPassword}`);
      setResetTarget(null);
      await loadStaff();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'فشل تحديث كلمة المرور في Supabase');
    } finally { setSaving(false); }
  };

  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const openResetDialog = (user: User) => {
    setResetTarget(user);
    setResetPasswordValue(generatePassword());
  };

  return (
    <div className="space-y-6">
      {syncing && <div className="flex items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700"><RefreshCw size={16} className="animate-spin" />جاري المزامنة مع Supabase...</div>}
      {/* Toolbar */}
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
        <button onClick={openAddForm} className="btn-primary w-full sm:w-auto">
          <UserPlus size={18} />
          إضافة موظف
        </button>
      </div>

      {/* Staff list */}
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
                  <th className="pb-3 pl-2 font-bold">إجراءات</th>
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
                            <FormIcon size={14} />
                            {form.shortName}
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
                        <div className="flex items-center gap-1">
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

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">الاسم الكامل <span className="text-error-500">*</span></label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input-field"
              placeholder="اسم الموظف"
            />
          </div>

          <div>
            <label className="label-field">رقم السجل المدني <span className="text-error-500">*</span></label>
            <input
              type="text"
              value={formData.civilId}
              onChange={(e) => setFormData({ ...formData, civilId: e.target.value })}
              className="input-field"
              placeholder="رقم السجل المدني"
            />
          </div>

          <div>
            <label className="label-field">المسمى الوظيفي</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="input-field"
              placeholder="معلم، محضر مختبر، موجه طلابي..."
            />
          </div>

          <div>
            <label className="label-field">نموذج التقييم <span className="text-error-500">*</span></label>
            <select
              value={formData.formType}
              onChange={(e) => setFormData({ ...formData, formType: e.target.value as FormType })}
              className="input-field"
            >
              {Object.values(EVALUATION_FORMS).map((f) => {
                const Icon = formIconMap[f.icon];
                return (
                  <option key={f.type} value={f.type}>
                    {f.name} ({f.criteria.length} بند)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label-field">كلمة المرور <span className="text-error-500">*</span></label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  {showFormPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const pwd = generatePassword();
                  setFormData({ ...formData, password: pwd });
                  setShowFormPassword(true);
                  toast('info', `تم توليد كلمة مرور: ${pwd}`);
                }}
                className="btn-outline whitespace-nowrap"
              >
                <RefreshCw size={16} />
                توليد عشوائي
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={formData.mustChangePassword}
              onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            طلب تغيير كلمة المرور عند أول دخول
          </label>

          <div className="flex justify-start gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto">
              <Check size={18} />
              {saving ? 'جاري الحفظ...' : editingUser ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-outline">
              <X size={18} />
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الموظف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ سيتم حذف جميع الشواهد والتقييمات المرتبطة به.`}
        confirmLabel="نعم، حذف نهائي"
        danger
      />

      {/* Reset password modal */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="إعادة ضبط كلمة المرور"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            سيتم إعادة ضبط كلمة مرور <span className="font-bold">{resetTarget?.fullName}</span>. سيُطلب منه تغييرها عند الدخول.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className="input-field font-mono"
            />
            <button
              type="button"
              onClick={() => { setResetPasswordValue(generatePassword()); }}
              className="btn-outline whitespace-nowrap"
            >
              <RefreshCw size={16} /> توليد
            </button>
          </div>
          <div className="flex justify-start gap-2">
            <button onClick={() => handleResetPassword(resetPasswordValue)} className="btn-primary">
              <Check size={18} /> تأكيد إعادة الضبط
            </button>
            <button onClick={() => setResetTarget(null)} className="btn-outline">إلغاء</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
