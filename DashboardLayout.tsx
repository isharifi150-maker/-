import { type ReactNode, useEffect, useState } from 'react';
import { LogOut, Settings, LayoutDashboard, Users, ClipboardList, FileText, Award, FolderOpen, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MinistryLogo } from '@/components/Logo';

export type AdminPage = 'overview' | 'staff' | 'evaluation' | 'settings';
export type EmployeePage = 'overview' | 'evidence' | 'results' | 'settings';
interface DashboardLayoutProps { children: ReactNode; activePage: string; onNavigate: (page: string) => void; pageTitle: string; pageDescription?: string; actions?: ReactNode; }
const adminNavItems = [
  { id: 'overview' as AdminPage, label: 'لوحة المعلومات', icon: LayoutDashboard },
  { id: 'staff' as AdminPage, label: 'إدارة الكادر', icon: Users },
  { id: 'evaluation' as AdminPage, label: 'تقييم الشواهد', icon: ClipboardList },
  { id: 'settings' as AdminPage, label: 'إعدادات الحساب', icon: Settings },
];
const employeeNavItems = [
  { id: 'overview' as EmployeePage, label: 'لوحة المعلومات', icon: LayoutDashboard },
  { id: 'evidence' as EmployeePage, label: 'إدارة الشواهد', icon: FolderOpen },
  { id: 'results' as EmployeePage, label: 'النتائج والتقييم', icon: Award },
  { id: 'settings' as EmployeePage, label: 'إعدادات الحساب', icon: Settings },
];

export function DashboardLayout({ children, activePage, onNavigate, pageTitle, pageDescription, actions }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [activePage]);
  if (!user) return null;
  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;
  const navigate = (id: string) => { onNavigate(id); setMobileOpen(false); };

  const nav = (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon; const active = activePage === item.id;
        return <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${active ? 'bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-card' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}>
          <Icon size={18} /> {item.label}
        </button>;
      })}
    </nav>
  );

  return <div className="min-h-screen max-w-full overflow-x-hidden bg-neutral-50">
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white shadow-card">
      <div className="bg-gradient-to-l from-secondary-700 to-secondary-500 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-1.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2"><MinistryLogo size={22} /><span className="truncate text-[11px] font-medium sm:text-xs">المملكة العربية السعودية — وزارة التعليم</span></div>
          <span className="hidden text-xs font-medium opacity-80 md:block">بوابة شواهد الأداء الوظيفي والتقييم</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-neutral-200 p-2 text-neutral-700 lg:hidden" aria-label="فتح القائمة"><Menu size={20}/></button>
          <div className="hidden rounded-xl bg-gradient-to-bl from-primary-600 to-primary-400 p-2 shadow-card sm:block"><FileText className="text-white" size={24}/></div>
          <div className="min-w-0"><h1 className="truncate text-sm font-bold text-secondary-800 sm:text-base">بوابة شواهد الأداء الوظيفي</h1><p className="hidden text-xs text-neutral-500 sm:block">منصة تقييم الأداء الوظيفي للمدرسة</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden text-left sm:block"><p className="max-w-36 truncate text-sm font-bold text-neutral-800">{user.fullName}</p><p className="text-xs text-neutral-500">{user.role === 'admin' ? 'مدير المدرسة' : user.jobTitle || 'موظف'}</p></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-bl from-secondary-600 to-secondary-400 text-sm font-bold text-white sm:h-10 sm:w-10">{user.fullName.charAt(0)}</div>
          <button onClick={logout} className="rounded-lg p-2 text-error-600 hover:bg-error-50" title="تسجيل الخروج"><LogOut size={18}/></button>
        </div>
      </div>
    </header>

    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-secondary-900/50" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" />
      <aside className="absolute right-0 top-0 h-full w-[min(82vw,320px)] overflow-y-auto bg-white p-4 shadow-elevated animate-fade-in">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4"><div><p className="font-bold text-neutral-800">{user.fullName}</p><p className="text-xs text-neutral-500">التنقل</p></div><button className="rounded-lg p-2 hover:bg-neutral-100" onClick={() => setMobileOpen(false)}><X size={20}/></button></div>
        {nav}
      </aside>
    </div>}

    <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-4 sm:py-6">
      <aside className="hidden w-56 flex-shrink-0 lg:block"><div className="sticky top-28">{nav}</div></aside>
      <main className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:mb-6 sm:flex-row sm:items-start">
          <div className="min-w-0"><h2 className="text-lg font-bold text-secondary-800 sm:text-xl">{pageTitle}</h2>{pageDescription && <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{pageDescription}</p>}</div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        <div className="min-w-0 animate-fade-in">{children}</div>
      </main>
    </div>
  </div>;
}
