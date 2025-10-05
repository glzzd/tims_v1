import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, Menu, User, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onMenuToggle, showMenuButton = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuToggle}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link to={isAuthenticated ? '/home' : '/'} className={`font-bold text-gray-900 hover:text-gray-700 transition-colors ${
              isAuthenticated ? 'text-xl' : 'text-2xl'
            }`}>
              {isAuthenticated ? 'Dashboard' : 'MyApp'}
            </Link>
          </div>
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/home" className="text-sm font-medium text-gray-700 hover:text-gray-900">Ana səhifə</Link>
              {(user?.permissions?.canReadAllUsers || user?.permissions?.canReadOwnInstitutionUsers) && (
                <Link to="/users" className="text-sm font-medium text-gray-700 hover:text-gray-900">İstifadəçilər</Link>
              )}
              {user?.permissions?.isSuperAdmin === true && (
                <Link to="/institutions" className="text-sm font-medium text-gray-700 hover:text-gray-900">Qurumlar</Link>
              )}
              <Link to="/messaging" className="text-sm font-medium text-gray-700 hover:text-gray-900">Mesajlaşma</Link>
              {(user?.permissions?.isSuperAdmin === true || user?.permissions?.canAddEmployee === true) && (
                <Link to="/employees" className="text-sm font-medium text-gray-700 hover:text-gray-900">Çalışanlar</Link>
              )}
              {(user?.permissions?.isSuperAdmin === true || user?.permissions?.canAddAdmin === true) && (
                <Link to="/groups" className="text-sm font-medium text-gray-700 hover:text-gray-900">Gruplar</Link>
              )}
            </nav>
          )}
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              // Giriş yapmış istifadəçi için
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Hoş geldin, {user?.name || user?.email || 'İstifadəçi'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Çıkış</span>
                </Button>
              </>
            ) : (
              // Giriş yapmamış istifadəçi için
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Giriş Yap</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Kayıt Ol</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;