import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PrivateLayout from '@/components/layouts/PrivateLayout';

function RoleGuard({ allowedPermissionsAny = [], allowedPermissionsAll = [], children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Permission-based guard
      const perms = user?.permissions || {};
      const hasAny = allowedPermissionsAny.length === 0 || allowedPermissionsAny.some(p => perms[p] === true);
      const hasAll = allowedPermissionsAll.length === 0 || allowedPermissionsAll.every(p => perms[p] === true);
      if (!hasAny || !hasAll) {
        navigate('/home', { replace: true });
      }
    }
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate, allowedPermissionsAny, allowedPermissionsAll]);

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

  if (!user) return null;

  const perms = user?.permissions || {};
  const hasAny = allowedPermissionsAny.length === 0 || allowedPermissionsAny.some(p => perms[p] === true);
  const hasAll = allowedPermissionsAll.length === 0 || allowedPermissionsAll.every(p => perms[p] === true);
  if (!hasAny || !hasAll) {
    return null;
  }

  return <PrivateLayout>{children}</PrivateLayout>;
}

export default RoleGuard;