import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Home, User, Settings, BarChart3, Users, FileText } from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Ümumi İstifadəçi',
      value: '1,234',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aktif Projeler',
      value: '56',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Bu Ay Gelir',
      value: '₺45,678',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickActions = [
    {
      title: 'Profili Düzenle',
      description: 'Kişisel bilgilerinizi güncelleyin',
      icon: User,
      action: () => console.log('Profil düzenleme sayfasına git')
    },
    {
      title: 'Ayarlar',
      description: 'Uygulama ayarlarını yönetin',
      icon: Settings,
      action: () => console.log('Ayarlar sayfasına git')
    },
    {
      title: 'Raporlar',
      description: 'Detaylı raporları görüntüleyin',
      icon: BarChart3,
      action: () => console.log('Raporlar sayfasına git')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hoş geldin mesajı */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Home className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">
              Hoş geldin, {user?.name || user?.email || 'İstifadəçi'}!
            </h1>
            <p className="text-blue-100 mt-1">
              Dashboard'ına geri döndün. Bugün nasıl gidiyor?
            </p>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Genel Bakış
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.title} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="w-full"
                    >
                      Git
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Son Aktiviteler
        </h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              {[
                { action: 'Profil güncellendi', time: '2 saat önce', type: 'update' },
                { action: 'Yeni proje oluşturuldu', time: '5 saat önce', type: 'create' },
                { action: 'Rapor indirildi', time: '1 gün önce', type: 'download' },
                { action: 'Ayarlar değiştirildi', time: '2 gün önce', type: 'settings' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'update' ? 'bg-blue-500' :
                      activity.type === 'create' ? 'bg-green-500' :
                      activity.type === 'download' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-900">{activity.action}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;