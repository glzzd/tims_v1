import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

const PublicPage = () => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hoş Geldiniz!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Bu uygulama AuthContext ve Layout yapısını göstermektedir.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Demo Sayfaları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/login">
            <Button 
              variant="outline"
              className="p-4 h-auto w-full"
            >
              <div>
                <div className="font-semibold">Giriş Sayfası</div>
                <div className="text-sm text-gray-500">Public Layout örneği</div>
              </div>
            </Button>
          </Link>
          <Link to="/home">
            <Button 
              variant="outline"
              className="p-4 h-auto w-full"
            >
              <div>
                <div className="font-semibold">Ana səhifə</div>
                <div className="text-sm text-gray-500">Home Page örneği</div>
              </div>
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Oluşturulan Dosyalar:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• src/context/AuthContext.jsx - Authentication yönetimi</li>
            <li>• src/components/layouts/PrivateLayout.jsx - Giriş yapmış istifadəçilar için layout</li>
            <li>• src/components/layouts/PublicLayout.jsx - Genel istifadəçilar için layout</li>
            <li>• src/components/ProtectedRoute.jsx - Route koruma bileşenleri</li>
            <li>• src/components/Header.jsx - Header bileşeni</li>
            <li>• src/components/Footer.jsx - Footer bileşeni</li>
            <li>• src/pages/HomePage.jsx - Ana səhifə bileşeni</li>
            <li>• src/pages/LoginPage.jsx - Giriş sayfası bileşeni</li>
            <li>• src/pages/RegisterPage.jsx - Kayıt sayfası bileşeni</li>
            <li>• src/pages/PublicPage.jsx - Genel ana sayfa bileşeni</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PublicPage;