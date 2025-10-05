import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
// Pages will be lazy-loaded below
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import PrivateLayout from '@/components/layouts/PrivateLayout';
import RoleGuard from '@/components/RoleGuard';
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PublicPage = lazy(() => import('./pages/auth/PublicPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const MessagingPage = lazy(() => import('@/pages/MessagingPage'));
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'));
const InstitutionsPage = lazy(() => import('@/pages/InstitutionsPage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));

// Ana səhifə yönlendirme bileşeni
function HomeRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

// Login başarı yönlendirmesi için wrapper
function LoginPageWrapper() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Eğer istifadəçi zaten giriş yapmışsa home'a yönlendir
  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return <LoginPage />;
}

// Register başarı yönlendirmesi için wrapper
function RegisterPageWrapper() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Eğer istifadəçi zaten giriş yapmışsa home'a yönlendir
  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return <RegisterPage />;
}

// Korumalı sayfa wrapper'ı
function ProtectedPageWrapper({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // useEffect zaten yönlendirme yapacak
  }
  
  return (
    <PrivateLayout>
      {children}
    </PrivateLayout>
  );
}



function AppContent() {
  // Bridge navigate to window to allow SPA redirects from non-React contexts (e.g., axios interceptors)
  const navigate = useNavigate();
  useEffect(() => {
    window.__navigate = (to, options) => navigate(to, options);
    return () => { delete window.__navigate; };
  }, [navigate]);
  return (
    <Routes>
      {/* Ana səhifə - istifadəçi durumuna göre yönlendirme */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Public sayfalar */}
      <Route path="/public" element={<PublicPage />} />
      
      <Route path="/login" element={<LoginPageWrapper />} />
      
      <Route path="/register" element={<RegisterPageWrapper />} />
      
      {/* Korumalı sayfalar */}
      <Route path="/home" element={
        <ProtectedPageWrapper>
          <HomePage />
        </ProtectedPageWrapper>
      } />
      <Route path="/users" element={
        <RoleGuard allowedPermissionsAny={["canReadAllUsers","canReadOwnInstitutionUsers"]}>
          <UsersPage />
        </RoleGuard>
      } />
      <Route path="/messaging" element={
        <RoleGuard allowedPermissionsAny={["canMessageDirect","canMessageInstitutionGroups","canMessageAllGroups"]}>
          <MessagingPage />
        </RoleGuard>
      } />
      <Route path="/employees" element={
        <RoleGuard allowedPermissionsAny={["canAddEmployee"]}>
          <EmployeesPage />
        </RoleGuard>
      } />
      <Route path="/institutions" element={
        <RoleGuard allowedPermissionsAny={["isSuperAdmin"]}>
          <InstitutionsPage />
        </RoleGuard>
      } />
      <Route path="/groups" element={
        <RoleGuard allowedPermissionsAny={["canAddAdmin","canMessageInstitutionGroups","canMessageAllGroups"]}>
          <GroupsPage />
        </RoleGuard>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedPageWrapper>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Korumalı Alan - Dashboard
            </h1>
            <p className="text-gray-600">
              Bu alan sadece giriş yapmış istifadəçilər tarafından görülebilir.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">İstatistik 1</h3>
                <p className="text-3xl font-bold text-blue-600">1,234</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">İstatistik 2</h3>
                <p className="text-3xl font-bold text-green-600">5,678</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">İstatistik 3</h3>
                <p className="text-3xl font-bold text-purple-600">9,012</p>
              </div>
            </div>
          </div>
        </ProtectedPageWrapper>
      } />
      
      {/* 404 sayfası */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );


}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Yükleniyor...</p></div></div>}>
            <AppContent />
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App
