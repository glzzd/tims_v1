import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postRequests } from '@/apiRequests/postRequests';
import { getRequests } from '@/apiRequests/getRequests';
import { useAuth } from '@/context/AuthContext';
import UserTimelineModal from '@/components/UserTimelineModal';

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [activeLogTab, setActiveLogTab] = useState('subject');

  const getActionStyle = (actionRaw) => {
    const action = String(actionRaw || '').toLowerCase();
    if (action.includes('create')) return { color: 'bg-emerald-500', ring: 'ring-emerald-200', badge: 'text-emerald-700 bg-emerald-100', icon: '＋', label: 'Oluşturma' };
    if (action.includes('delete')) return { color: 'bg-rose-500', ring: 'ring-rose-200', badge: 'text-rose-700 bg-rose-100', icon: '✖', label: 'Silme' };
    if (action.includes('permission')) return { color: 'bg-violet-500', ring: 'ring-violet-200', badge: 'text-violet-700 bg-violet-100', icon: '⚙', label: 'İzin Güncelleme' };
    if (action.includes('update')) return { color: 'bg-amber-500', ring: 'ring-amber-200', badge: 'text-amber-700 bg-amber-100', icon: '✎', label: 'Güncelleme' };
    return { color: 'bg-blue-500', ring: 'ring-blue-200', badge: 'text-blue-700 bg-blue-100', icon: '•', label: 'İşlem' };
  };

  const isSameInstitution = (a, b) => {
    const aid = String(a?.__id || a?._id || a || '');
    const bid = String(b?.__id || b?._id || b || '');
    return aid === bid;
  };

  const formatInstitution = (inst) => {
    if (!inst) return '-';
    // If inst is id string, resolve from institutions list
    if (typeof inst === 'string') {
      const found = institutions.find(i => String(i?._id || i?.id || '') === String(inst));
      if (found) {
        const short = found.shortName || '';
        const long = found.longName || '';
        return `${short}${long ? ' - ' + long : ''}` || '-';
      }
      return '-';
    }
    // If inst is populated object
    const short = inst.shortName || '';
    const long = inst.longName || '';
    return `${short}${long ? ' - ' + long : ''}` || '-';
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const defaultPermissions = {
    isSuperAdmin: false,
    canAddAdmin: false,
    canAddUser: false,
    canAddEmployee: false,
    canMessageAllGroups: false,
    canMessageInstitutionGroups: true,
    canReadAllGroups: false,
    canWriteAllGroups: false,
    canReadInstitutionGroups: true,
    canWriteInstitutionGroups: false,
    canReadAllUsers: true,
    canUpdateAllUsers: true,
    canDeleteUsers: true,
    canWriteAllUsers: true,
    canReadOwnInstitutionUsers: true,
    canWriteOwnInstitutionUsers: true,
    canUpdateOwnInstitutionUsers: true,
    canDeleteOwnInstitutionUsers: true,
    canMessageDirect: true
  };
  const permissionLabels = {
    isSuperAdmin: 'Super administrator',
    canAddAdmin: 'Admin əlavə et',
    canAddUser: 'İstifadəçi əlavə et',
    canAddEmployee: 'İşçi əlavə et',
    canMessageAllGroups: 'Bütün qruplara mesaj',
    canMessageInstitutionGroups: 'Qurum qruplarına mesaj',
    canReadAllGroups: 'Bütün qrupları oxu',
    canWriteAllGroups: 'Bütün qruplara yaz',
    canReadInstitutionGroups: 'Qurum qruplarını oxu',
    canWriteInstitutionGroups: 'Qurum qruplarına yaz',
    canReadAllUsers: 'Bütün istifadəçiləri gör',
    canUpdateAllUsers: 'Bütün istifadəçiləri redaktə et',
    canDeleteUsers: 'İstifadəçiləri sil',
    canWriteAllUsers: 'Bütün istifadəçiləri əlavə et',
    canReadOwnInstitutionUsers: 'Öz qurumunun istifadəçilərini gör',
    canWriteOwnInstitutionUsers: 'Öz qurumuna istifadəçi əlavə et',
    canUpdateOwnInstitutionUsers: 'Öz qurumunun istifadəçilərini redaktə et',
    canDeleteOwnInstitutionUsers: 'Öz qurumunun istifadəçilərini sil',
    canMessageDirect: 'Birbaşa mesaj göndər'
  };
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', institutionId: '', permissions: defaultPermissions });
  const [createStatus, setCreateStatus] = useState(null);

  const [institutions, setInstitutions] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const canReadAll = user?.permissions?.canReadAllUsers === true;
      const canReadOwn = user?.permissions?.canReadOwnInstitutionUsers === true;
      if (!canReadAll && !canReadOwn) {
        setError('Yetki yok');
        setUsers([]);
        return;
      }
      const params = {};
      if (search) params.search = search;
      const res = await getRequests.getUsers(params);
      setUsers(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [user]);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await getRequests.getInstitutions();
        setInstitutions(res?.data?.data || []);
      } catch (e) {
        // ignore
        setInstitutions([]);
      }
    };
    // Load institutions for display and selection when user can read or write users
    if (user?.permissions?.canReadAllUsers || user?.permissions?.canReadOwnInstitutionUsers || user?.permissions?.canWriteAllUsers) {
      loadInstitutions();
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateStatus('loading');
    try {
      const payload = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        permissions: createForm.permissions
      };
      const canWriteAll = user?.permissions?.canWriteAllUsers === true;
      const canWriteOwn = user?.permissions?.canWriteOwnInstitutionUsers === true;
      if (!canWriteAll && !canWriteOwn) {
        throw new Error('Yetki yok');
      }
      if (canWriteAll && createForm.institutionId) {
        payload.institutionId = createForm.institutionId;
      }
      await postRequests.createUser(payload);
      setCreateStatus('Başarılı');
      setCreateForm({ name: '', email: '', password: '', institutionId: '', permissions: defaultPermissions });
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err) {
      setCreateStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const openEdit = (u) => {
    setEditUser({
      ...u,
      institutionId: u.institution?._id || u.institution || '',
      permissions: { ...defaultPermissions, ...(u.permissions || {}) }
    });
    setEditStatus(null);
  };

  const handleOpenLogs = async (u) => {
    if (user?.permissions?.isSuperAdmin !== true) return;
    setSelectedUser(u);
    setLogsLoading(true);
    setLogsError(null);
    try {
      const [logsRes, activityRes] = await Promise.all([
        getRequests.getUserLogs(u._id, { page: 1, limit: 50 }),
        getRequests.getUserActivity(u._id, { page: 1, limit: 50 })
      ]);
      setUserLogs(logsRes?.data?.data || []);
      setUserActivity(activityRes?.data?.data || []);
    } catch (err) {
      setLogsError(err?.response?.data?.message || err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editUser?._id) return;
    setEditStatus('loading');
    try {
      const payload = { name: editUser.name, email: editUser.email };
      if (editUser.password) payload.password = editUser.password;
      if (typeof editUser.institutionId !== 'undefined') payload.institutionId = editUser.institutionId || null;
      await postRequests.updateUser(editUser._id, payload);
      if (editUser.permissions && typeof editUser.permissions === 'object') {
        await postRequests.updateUserPermissions(editUser._id, { permissions: editUser.permissions });
      }
      setEditStatus('Kaydedildi');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setEditStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await postRequests.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İstifadəçilər</h1>
          <p className="text-gray-600">Bütün istifadəçilərə baxın və yeni istifadəçi əlavə edin.</p>
        </div>
        {user?.permissions?.canAddUser === true && (
          <Button onClick={() => setIsCreateOpen(true)}>Yeni istifadəçi</Button>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar (ad və ya e‑poçt)" />
        <Button variant="outline" onClick={fetchUsers}>Axtar</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E‑poçt</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qurum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
      {loading ? (
              <tr><td className="px-4 py-4" colSpan={3}>Yüklənir...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-4 text-red-600" colSpan={3}>{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={3}>Qeyd tapılmadı</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className={`px-4 py-3 text-gray-900 ${user?.permissions?.isSuperAdmin ? 'cursor-pointer underline decoration-dotted' : ''}`} onClick={() => user?.permissions?.isSuperAdmin && handleOpenLogs(u)}>{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{formatInstitution(u.institution)}</td>
                  <td className="px-4 py-3 space-x-2">
                    {(user?.permissions?.canUpdateAllUsers || (user?.permissions?.canUpdateOwnInstitutionUsers && isSameInstitution(u.institution, user?.institution))) && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>Redaktə et</Button>
                    )}
                    {(user?.permissions?.canDeleteUsers || (user?.permissions?.canDeleteOwnInstitutionUsers && isSameInstitution(u.institution, user?.institution))) && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(u._id)}>Sil</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[50vw]  p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İstifadəçi yarat</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E‑poçt</label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@nümunə.az" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
                <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="••••••" />
              </div>
              {user?.permissions?.canWriteAllUsers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={createForm.institutionId} onChange={(e) => setCreateForm({ ...createForm, institutionId: e.target.value })}>
                    <option value="">Seçim yoxdur</option>
                    {institutions.map(inst => (
                      <option key={inst._id || inst.id} value={inst._id || inst.id}>{(inst.shortName || '') + (inst.longName ? ' - ' + inst.longName : '')}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İcazələr</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(defaultPermissions)
                    .filter((key) => {
                      const globalKeys = [
                        'canReadAllUsers','canWriteAllUsers','canUpdateAllUsers','canDeleteUsers','canMessageAllGroups','canReadAllGroups','canWriteAllGroups','isSuperAdmin'
                      ];
                      const isGlobal = globalKeys.includes(key);
                      return user?.permissions?.isSuperAdmin === true ? true : !isGlobal;
                    })
                    .map((key) => (
                      <label key={key} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={Boolean(createForm.permissions?.[key])}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            permissions: { ...createForm.permissions, [key]: e.target.checked }
                          })}
                        />
                        <span className="text-gray-700">{permissionLabels[key] || key}</span>
                      </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Ləğv et</Button>
                <Button type="submit">Yarat</Button>
              </div>
              {createStatus && (
                <p className={`text-sm ${createStatus.startsWith('Hata') ? 'text-red-600' : createStatus === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{createStatus}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditUser(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[50vw] p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İstifadəçini redaktə et</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} placeholder="Ad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E‑poçt</label>
                <Input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} placeholder="email@nümunə.az" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
                <Input type="password" value={editUser.password || ''} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} placeholder="••••••" />
              </div>
              {user?.permissions?.canUpdateAllUsers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={editUser.institutionId || ''} onChange={(e) => setEditUser({ ...editUser, institutionId: e.target.value })}>
                    <option value="">Seçim yoxdur</option>
                    {institutions.map(inst => (
                      <option key={inst._id || inst.id} value={inst._id || inst.id}>{(inst.shortName || '') + (inst.longName ? ' - ' + inst.longName : '')}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İcazələr</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(defaultPermissions)
                    .filter((key) => {
                      const globalKeys = [
                        'canReadAllUsers','canWriteAllUsers','canUpdateAllUsers','canDeleteUsers','canMessageAllGroups','canReadAllGroups','canWriteAllGroups','isSuperAdmin'
                      ];
                      const isGlobal = globalKeys.includes(key);
                      return user?.permissions?.isSuperAdmin === true ? true : !isGlobal;
                    })
                    .map((key) => (
                      <label key={key} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={Boolean(editUser.permissions?.[key])}
                          onChange={(e) => setEditUser({
                            ...editUser,
                            permissions: { ...editUser.permissions, [key]: e.target.checked }
                          })}
                        />
                        <span className="text-gray-700">{permissionLabels[key] || key}</span>
                      </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setEditUser(null)}>Ləğv et</Button>
                <Button type="submit">Yadda saxla</Button>
              </div>
              {editStatus && (
                <p className={`text-sm ${editStatus.startsWith('Hata') ? 'text-red-600' : editStatus === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{editStatus}</p>
              )}
            </form>
          </div>
        </div>
      )}
      {selectedUser && user?.permissions?.isSuperAdmin && (
        <UserTimelineModal
          selectedUser={selectedUser}
          institutionText={formatInstitution(selectedUser.institution)}
          institutions={institutions}
          onClose={() => { setSelectedUser(null); setUserLogs([]); setUserActivity([]); setActiveLogTab('subject'); }}
          logsLoading={logsLoading}
          logsError={logsError}
          userLogs={userLogs}
          userActivity={userActivity}
          activeLogTab={activeLogTab}
          setActiveLogTab={setActiveLogTab}
        />
      )}
    </div>
  );
};

export default UsersPage;