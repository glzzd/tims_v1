import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRequests } from '@/apiRequests/getRequests';
import { postRequests } from '@/apiRequests/postRequests';
import { useAuth } from '@/context/AuthContext';

const GroupMessagesModal = ({ group, open, onClose, onGroupUpdate }) => {
  const { user } = useAuth();
  const groupId = useMemo(() => String(group?._id || group?.id || ''), [group]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [sendText, setSendText] = useState('');

  const institutionId = useMemo(() => {
    const inst = group?.institution;
    const idCandidate = typeof inst === 'string' ? inst : (inst?._id || inst?.id);
    return idCandidate ? String(idCandidate) : '';
  }, [group]);
  const userInstitutionId = String(user?.institutionId || user?.institution || '');
  const perms = user?.permissions || {};
  const canSend = perms?.isSuperAdmin === true
    || perms?.canMessageAllGroups === true
    || (perms?.canMessageInstitutionGroups === true && institutionId && userInstitutionId === institutionId);

  const isResponsible = Boolean(group?.institution?.responsiblePerson) && String(group.institution.responsiblePerson) === String(user?.userId);
  const sameInstitution = institutionId && userInstitutionId === institutionId;
  const canEdit = perms?.isSuperAdmin === true
    || isResponsible
    || perms?.canWriteAllGroups === true
    || (perms?.canWriteInstitutionGroups === true && sameInstitution);
  const canManageMembers = perms?.isSuperAdmin === true
    || perms?.canWriteAllGroups === true
    || (perms?.canWriteInstitutionGroups === true && sameInstitution);

  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'members'
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [membersStatus, setMembersStatus] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState(null);

  const getId = (val) => String((val && (val._id || val.id)) || val || '');

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSearch('');
    setSendText('');
    setStatusMsg(null);
    const initialMembers = Array.isArray(group?.members) ? group.members.map((m) => getId(m)) : [];
    setMemberIds(initialMembers);
  }, [open, group]);

  const fetchMessages = async (opts = {}) => {
    if (!groupId || !open) return;
    const p = opts.page || page;
    const s = typeof opts.search === 'string' ? opts.search : search;
    try {
      if (s && s.trim().length > 0) {
        const res = await getRequests.searchGroupMessages(groupId, { search: s.trim() });
        const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
        setGroupMessages(arr);
        // search does not include pagination metadata
        setTotalItems(arr.length);
      } else {
        const res = await getRequests.getGroupMessages(groupId, { page: p, limit });
        const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
        const pagination = res?.data?.pagination || {};
        setGroupMessages(arr);
        setTotalItems(pagination.totalItems || arr.length);
        setPage(pagination.currentPage || p);
      }
    } catch (err) {
      setGroupMessages([]);
    }
    // oxunmamış sayımı deaktiv edildi
  };

  useEffect(() => { fetchMessages({}); }, [groupId, open]);

  // Üzv siyahısını çək (tab açıldığında)
  useEffect(() => {
    const loadEmployees = async () => {
      if (!open || activeTab !== 'members' || !institutionId) return;
      try {
        const res = await getRequests.getEmployeesByInstitution(institutionId);
        const arr = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        setEmployees(arr);
      } catch (err) {
        setEmployees([]);
      }
    };
    loadEmployees();
  }, [activeTab, open, institutionId]);

  const currentMembers = useMemo(() => {
    const set = new Set(memberIds.map(getId));
    return employees.filter((e) => set.has(getId(e)));
  }, [employees, memberIds]);

  const eligibleEmployees = useMemo(() => {
    const set = new Set(memberIds.map(getId));
    return employees.filter((e) => !set.has(getId(e)));
  }, [employees, memberIds]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await fetchMessages({ search });
  };

  const handleClearSearch = async () => {
    setSearch('');
    await fetchMessages({ search: '' });
  };

  const handlePrev = async () => {
    if (page <= 1) return;
    const newPage = page - 1;
    await fetchMessages({ page: newPage });
  };

  const handleNext = async () => {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    if (page >= totalPages) return;
    const newPage = page + 1;
    await fetchMessages({ page: newPage });
  };

  // oxundu kimi işarələmə funksiyası deaktiv edildi

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    const content = (sendText || '').trim();
    if (!content) {
      setStatusMsg('Mesaj məzmunu boş ola bilməz');
      return;
    }
    setStatusMsg('Göndərilir...');
    try {
      await postRequests.sendGroupMessage(groupId, { content });
      setStatusMsg('Uğurla göndərildi');
      setSendText('');
      await fetchMessages({});
    } catch (err) {
      setStatusMsg(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const startEdit = (m) => {
    if (!canEdit) return;
    setEditingMessageId(m._id || m.id);
    setEditContent(m.content || '');
    setEditStatus(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
    setEditStatus(null);
  };

  const saveEdit = async () => {
    if (!canEdit || !editingMessageId) return;
    const content = (editContent || '').trim();
    if (!content) { setEditStatus('Məzmun boş ola bilməz'); return; }
    setEditStatus('Yenilənir...');
    try {
      await postRequests.updateGroupMessage(editingMessageId, { content });
      setEditStatus('Uğurla yeniləndi');
      setEditingMessageId(null);
      setEditContent('');
      await fetchMessages({});
    } catch (err) {
      setEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const toggleSelectEmployee = (id) => {
    setSelectedEmployeeIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedMembers = async () => {
    if (!canManageMembers || !groupId || selectedEmployeeIds.length === 0) return;
    setMembersStatus('Əlavə edilir...');
    try {
      const promises = selectedEmployeeIds.map((eid) => postRequests.addGroupMember(groupId, { employeeId: eid }));
      await Promise.allSettled(promises);
      // Refresh group info to sync counts and members list
      try {
        const res = await getRequests.getGroup(groupId);
        const updated = res?.data?.data || null;
        const updatedMembers = Array.isArray(updated?.members) ? updated.members.map((m) => getId(m)) : [];
        setMemberIds(updatedMembers);
        if (typeof onGroupUpdate === 'function' && updated) {
          onGroupUpdate(updated);
        }
      } catch (_) {
        // Fallback: optimistic update
        setMemberIds((prev) => Array.from(new Set([...prev, ...selectedEmployeeIds.map(String)])));
      }
      setMembersStatus('Seçilən üzvlər əlavə edildi');
      setSelectedEmployeeIds([]);
    } catch (err) {
      setMembersStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow w-full max-w-4xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{group?.name || 'Qrup'}</h3>
            <p className="text-sm text-gray-600">Qurum: {group?.institution?.displayName || group?.institution?.shortName || '-'}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Bağla</Button>
        </div>
        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b mb-3">
          <Button size="sm" variant={activeTab === 'messages' ? 'default' : 'outline'} onClick={() => setActiveTab('messages')}>Mesajlar</Button>
          <Button size="sm" variant={activeTab === 'members' ? 'default' : 'outline'} onClick={() => setActiveTab('members')}>Üzvlər</Button>
        </div>

        {activeTab === 'messages' && (
        <div className="flex items-center justify-end mb-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <Input className="h-9" placeholder="Mesaj axtar" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" size="sm">Axtar</Button>
            {search && <Button type="button" size="sm" variant="outline" onClick={handleClearSearch}>Təmizlə</Button>}
          </form>
        </div>)}

        {activeTab === 'messages' && (
        <div className="space-y-2 max-h-96 overflow-auto border rounded-md p-2">
          {groupMessages.length === 0 && (
            <p className="text-sm text-gray-500">Mesaj yoxdur.</p>
          )}
          {groupMessages.map((m) => (
            <div key={m._id || m.id} className="border rounded-md p-3">
              <div className="flex justify-between">
                <div>
                  {editingMessageId === (m._id || m.id) ? (
                    <div className="space-y-2">
                      <textarea className="w-full border rounded-md min-h-20 px-3 py-2" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={saveEdit} disabled={!canEdit}>Yadda saxla</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Ləğv et</Button>
                      </div>
                      {editStatus && (
                        <p className={`text-xs ${editStatus.startsWith('Xəta') ? 'text-red-600' : editStatus === 'Yenilənir...' ? 'text-gray-600' : 'text-green-600'}`}>{editStatus}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{m.content}</p>
                  )}
                  <p className="text-xs text-gray-500">{new Date(m.createdAt || m.date || Date.now()).toLocaleString()}</p>
                </div>
               
              </div>
            </div>
          ))}
        </div>)}

        {activeTab === 'messages' && !search && (
          <div className="flex items-center justify-between mt-3">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={page <= 1}>Əvvəlki</Button>
            <span className="text-xs text-gray-600">Səhifə {page} / {Math.max(1, Math.ceil(totalItems / limit))}</span>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={page >= Math.max(1, Math.ceil(totalItems / limit))}>Sonrakı</Button>
          </div>
        )}
        {activeTab === 'messages' && (
          <form onSubmit={handleSend} className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Mesaj göndər</label>
            <textarea className="w-full border rounded-md min-h-24 px-3 py-2" value={sendText} onChange={(e) => setSendText(e.target.value)} placeholder="Məzmun..." disabled={!canSend} />
            <div className="flex items-center justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={onClose}>Bağla</Button>
              <Button type="submit" disabled={!canSend}>Göndər</Button>
            </div>
            {statusMsg && (
              <p className={`text-sm ${statusMsg.startsWith('Xəta') ? 'text-red-600' : statusMsg === 'Göndərilir...' ? 'text-gray-600' : 'text-green-600'}`}>{statusMsg}</p>
            )}
            {!canSend && (
              <p className="text-xs text-gray-500">Bu qrupa mesaj göndərmək üçün icazəniz yoxdur.</p>
            )}
          </form>
        )}

        {activeTab === 'members' && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Üzv sayı: <span className="font-medium text-gray-900">{memberIds.length}</span></p>
              {!canManageMembers && (
                <p className="text-xs text-gray-500">Üzv idarəsi üçün icazəniz yoxdur.</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Mövcud üzvlər</h4>
              <div className="max-h-40 overflow-auto border rounded-md p-2">
                {currentMembers.length === 0 && (
                  <p className="text-sm text-gray-500">Qrupda hələ üzv yoxdur.</p>
                )}
                {currentMembers.map((e) => (
                  <div key={e._id || e.id} className="flex items-center justify-between border rounded-md p-2 mb-2">
                    <div>
                      <p className="text-sm text-gray-900">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-gray-500">{e.email || e.timsUsername || '-'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Üzv</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Əlavə edilə bilən şəxslər</h4>
              <div className="max-h-56 overflow-auto border rounded-md p-2">
                {eligibleEmployees.length === 0 && (
                  <p className="text-sm text-gray-500">Əlavə edilə bilən işçi yoxdur.</p>
                )}
                {eligibleEmployees.map((e) => (
                  <label key={e._id || e.id} className="flex items-center justify-between border rounded-md p-2 mb-2">
                    <div>
                      <p className="text-sm text-gray-900">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-gray-500">{e.email || e.timsUsername || '-'}</p>
                    </div>
                    <input type="checkbox" disabled={!canManageMembers} checked={selectedEmployeeIds.includes(e._id || e.id)} onChange={() => toggleSelectEmployee(e._id || e.id)} />
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-end mt-3 space-x-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedEmployeeIds([])}>Təmizlə</Button>
                <Button size="sm" onClick={addSelectedMembers} disabled={!canManageMembers || selectedEmployeeIds.length === 0}>Seçilənləri əlavə et</Button>
              </div>
              {membersStatus && (
                <p className={`text-sm mt-2 ${membersStatus.startsWith('Xəta') ? 'text-red-600' : membersStatus === 'Əlavə edilir...' ? 'text-gray-600' : 'text-green-600'}`}>{membersStatus}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMessagesModal;