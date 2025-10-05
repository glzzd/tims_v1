import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PrivateLayout from '@/components/layouts/PrivateLayout';

function RoleGuard({ allowedPermissionsAny = [], allowedPermissionsAll = [], children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // No redirect on insufficient permissions; keep user on the current page
    // Authentication absence is handled by higher-level wrappers/routes
  }, [user, loading, allowedPermissionsAny, allowedPermissionsAll]);

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
    // Show an unauthorized message instead of redirecting to home
    return (
      <PrivateLayout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Yetkiniz yok</h2>
            <p className="text-gray-600">Bu sayfayı görüntülemek için yeterli izinlere sahip değilsiniz.</p>
          </div>
        </div>
      </PrivateLayout>
    );
  }

  return <PrivateLayout>{children}</PrivateLayout>;
}

export default RoleGuard;