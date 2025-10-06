import { useEffect, useMemo, useState } from 'react';
import { getRequests } from '@/apiRequests/getRequests';
import { postRequests } from '@/apiRequests/postRequests';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import GroupMessagesModal from '@/components/GroupMessagesModal';

const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterInstitution, setFilterInstitution] = useState('');
  const [status, setStatus] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [memberSelectId, setMemberSelectId] = useState('');
  const [adminSelectId, setAdminSelectId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [createOpen, setCreateOpen] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupQuery, setGroupQuery] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    institution: '',
    members: []
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setGroupsLoading(true);
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
      } finally {
        setGroupsLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        setGroupsLoading(true);
        if (!filterInstitution) {
          const res = await getRequests.getGroups();
          setGroups(res?.data?.data || []);
        } else {
          const res = await getRequests.getGroupsByInstitution(filterInstitution);
          setGroups(res?.data?.data || []);
        }
      } catch {
        // ignore
      } finally {
        setGroupsLoading(false);
      }
    })();
  }, [filterInstitution]);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g => String(g?.name || '').toLowerCase().includes(q));
  }, [groups, groupQuery]);

  const selectedGroup = useMemo(() => groups.find((g) => String(g._id || g.id) === String(selectedGroupId)) || null, [groups, selectedGroupId]);

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
      setStatus(`Uğurlu: ${res?.data?.message || 'Qrup yaradıldı'}`);
      setCreateForm({ name: '', institution: '', members: [] });
      // refresh list
      const listRes = await getRequests.getGroups();
      setGroups(listRes?.data?.data || []);
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const addMember = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.addGroupMember(selectedGroupId, { employeeId });
      setStatus('Üzv əlavə edildi');
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const removeMember = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.removeGroupMember(selectedGroupId, { employeeId });
      setStatus('Üzv çıxarıldı');
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const addAdmin = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.addGroupAdmin(selectedGroupId, { employeeId });
      setStatus('Admin əlavə edildi');
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const removeAdmin = async (employeeId) => {
    if (!selectedGroupId || !employeeId) return;
    try {
      await postRequests.removeGroupAdmin(selectedGroupId, { employeeId });
      setStatus('Admin silindi');
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };
  const perms = user?.permissions || {};
  const canCreateGroup = perms?.isSuperAdmin === true || perms?.canAddAdmin === true;
  const canManageMembers = perms?.isSuperAdmin === true || perms?.canAddAdmin === true;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Qruplar</h1>
        <p className="text-gray-600">Qrupları siyahıla, yarat və idarə et.</p>
      </div>

      <div className="grid  gap-8">
        {/* Grup Listesi */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Qrup siyahısı</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Görünüş:</label>
              <Button size="sm" variant={viewMode==='list'?'default':'outline'} onClick={() => setViewMode('list')}>Siyahı</Button>
              <Button size="sm" variant={viewMode==='grid'?'default':'outline'} onClick={() => setViewMode('grid')}>Grid</Button>
              {canCreateGroup && (
                <Button size="sm" onClick={() => setCreateOpen(true)}>Yeni qrup</Button>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Qurum filtri</label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
            >
              <option value="">Hamısı</option>
              {institutions.map((inst) => (
                <option key={inst.id || inst._id} value={inst.id || inst._id}>
                  {inst.displayName || `${inst.shortName} - ${inst.longName}`}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Qrup axtarışı</label>
            <input
              className="w-full border rounded-md h-10 px-3"
              value={groupQuery}
              onChange={(e) => setGroupQuery(e.target.value)}
              placeholder="Qrup adı ilə axtarın"
            />
          </div>
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {groupsLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border rounded-md p-3 animate-pulse">
                      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              )}
              {!groupsLoading && filteredGroups.length === 0 && (
                <p className="text-sm text-gray-500">Qrup tapılmadı.</p>
              )}
              {!groupsLoading && filteredGroups.map((g) => (
                <div key={g.id || g._id} className={`border rounded-md p-3 ${selectedGroupId === (g.id || g._id) ? 'border-blue-500' : ''}`} onClick={() => setSelectedGroupId(g.id || g._id)}>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-500">Qurum: {g.institution?.displayName || g.institution?.shortName || g.institution || '-'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Üzv: {Array.isArray(g.members) ? g.members.length : 0}</span>
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setSelectedGroupId(g.id || g._id); setModalOpen(true); }}>Mesajlar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupsLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="h-5 w-1/2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </>
              )}
              {!groupsLoading && filteredGroups.length === 0 && (
                <p className="text-sm text-gray-500">Qrup tapılmadı.</p>
              )}
              {!groupsLoading && filteredGroups.map((g) => (
                <div key={g.id || g._id} className={`border rounded-lg p-4 hover:shadow transition cursor-pointer ${selectedGroupId === (g.id || g._id) ? 'border-blue-500' : 'hover:border-blue-300'}`} onClick={() => setSelectedGroupId(g.id || g._id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Qurum: {g.institution?.displayName || g.institution?.shortName || '-'}</p>
                    </div>
                    <span className="text-xs text-gray-500">Üzv: {Array.isArray(g.members) ? g.members.length : 0}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setSelectedGroupId(g.id || g._id); setModalOpen(true); }}>Mesajlar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grup Oluştur */}
        {/* Create Group Modal */}
        {canCreateGroup && createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setCreateOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Yeni qrup yarat</h2>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>Bağla</Button>
              </div>
              <form onSubmit={createGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qrup adı</label>
                  <input
                    className="w-full border rounded-md h-10 px-3"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Məs: Dəstək komandası"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Üzvlər (istəyə bağlı)</label>
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
                  <p className="text-xs text-gray-500 mt-1">Çox seçim üçün Ctrl/Command istifadə edin.</p>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Bağla</Button>
                  <Button type="submit">Yarat</Button>
                </div>
                {status && (
                  <p className={`text-sm ${status.startsWith('Xəta') ? 'text-red-600' : status === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{status}</p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Grup Yönetimi ve Mesajlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Üzvlər və adminlər</h2>
          {!selectedGroupId ? (
            <p className="text-sm text-gray-500">Əvvəlcə siyahıdan bir qrup seçin.</p>
          ) : (
            <div className="space-y-4">
              {canManageMembers ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Üzv əlavə/çıxar</label>
                    <div className="flex space-x-2">
                      <select className="flex-1 border rounded-md h-10 px-3" value={memberSelectId} onChange={(e) => setMemberSelectId(e.target.value)}>
                        <option value="">Seçim edin</option>
                        {employees.map((emp) => (
                          <option key={emp.id || emp._id} value={emp.id || emp._id}>
                            {(emp.fullName || `${emp.firstName} ${emp.lastName}`)} - {emp.email}
                          </option>
                        ))}
                      </select>
                      <Button type="button" onClick={() => addMember(memberSelectId)} disabled={!memberSelectId}>Əlavə et</Button>
                      <Button type="button" variant="outline" onClick={() => removeMember(memberSelectId)} disabled={!memberSelectId}>Çıxar</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin əlavə/sil</label>
                    <div className="flex space-x-2">
                      <select className="flex-1 border rounded-md h-10 px-3" value={adminSelectId} onChange={(e) => setAdminSelectId(e.target.value)}>
                        <option value="">Seçim edin</option>
                        {employees.map((emp) => (
                          <option key={emp.id || emp._id} value={emp.id || emp._id}>
                            {(emp.fullName || `${emp.firstName} ${emp.lastName}`)} - {emp.email}
                          </option>
                        ))}
                      </select>
                      <Button type="button" onClick={() => addAdmin(adminSelectId)} disabled={!adminSelectId}>Əlavə et</Button>
                      <Button type="button" variant="outline" onClick={() => removeAdmin(adminSelectId)} disabled={!adminSelectId}>Sil</Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Bu bölməni görmək üçün icazəniz yoxdur.</p>
              )}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Qrup mesajları</h2>
          {!selectedGroupId ? (
            <p className="text-sm text-gray-500">Əvvəlcə siyahıdan bir qrup seçin.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Seçilən qrup: <span className="font-medium text-gray-900">{selectedGroup?.name || ''}</span></p>
                  <p className="text-xs text-gray-500">Qurum: {selectedGroup?.institution?.displayName || selectedGroup?.institution?.shortName || '-'}</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>Mesajları aç</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GroupMessagesModal
        group={selectedGroup}
        open={modalOpen && Boolean(selectedGroup)}
        onClose={() => setModalOpen(false)}
        onGroupUpdate={(updated) => {
          if (!updated) return;
          const uid = String(updated._id || updated.id);
          setGroups((prev) => prev.map((g) => (String(g._id || g.id) === uid ? { ...g, ...updated } : g)));
        }}
      />
    </div>
  );
};

export default GroupsPage;