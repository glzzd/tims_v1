import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Home, Users, MessageSquare, Building2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
  const [myGroups, setMyGroups] = useState([]);
  const [myInstitutions, setMyInstitutions] = useState([]);
  const [trendData, setTrendData] = useState([]); // [{ day: '2025-10-01', count: 3 }, ...]
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const daysWindow = 14;

  const formatDay = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const aggregateDailyCounts = (logs, days = daysWindow) => {
    const today = new Date();
    const series = [];
    const counts = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDay(d);
      series.push(key);
      counts[key] = 0;
    }
    (logs || []).forEach((log) => {
      const key = formatDay(log.createdAt || log.updatedAt || Date.now());
      if (key in counts) counts[key] += 1;
    });
    return series.map((day) => ({ day, count: counts[day] || 0 }));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingDashboard(true);
      setDashboardError(null);
      try {
        const [groupsRes, instRes, logsRes] = await Promise.all([
          getRequests.getMyGroups(),
          getRequests.getMyInstitutions(),
          getRequests.getMessageLogs({ page: 1, limit: 200, action: 'send' })
        ]);
        const groups = Array.isArray(groupsRes?.data?.data) ? groupsRes.data.data : [];
        const insts = Array.isArray(instRes?.data?.data) ? instRes.data.data : [];
        const logs = Array.isArray(logsRes?.data?.data) ? logsRes.data.data : [];

        let empCount = 0;
        if (insts[0]?.id || insts[0]?._id) {
          const instId = String(insts[0].id || insts[0]._id);
          try {
            const empRes = await getRequests.getEmployees({ institution: instId, limit: 1 });
            empCount = empRes?.data?.pagination?.total || empRes?.data?.pagination?.totalItems || 0;
          } catch (_) {}
        }

        const trend = aggregateDailyCounts(logs, daysWindow);

        if (mounted) {
          setMyGroups(groups);
          setMyInstitutions(insts);
          setStats({ myGroups: groups.length, myInstitutions: insts.length, employeesInMyInstitution: empCount });
          setRecentLogs(logs.slice(0, 5));
          setTrendData(trend);
        }
      } catch (err) {
        if (mounted) setDashboardError(err?.response?.data?.message || err.message || 'Panel yüklənmə xətası');
      } finally {
        if (mounted) setLoadingDashboard(false);
      }
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

      {/* Mesaj trendi (Son 14 gün) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Son 14 gün mesaj trendi</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {loadingDashboard ? (
            <p className="text-sm text-gray-600">Yüklənir...</p>
          ) : dashboardError ? (
            <p className="text-sm text-red-600">{dashboardError}</p>
          ) : trendData.length === 0 ? (
            <p className="text-sm text-gray-600">Məlumat tapılmadı.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.map((d) => ({ name: new Date(d.day).toLocaleDateString(), count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} height={40} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}`, 'Mesaj sayısı']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

     

      {/* Mənim qruplarım */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mənim qruplarım</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loadingDashboard ? (
              <p className="text-sm text-gray-600">Yüklənir...</p>
            ) : myGroups.length === 0 ? (
              <p className="text-sm text-gray-600">Qrup tapılmadı.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qurum</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myGroups.map((g) => (
                    <tr key={g._id || g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{g.name || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{(g.institution && (g.institution.name || g.institution.shortName)) || '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <Link to="/messaging"><Button size="sm" variant="outline">Mesajlaşma</Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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