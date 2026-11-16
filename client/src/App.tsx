import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth.store';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import TransactionExplorer from './pages/TransactionExplorer';
import Investigations from './pages/Investigations';
import InvestigationDetailPage from './pages/InvestigationDetailPage';
import FraudAnalysis from './pages/FraudAnalysis';
import Collaboration from './pages/Collaboration';
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="explorer" element={<TransactionExplorer />} />
              <Route path="investigations" element={<Investigations />} />
              <Route path="investigations/:id" element={<InvestigationDetailPage />} />
              <Route path="analysis" element={<FraudAnalysis />} />
              <Route path="collaboration" element={<Collaboration />} />
              <Route path="data" element={<DataManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
