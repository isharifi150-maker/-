import { useState } from 'react';
import { FileText, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MinistryLogo } from '@/components/Logo';

export function LoginPage() {
  const { login } = useAuth();
  const [civilId, setCivilId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(civilId, password);
    if (!result.success) {
      setError(result.error || 'فشل تسجيل الدخول');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-neutral-50 via-primary-50/30 to-neutral-100">
      {/* Top ministry strip */}
      <div className="bg-gradient-to-l from-secondary-700 to-secondary-500 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <MinistryLogo size={32} />
            <div>
              <p className="text-sm font-bold">المملكة العربية السعودية</p>
              <p className="text-xs opacity-80">وزارة التعليم</p>
            </div>
          </div>
          <p className="hidden text-sm font-medium opacity-80 sm:block">بوابة شواهد الأداء الوظيفي والتقييم</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo card */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-bl from-primary-600 to-primary-400 shadow-elevated">
              <FileText className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-secondary-800">بوابة شواهد الأداء الوظيفي</h1>
            <p className="mt-2 text-sm text-neutral-500">منصة تقييم الأداء الوظيفي للمدرسة</p>
          </div>

          {/* Login form */}
          <div className="card p-8 animate-slide-up">
            <h2 className="mb-1 text-lg font-bold text-neutral-800">تسجيل الدخول</h2>
            <p className="mb-6 text-sm text-neutral-500">أدخل رقم السجل المدني وكلمة المرور</p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">رقم السجل المدني</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={civilId}
                    onChange={(e) => setCivilId(e.target.value)}
                    className="input-field pr-10"
                    placeholder="أدخل رقم السجل المدني"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="label-field">كلمة المرور</label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10 pl-10"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>

          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} — مدرسة أم الشعنون
          </p>
        </div>
      </div>
    </div>
  );
}
