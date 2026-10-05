import { useState } from 'react';
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/Toast';

export function AccountSettingsPage() {
  const { user, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    const result = await updatePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      toast('success', 'تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.error || 'فشل تغيير كلمة المرور');
    }
  };

  return (
    <div className="max-w-2xl">
      {user.mustChangePassword && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning-300 bg-warning-50 px-4 py-3">
          <AlertCircle size={20} className="text-warning-600 flex-shrink-0" />
          <p className="text-sm font-medium text-warning-800">
            يرجى تغيير كلمة المرور الخاصة بك لحماية خصوصية حسابك
          </p>
        </div>
      )}

      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3">
            <KeyRound className="text-primary-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-800">تغيير كلمة المرور</h3>
            <p className="text-sm text-neutral-500">يمكنك تغيير كلمة المرور الخاصة بك في أي وقت</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-field">كلمة المرور الحالية</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10 pl-10"
                placeholder="أدخل كلمة المرور الحالية"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                {showCurrent ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>

          <div>
            <label className="label-field">كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10 pl-10"
                placeholder="أدخل كلمة المرور الجديدة"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                {showNew ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>

          <div>
            <label className="label-field">تأكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="أعد إدخال كلمة المرور الجديدة"
                required
              />
            </div>
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="mt-2 flex items-center gap-1 text-xs text-success-600">
                <CheckCircle2 size={14} /> كلمتا المرور متطابقتان
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card mt-6">
        <h3 className="mb-4 text-base font-bold text-neutral-800">معلومات الحساب</h3>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-neutral-500">الاسم</p>
            <p className="font-bold text-neutral-800">{user.fullName}</p>
          </div>
          <div>
            <p className="text-neutral-500">رقم السجل المدني</p>
            <p className="font-bold text-neutral-800">{user.civilId}</p>
          </div>
          <div>
            <p className="text-neutral-500">الصلاحية</p>
            <p className="font-bold text-neutral-800">{user.role === 'admin' ? 'مدير' : 'موظف'}</p>
          </div>
          {user.jobTitle && (
            <div>
              <p className="text-neutral-500">المسمى الوظيفي</p>
              <p className="font-bold text-neutral-800">{user.jobTitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
