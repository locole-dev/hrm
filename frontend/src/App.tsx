import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/app-shell";
import { RouteGuard } from "@/components/route-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

// Pages
const LoginPage = lazy(() => import("@/pages/login-page").then(m => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import("@/pages/overview-page").then(m => ({ default: m.OverviewPage })));
const EmployeeListPage = lazy(() => import("@/pages/employee-list-page").then(m => ({ default: m.EmployeeListPage })));
const EmployeeDetailPage = lazy(() => import("@/pages/employee-detail-page").then(m => ({ default: m.EmployeeDetailPage })));
const DepartmentsPage = lazy(() => import("@/pages/departments-page").then(m => ({ default: m.DepartmentsPage })));
const AttendancePage = lazy(() => import("@/pages/attendance-page").then(m => ({ default: m.AttendancePage })));
const LeavePage = lazy(() => import("@/pages/leave-page").then(m => ({ default: m.LeavePage })));
const PayrollPage = lazy(() => import("@/pages/payroll-page").then(m => ({ default: m.PayrollPage })));
const SettingsPage = lazy(() => import("@/pages/settings-page").then(m => ({ default: m.SettingsPage })));
const WorkspacePage = lazy(() => import("@/pages/workspace-page").then(m => ({ default: m.WorkspacePage })));
const ReportingPage = lazy(() => import("@/pages/reporting-page").then(m => ({ default: m.ReportingPage })));
const NotificationPage = lazy(() => import("@/pages/notification-page").then(m => ({ default: m.NotificationPage })));
const HolidayPage = lazy(() => import("@/pages/holiday-page").then(m => ({ default: m.HolidayPage })));
const PayrollRulesPage = lazy(() => import("@/pages/payroll-rules-page").then(m => ({ default: m.PayrollRulesPage })));
const AuditPage = lazy(() => import("@/pages/audit-page").then(m => ({ default: m.AuditPage })));


function RouteLoading() {
  return (
    <div className="page-shell page-stack">
      <Skeleton className="h-32 rounded-[2rem] bg-white border border-[#c2c6d3]/20" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[2rem] bg-white border border-[#c2c6d3]/20" />
        <Skeleton className="h-64 rounded-[2rem] bg-white border border-[#c2c6d3]/20" />
        <Skeleton className="h-64 rounded-[2rem] bg-white border border-[#c2c6d3]/20" />
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RouteGuard />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/reports" element={<ReportingPage />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/holidays" element={<HolidayPage />} />
              <Route path="/settings/payroll-rules" element={<PayrollRulesPage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
