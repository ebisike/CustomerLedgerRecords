import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { PublicRoute } from '@/components/common/PublicRoute';
import { PageLoader } from '@/components/ui/LoadingSpinner';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AcceptInvitationPage = lazy(() => import('@/pages/auth/AcceptInvitationPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage'));
const CustomerLedgerPage = lazy(() => import('@/pages/customers/CustomerLedgerPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-50"><PageLoader /></div>}>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<PublicRoute><AuthLayout /></PublicRoute>}>
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="accept-invitation" element={<AcceptInvitationPage />} />
            </Route>

            {/* Accept invitation outside public route guard (can be accessed when logged out) */}
            <Route path="/auth/accept-invitation" element={<AuthLayout />}>
              <Route index element={<AcceptInvitationPage />} />
            </Route>

            {/* Protected app routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id/ledger" element={<CustomerLedgerPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '13px',
            borderRadius: '10px',
            padding: '10px 14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
        }}
      />

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
