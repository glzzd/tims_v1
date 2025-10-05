import { createContext, useContext, useState, useEffect } from 'react';
import { postRequests } from '../apiRequests/postRequests';
import { getRequests } from '../apiRequests/getRequests';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sayfa yüklendiğinde localStorage'dan istifadəçi bilgilerini kontrol et
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token) {
          // Try to fetch profile from server to get role/permissions
          getRequests.getProfile()
            .then((resp) => {
              const profile = resp?.data?.data;
              if (profile) {
                localStorage.setItem('user', JSON.stringify(profile));
                setUser(profile);
                setIsAuthenticated(true);
              } else if (userData) {
                setUser(JSON.parse(userData));
                setIsAuthenticated(true);
              }
            })
            .catch(() => {
              if (userData) {
                setUser(JSON.parse(userData));
                setIsAuthenticated(true);
              }
            })
            .finally(() => setLoading(false));
          return; // prevent finally below from toggling loading too early
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Giriş yapma fonksiyonu - API çağrısı ile
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await postRequests.login(credentials);
      
      if (response.data.success && response.data.token) {
        const { token } = response.data;
        
        // Token'ı localStorage'a kaydet
        localStorage.setItem('token', token);
        
        // Fetch profile for role/permissions
        try {
          const resp = await getRequests.getProfile();
          const profile = resp?.data?.data || { email: credentials.email };
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
          setIsAuthenticated(true);
        } catch (e) {
          const fallbackUser = { email: credentials.email };
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setIsAuthenticated(true);
        }
        
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma fonksiyonu - API çağrısı ile
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Backend'e logout isteği gönder (eğer endpoint varsa)
        try {
          await postRequests.logout();
        } catch (error) {
          console.error('Logout API error:', error);
          // API hatası olsa bile local logout işlemini yap
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Her durumda local storage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // İstifadəçi bilgilerini güncelleme fonksiyonu
  const updateUser = (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Token'ı alma fonksiyonu
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;