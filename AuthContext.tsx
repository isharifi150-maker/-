import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { User } from '../types';
import { getUserByCivilId, saveUser, seedDefaultAdmin } from '../db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (civilId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { await seedDefaultAdmin(); }
      catch (error) { console.error('Supabase bootstrap failed:', error); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (civilId: string, password: string) => {
    try {
      const dbUser = await getUserByCivilId(civilId.trim());
      if (!dbUser) return { success: false, error: 'رقم السجل المدني غير موجود' };
      if (dbUser.password !== password) return { success: false, error: 'كلمة المرور غير صحيحة' };
      setUser(dbUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'تعذر الاتصال بقاعدة البيانات' };
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: 'غير مسجل الدخول' };
    if (user.password !== currentPassword) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    try {
      const updated = { ...user, password: newPassword, mustChangePassword: false };
      await saveUser(updated);
      setUser(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'فشل حفظ كلمة المرور في السحابة' };
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const dbUser = await getUserByCivilId(user.civilId);
    if (dbUser) setUser(dbUser);
  }, [user]);

  return <AuthContext.Provider value={{ user, loading, login, logout, updatePassword, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
