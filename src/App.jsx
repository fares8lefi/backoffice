import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyPage from './pages/CompanyPage';
import UsersPage from './pages/UsersPage';
import HealthPage from './pages/HealthPage';
import NotFoundPage from './pages/NotFoundPage';

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="boot" aria-busy="true" />;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/connexion" element={<LoginPage />} />
            <Route
              element={
                <RequireAdmin>
                  <Layout />
                </RequireAdmin>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="entreprises" element={<CompaniesPage />} />
              <Route path="entreprises/:id" element={<CompanyPage />} />
              <Route path="utilisateurs" element={<UsersPage />} />
              <Route path="sante" element={<HealthPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
