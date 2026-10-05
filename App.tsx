import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastContainer } from '@/components/ui/Toast';
import { LoginPage } from '@/pages/LoginPage';
import { AccountSettingsPage } from '@/pages/AccountSettingsPage';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmployeeOverviewPage } from '@/pages/employee/EmployeeOverviewPage';
import { EmployeeEvidencePage } from '@/pages/employee/EmployeeEvidencePage';
import { EmployeeResultsPage } from '@/pages/employee/EmployeeResultsPage';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminEvaluationPage } from '@/pages/admin/AdminEvaluationPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [adminPage, setAdminPage] = useState('overview');
  const [employeePage, setEmployeePage] = useState('overview');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-neutral-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'admin') {
    const pageContent = {
      overview: { title: 'لوحة المعلومات', desc: 'نظرة عامة على الكادر والتقييمات', component: <AdminOverviewPage onNavigate={setAdminPage} /> },
      staff: { title: 'إدارة الكادر', desc: 'إضافة وتعديل وحذف حسابات الموظفين', component: <AdminStaffPage /> },
      evaluation: { title: 'تقييم واستعراض الشواهد', desc: 'تقييم شواهد الموظفين والاعتماد', component: <AdminEvaluationPage /> },
      settings: { title: 'إعدادات الحساب', desc: 'تغيير كلمة المرور وإدارة الحساب', component: <AccountSettingsPage /> },
    }[adminPage] || { title: '', desc: '', component: null };

    return (
      <DashboardLayout
        activePage={adminPage}
        onNavigate={setAdminPage}
        pageTitle={pageContent.title}
        pageDescription={pageContent.desc}
      >
        {pageContent.component}
      </DashboardLayout>
    );
  }

  const pageContent = {
    overview: { title: 'لوحة المعلومات', desc: 'نظرة عامة على تقدمك في رفع الشواهد', component: <EmployeeOverviewPage onNavigate={setEmployeePage} /> },
    evidence: { title: 'إدارة الشواهد', desc: 'رفع ومعاينة وإدارة ملفات الشواهد', component: <EmployeeEvidencePage /> },
    results: { title: 'النتائج والتقييم', desc: 'عرض درجاتك وتقييماتك المعتمدة', component: <EmployeeResultsPage /> },
    settings: { title: 'إعدادات الحساب', desc: 'تغيير كلمة المرور وإدارة الحساب', component: <AccountSettingsPage /> },
  }[employeePage] || { title: '', desc: '', component: null };

  return (
    <DashboardLayout
      activePage={employeePage}
      onNavigate={setEmployeePage}
      pageTitle={pageContent.title}
      pageDescription={pageContent.desc}
    >
      {pageContent.component}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
