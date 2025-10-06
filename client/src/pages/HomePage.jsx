import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Home, Users, MessageSquare, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRequests } from '@/apiRequests/getRequests';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myGroups: 0,
    myInstitutions: 0,
    employeesInMyInstitution: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [groupsRes, instRes] = await Promise.all([
          getRequests.getMyGroups(),
          getRequests.getMyInstitutions()
        ]);
        const myGroups = Array.isArray(groupsRes?.data?.data) ? groupsRes.data.data : [];
        const myInsts = Array.isArray(instRes?.data?.data) ? instRes.data.data : [];
        let empCount = 0;
        if (myInsts[0]?.id || myInsts[0]?._id) {
          const instId = String(myInsts[0].id || myInsts[0]._id);
          try {
            const empRes = await getRequests.getEmployees({ institution: instId, limit: 1 });
            empCount = empRes?.data?.pagination?.total || empRes?.data?.pagination?.totalItems || 0;
          } catch (_) {}
        }
        if (mounted) {
          setStats({ myGroups: myGroups.length, myInstitutions: myInsts.length, employeesInMyInstitution: empCount });
        }
      } catch (_) {}
      try {
        const logsRes = await getRequests.getMessageLogs({ page: 1, limit: 5, action: 'send' });
        const items = Array.isArray(logsRes?.data?.data) ? logsRes.data.data : [];
        if (mounted) setRecentLogs(items);
      } catch (_) {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      {/* Salamlayıcı mesaj */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Home className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">
              Xoş gəlmisən, {user?.name || user?.email || 'İstifadəçi'}!
            </h1>
            <p className="text-blue-100 mt-1">
              Bu panel sənin gündəlik iş axınını asanlaşdırmaq üçün hazırlanıb.
            </p>
          </div>
        </div>
      </div>

      {/* Ümumi baxış */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ümumi baxış</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg p-6 bg-blue-50">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-white text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mənim qruplarım</p>
                <p className="text-2xl font-bold text-gray-900">{stats.myGroups}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 bg-green-50">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-white text-green-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mənim qurumlarım</p>
                <p className="text-2xl font-bold text-gray-900">{stats.myInstitutions}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 bg-purple-50">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-white text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Qurumumdakı işçilər</p>
                <p className="text-2xl font-bold text-gray-900">{stats.employeesInMyInstitution}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tez hərəkətlər */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tez hərəkətlər</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Mesajlaşma</h3>
                  <p className="text-sm text-gray-600 mb-3">Qruplara və işçilərə mesaj göndər</p>
                  <Link to="/messaging"><Button variant="outline" size="sm" className="w-full">Aç</Button></Link>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-full bg-green-50 text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">İşçilər</h3>
                  <p className="text-sm text-gray-600 mb-3">Qurum üzrə işçi siyahısı</p>
                  <Link to="/employees"><Button variant="outline" size="sm" className="w-full">Aç</Button></Link>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Qruplar</h3>
                  <p className="text-sm text-gray-600 mb-3">Mesaj qruplarını idarə et</p>
                  <Link to="/messaging"><Button variant="outline" size="sm" className="w-full">Aç</Button></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Son aktivlik */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Son aktivlik</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              {recentLogs.length === 0 && (
                <p className="text-sm text-gray-500">Son aktivlik tapılmadı.</p>
              )}
              {recentLogs.map((log) => (
                <div key={log._id || log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${log.action === 'send' ? 'bg-blue-500' : log.action === 'delivered' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-900">{log.type === 'direct' ? 'Birbaşa mesaj' : log.type === 'group' ? 'Qrup mesajı' : 'Qurum mesajı'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.createdAt || Date.now()).toLocaleString()}</span>
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