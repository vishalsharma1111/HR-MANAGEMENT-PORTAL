import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/public/PublicLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { HelpFAQPage } from './pages/public/HelpFAQPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Protected HRMS Pages
import { Dashboard } from './pages/Dashboard';
import { EmployeeDirectory } from './pages/employees/EmployeeDirectory';
import { OrgChartPage } from './pages/organization/OrgChartPage';
import { DepartmentManager } from './pages/departments/DepartmentManager';
import { OnboardingWorkflows } from './pages/onboarding/OnboardingWorkflows';
import { AssetManagement } from './pages/assets/AssetManagement';
import { DocumentVault } from './pages/documents/DocumentVault';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { PlannedModulePage } from './pages/planned/PlannedModulePage';

// Phase 2 Operational Pages
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeaveManagementPage } from './pages/leave/LeaveManagementPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { RecruitmentPage } from './pages/recruitment/RecruitmentPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { ExpensesSelfServicePage } from './pages/expenses/ExpensesSelfServicePage';
import { ReportsPage } from './pages/reports/ReportsPage';

// Phase 3 Machine Learning & AI Assistant Pages
import { AttritionPredictorPage } from './pages/ai/AttritionPredictorPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying enterprise credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Informational Website (No Auth Required) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<HelpFAQPage />} />
            </Route>

            {/* Public Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Enterprise Portal */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeDirectory />} />
              <Route path="/organization" element={<OrgChartPage />} />
              <Route path="/departments" element={<DepartmentManager />} />
              <Route path="/onboarding" element={<OnboardingWorkflows />} />
              <Route path="/assets" element={<AssetManagement />} />
              <Route path="/documents" element={<DocumentVault />} />
              <Route path="/audit" element={<AuditLogsPage />} />

              {/* Phase 2: Operations Active Routes */}
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leave" element={<LeaveManagementPage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/recruitment" element={<RecruitmentPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/expenses" element={<ExpensesSelfServicePage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Phase 3: Active Machine Learning & AI Routes */}
              <Route path="/analytics/attrition-ai" element={<AttritionPredictorPage />} />
              <Route path="/hr-assistant" element={<AIAssistantPage />} />
              <Route path="/planned/ai-insights" element={<Navigate to="/analytics/attrition-ai" replace />} />
              <Route path="/planned/hr-assistant" element={<Navigate to="/hr-assistant" replace />} />

              {/* Planned Modules Roadmap */}
              <Route path="/planned/:module" element={<PlannedModulePage />} />
            </Route>

            {/* Fallback to Public Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

