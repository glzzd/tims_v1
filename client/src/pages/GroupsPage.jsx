import { useEffect, useState } from 'react';
import { getRequests } from '@/apiRequests/getRequests';
import { postRequests } from '@/apiRequests/postRequests';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterInstitution, setFilterInstitution] = useState('');
  const [status, setStatus] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageSearch, setMessageSearch] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    institution: '',
    members: []
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        if (user?.permissions?.isSuperAdmin === true) {
          const [grpRes, instRes, empRes] = await Promise.all([
            getRequests.getGroups(),
            getRequests.getInstitutions(),
            getRequests.getEmployees()
          ]);
          setGroups(grpRes?.data?.data || []);
          setInstitutions(instRes?.data?.data || []);
          setEmployees(empRes?.data?.data || []);
        } else {
          const myInstRes = await getRequests.getMyInstitutions();
          const myInstitutions = myInstRes?.data?.data || [];
          setInstitutions(myInstitutions);
          const firstInstId = myInstitutions[0]?.id || myInstitutions[0]?._id || '';
          if (firstInstId) {
            const [grpRes, empRes] = await Promise.all([
              getRequests.getGroupsByInstitution(firstInstId),
              getRequests.getEmployeesByInstitution(firstInstId)
            ]);
            setGroups(grpRes?.data?.data || []);
            setEmployees(empRes?.data?.data || []);
            setFilterInstitution(firstInstId);
          } else {
            setGroups([]);
            setEmployees([]);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!filterInstitution) return;
    (async () => {
      try {
        const res = await getRequests.getGroupsByInstitution(filterInstitution);
        setGroups(res?.data?.data || []);
      } catch {
        // ignore
      }
    })();
  }, [filterInstitution]);

  useEffect(() => {
    (async () => {
      if (!selectedGroupId) {
        setMessages([]);
        setUnreadCount(0);
        return;
      }
      try {
        const [msgRes, unreadRes] = await Promise.all([
          getRequests.getGroupMessages(selectedGroupId, { page: 1, limit: 50 }),
          getRequests.getUnreadCount(selectedGroupId)
        ]);
        setMessages(msgRes?.data?.data || []);
        setUnreadCount(unreadRes?.data?.data?.count || unreadRes?.data?.data || 0);
      } catch {
        setMessages([]);
        setUnreadCount(0);
      }
    })();
  }, [selectedGroupId]);

  const createGroup = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const payload = {
        name: createForm.name,
        institution: createForm.institution,
        members: createForm.members.filter(Boolean)
      };
      const res = await postRequests.createGroup(payload);
      setStatus(`Başarılı: ${res?.data?.message || 'Grup oluşturuldu'}`);
      setCreateForm({ name: '', institution: '', members: [] });
      // refresh list
      const listRes = await getRequests.getGroups();
      setGroups(listRes?.data?.data || []);
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const addMember = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.addGroupMember(selectedGroupId, { employeeId });
      setStatus('Üye eklendi');
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const removeMember = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.removeGroupMember(selectedGroupId, { employeeId });
      setStatus('Üye kaldırıldı');
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const addAdmin = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.addGroupAdmin(selectedGroupId, { employeeId });
      setStatus('Admin eklendi');
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const removeAdmin = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.removeGroupAdmin(selectedGroupId, { employeeId });
      setStatus('Admin kaldırıldı');
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const searchMessages = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    try {
      const res = await getRequests.searchGroupMessages(selectedGroupId, { search: messageSearch });
      setMessages(res?.data?.data || []);
    } catch {
      // ignore
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await postRequests.markMessageAsRead(messageId);
      // refresh unread count
      const unreadRes = await getRequests.getUnreadCount(selectedGroupId);
      setUnreadCount(unreadRes?.data?.data?.count || unreadRes?.data?.data || 0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gruplar</h1>
        <p className="text-gray-600">Grupları listeleyin ve yeni grup oluşturun.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Grup Listesi */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Grup Listesi</h2>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Qurum Filtresi</label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
            >
              <option value="">Tümü</option>
              {institutions.map((inst) => (
                <option key={inst.id || inst._id} value={inst.id || inst._id}>
                  {inst.displayName || `${inst.shortName} - ${inst.longName}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {groups.length === 0 && (
              <p className="text-sm text-gray-500">Grup bulunamadı.</p>
            )}
            {groups.map((g) => (
              <div key={g.id || g._id} className={`border rounded-md p-3 ${selectedGroupId === (g.id || g._id) ? 'border-blue-500' : ''}`} onClick={() => setSelectedGroupId(g.id || g._id)}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-500">Qurum: {g.institution?.displayName || g.institution?.shortName || g.institution || '-'}</p>
                  </div>
                  <div className="text-xs text-gray-500">Üye: {Array.isArray(g.members) ? g.members.length : 0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grup Oluştur */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Grup Oluştur</h2>
          <form onSubmit={createGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grup Adı</label>
              <input
                className="w-full border rounded-md h-10 px-3"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Örn: Destek Ekibi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={createForm.institution}
                onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                required
              >
                <option value="">Qurum seçin</option>
                {institutions.map((inst) => (
                  <option key={inst.id || inst._id} value={inst.id || inst._id}>
                    {inst.displayName || `${inst.shortName} - ${inst.longName}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Üyeler (opsiyonel)</label>
              <select
                multiple
                className="w-full border rounded-md min-h-24 px-3 py-2"
                value={createForm.members}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                  setCreateForm({ ...createForm, members: opts });
                }}
              >
                {employees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {(emp.fullName || `${emp.firstName} ${emp.lastName}`)} - {emp.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Ctrl/Command ile çoklu seçim yapabilirsiniz.</p>
            </div>
            <Button type="submit" className="w-full">Oluştur</Button>
            {status && (
              <p className={`text-sm ${status.startsWith('Hata') ? 'text-red-600' : status === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{status}</p>
            )}
          </form>
        </div>
      </div>

      {/* Grup Yönetimi ve Mesajlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Üyeler ve Adminler</h2>
          {!selectedGroupId ? (
            <p className="text-sm text-gray-500">Önce listeden bir grup seçin.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Üye Ekle/Kaldır</label>
                <div className="flex space-x-2">
                  <select className="flex-1 border rounded-md h-10 px-3" id="memberSelect">
                    {employees.map((emp) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {(emp.fullName || `${emp.firstName} ${emp.lastName}`)} - {emp.email}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={() => addMember(document.getElementById('memberSelect')?.value)}>Ekle</Button>
                  <Button type="button" variant="outline" onClick={() => removeMember(document.getElementById('memberSelect')?.value)}>Kaldır</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Ekle/Kaldır</label>
                <div className="flex space-x-2">
                  <select className="flex-1 border rounded-md h-10 px-3" id="adminSelect">
                    {employees.map((emp) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {(emp.fullName || `${emp.firstName} ${emp.lastName}`)} - {emp.email}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={() => addAdmin(document.getElementById('adminSelect')?.value)}>Ekle</Button>
                  <Button type="button" variant="outline" onClick={() => removeAdmin(document.getElementById('adminSelect')?.value)}>Kaldır</Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grup Mesajları</h2>
          {!selectedGroupId ? (
            <p className="text-sm text-gray-500">Önce listeden bir grup seçin.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Okunmamış: {unreadCount}</span>
                <form onSubmit={searchMessages} className="flex items-center space-x-2">
                  <input
                    className="border rounded-md h-10 px-3"
                    placeholder="Mesaj ara"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                  />
                  <Button type="submit">Ara</Button>
                </form>
              </div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500">Mesaj bulunamadı.</p>
                )}
                {messages.map((m) => (
                  <div key={m.id || m._id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-900">{m.content}</p>
                        <p className="text-xs text-gray-500">{new Date(m.createdAt || m.date || Date.now()).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!m.read && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead(m.id || m._id)}>Okundu İşaretle</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;