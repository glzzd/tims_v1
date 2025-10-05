import { useEffect, useState, useMemo, useRef, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRequests } from '@/apiRequests/getRequests';
import { postRequests } from '@/apiRequests/postRequests';
import { useAuth } from '@/context/AuthContext';

const InstitutionDetailModal = ({ institution, onClose, onUpdated }) => {
  const { user } = useAuth();
  const institutionId = String(institution?._id || institution?.id || '');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'employees'
  const [messageCount, setMessageCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [countError, setCountError] = useState(null);

  const [instEdit, setInstEdit] = useState({
    longName: institution?.longName || '',
    shortName: institution?.shortName || '',
    type: institution?.type || 'dövlət',
    messageLimit: typeof institution?.messageLimit === 'number' ? institution.messageLimit : 0,
    responsiblePerson: institution?.responsiblePerson?._id || institution?.responsiblePerson || '',
    isActive: institution?.isActive ?? true
  });
  const [instEditStatus, setInstEditStatus] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userEditStatus, setUserEditStatus] = useState(null);
  const [userActionStatus, setUserActionStatus] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeEditStatus, setEmployeeEditStatus] = useState(null);
  const [employeeActionStatus, setEmployeeActionStatus] = useState(null);
  const [directMessageText, setDirectMessageText] = useState({});
  const [directMessageStatus, setDirectMessageStatus] = useState({});
  const editorRefs = useRef({});
  const [directMessageOpen, setDirectMessageOpen] = useState({});
  const [directMessageHistory, setDirectMessageHistory] = useState({});
  const [directMessageHistoryStatus, setDirectMessageHistoryStatus] = useState({});

  const sanitizePlain = (text) => {
    if (!text) return '';
    return String(text).replace(/\u00A0/g, ' ').replace(/\s{3,}/g, ' ').trim();
  };

  const fetchEmployeeHistory = async (employeeId) => {
    if (!employeeId) return;
    setDirectMessageHistoryStatus((p) => ({ ...p, [employeeId]: 'Yüklənir...' }));
    try {
      const resp = await getRequests.getDirectHistory(employeeId, { limit: 20, page: 1 });
      const arr = Array.isArray(resp?.data?.data) ? resp.data.data : [];
      setDirectMessageHistory((p) => ({ ...p, [employeeId]: arr }));
      setDirectMessageHistoryStatus((p) => ({ ...p, [employeeId]: arr.length ? '' : 'Tarix tapılmadı' }));
    } catch (err) {
      setDirectMessageHistoryStatus((p) => ({ ...p, [employeeId]: `Xəta: ${err?.response?.data?.message || err.message}` }));
    }
  };

  const handleEditorInput = (employeeId, ev) => {
    try {
      const el = editorRefs.current[employeeId] || ev?.currentTarget || null;
      const text = el && typeof el.textContent === 'string' ? el.textContent : '';
      setDirectMessageText((prev) => ({ ...prev, [employeeId]: text }));
    } catch (e) {
      // ignore
    }
  };

  const handlePastePlain = (ev) => {
    try {
      ev.preventDefault();
      const text = ev.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    } catch (e) {
      // noop
    }
  };

  const handleBeforeInput = (ev) => {
    const t = ev.inputType || '';
    if (t.startsWith('format') || t === 'insertFromPaste' || t === 'insertFromDrop') {
      ev.preventDefault();
    }
  };

  const canEditUsers = useMemo(() => {
    const perms = user?.permissions || {};
    if (perms.canUpdateAllUsers) return true;
    if (perms.canUpdateOwnInstitutionUsers && institutionId && String(user?.institutionId || user?.institution || '') === institutionId) return true;
    return false;
  }, [user, institutionId]);

  const canDeleteUsers = useMemo(() => {
    const perms = user?.permissions || {};
    if (perms.canDeleteUsers) return true;
    if (perms.canDeleteOwnInstitutionUsers && institutionId && String(user?.institutionId || user?.institution || '') === institutionId) return true;
    return false;
  }, [user, institutionId]);

  useEffect(() => {
    if (!institutionId) return;
    (async () => {
      setLoadingCount(true);
      setCountError(null);
      try {
        const res = await getRequests.getInstitutionMessageCount(institutionId);
        const count = res?.data?.data?.count ?? 0;
        setMessageCount(count);
      } catch (err) {
        setCountError(err?.response?.data?.message || err.message);
      } finally {
        setLoadingCount(false);
      }
    })();
  }, [institutionId]);

  const fetchUsers = async () => {
    if (!institutionId) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await getRequests.getUsers({ institution: institutionId, limit: 100 });
      setUsers(res?.data?.data || []);
    } catch (err) {
      setUsersError(err?.response?.data?.message || err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!institutionId) return;
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const res = await getRequests.getEmployeesByInstitution(institutionId);
      setEmployees(res?.data?.data || []);
    } catch (err) {
      setEmployeesError(err?.response?.data?.message || err.message);
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const onUserEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser?._id) return;
    setUserEditStatus('Yüklənir...');
    try {
      const payload = { name: editingUser.name, email: editingUser.email, institutionId };
      if (editingUser.password && editingUser.password.length >= 6) {
        payload.password = editingUser.password;
      }
      await postRequests.updateUser(editingUser._id, payload);
      setUserEditStatus('Uğurla yeniləndi');
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setUserEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!id) return;
    if (!confirm('İstifadəçini silmək istədiyinizə əminsiniz?')) return;
    setUserActionStatus('Silinir...');
    try {
      await postRequests.deleteUser(id);
      setUserActionStatus('Uğurla silindi');
      await fetchUsers();
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setUserActionStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const onEmployeeEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee?._id) return;
    setEmployeeEditStatus('Yüklənir...');
    try {
      const payload = {
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        email: editingEmployee.email,
        phone: editingEmployee.phone,
        position: editingEmployee.position,
        institution: institutionId
      };
      payload.timsUsername = editingEmployee.timsUsername;
      await postRequests.updateEmployee(editingEmployee._id, payload);
      setEmployeeEditStatus('Uğurla yeniləndi');
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setEmployeeEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!id) return;
    if (!confirm('İşçini silmək istədiyinizə əminsiniz?')) return;
    setEmployeeActionStatus('Silinir...');
    try {
      await postRequests.deleteEmployee(id);
      setEmployeeActionStatus('Uğurla silindi');
      await fetchEmployees();
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setEmployeeActionStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleSendDirectMessage = async (employeeId) => {
    const content = sanitizePlain(directMessageText[employeeId] || '');
    if (!content) {
      setDirectMessageStatus((prev) => ({ ...prev, [employeeId]: 'Zəhmət olmasa məzmununu daxil edin' }));
      return;
    }
    try {
      setDirectMessageStatus((prev) => ({ ...prev, [employeeId]: 'Göndərilir...' }));
      await postRequests.sendDirectMessage({ employeeId, content });
      setDirectMessageStatus((prev) => ({ ...prev, [employeeId]: 'Göndərildi' }));
      try { window.__showToast && window.__showToast({ type: 'success', title: 'Uğurlu', message: 'Birbaşa mesaj göndərildi' }); } catch (_) {}
      await fetchEmployeeHistory(employeeId);
      setDirectMessageText((prev) => ({ ...prev, [employeeId]: '' }));
      const ref = editorRefs.current[employeeId];
      if (ref) ref.textContent = '';
    } catch (err) {
      setDirectMessageStatus((prev) => ({ ...prev, [employeeId]: `Xəta: ${err?.response?.data?.message || err.message}` }));
    }
  };

  const onInstitutionEditSubmit = async (e) => {
    e.preventDefault();
    setInstEditStatus('Yüklənir...');
    try {
      const payload = {
        longName: instEdit.longName,
        shortName: instEdit.shortName,
        type: instEdit.type,
        messageLimit: Number(instEdit.messageLimit) || 0,
        responsiblePerson: instEdit.responsiblePerson || null,
        isActive: Boolean(instEdit.isActive)
      };
      await postRequests.updateInstitution(institutionId, payload);
      setInstEditStatus('Uğurla yeniləndi');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setInstEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteInstitution = async () => {
    if (!institutionId) return;
    if (!confirm('Qurumu silmək istədiyinizə əminsiniz?')) return;
    setInstEditStatus('Silinir...');
    try {
      await postRequests.deleteInstitution(institutionId);
      setInstEditStatus('Uğurla silindi');
      if (typeof onUpdated === 'function') onUpdated();
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      setInstEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg w-[60vw] p-0 ring-1 ring-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Qurum detalları</h2>
              <p className="text-sm text-gray-600">İstifadəçilər və işçilər üzrə idarəetmə</p>
            </div>
            <Button variant="ghost" onClick={onClose}>Bağla</Button>
          </div>
          <form onSubmit={onInstitutionEditSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Qısa ad</label>
              <Input value={instEdit.shortName} onChange={(e) => setInstEdit((p) => ({ ...p, shortName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Uzun ad</label>
              <Input value={instEdit.longName} onChange={(e) => setInstEdit((p) => ({ ...p, longName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Növ</label>
              <select className="w-full border rounded-md h-9 px-2 text-sm" value={instEdit.type} onChange={(e) => setInstEdit((p) => ({ ...p, type: e.target.value }))}>
                {['dövlət','özəl','beynəlxalq','qeyri-hökumət','təhsil','səhiyyə','maliyyə','digər'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mesaj limiti</label>
              <Input type="number" min={0} value={instEdit.messageLimit} onChange={(e) => setInstEdit((p) => ({ ...p, messageLimit: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Məsul şəxs (istifadəçi)</label>
              <select className="w-full border rounded-md h-9 px-2 text-sm" value={instEdit.responsiblePerson || ''} onChange={(e) => setInstEdit((p) => ({ ...p, responsiblePerson: e.target.value }))}>
                <option value="">—</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="isActive" type="checkbox" checked={Boolean(instEdit.isActive)} onChange={(e) => setInstEdit((p) => ({ ...p, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="text-xs text-gray-600">Aktiv</label>
            </div>
            <div className="sm:col-span-3 flex items-center justify-end gap-2">
              <Button type="button" variant="destructive" onClick={handleDeleteInstitution}>Qurumu sil</Button>
              <Button type="submit">Yadda saxla</Button>
            </div>
            {instEditStatus && <p className={`sm:col-span-3 text-xs ${instEditStatus.startsWith('Xəta') ? 'text-red-600' : instEditStatus.includes('Silinir') ? 'text-gray-600' : 'text-green-600'}`}>{instEditStatus}</p>}
            <div className="sm:col-span-3">
              <p className="text-xs text-gray-500">Mesaj sayısı</p>
              <p className="text-sm text-gray-900">
                {loadingCount ? 'Yüklənir...' : (countError ? <span className="text-red-600">{countError}</span> : (messageCount ?? 0))}
              </p>
            </div>
          </form>
        </div>
        <div className="px-6 py-4">
          <div className="mb-3 flex items-center space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded-md border ${activeTab === 'users' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('users')}
            >İstifadəçilər</button>
            <button
              className={`px-3 py-1 text-sm rounded-md border ${activeTab === 'employees' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('employees')}
            >İşçilər</button>
          </div>
        </div>
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {activeTab === 'users' ? (
            <div>
              {usersLoading ? (
                <p className="text-sm text-gray-500">Yüklənir...</p>
              ) : usersError ? (
                <p className="text-sm text-red-600">{usersError}</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-600">İstifadəçi tapılmadı</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">E‑poçt</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{u.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{u.email}</td>
                        <td className="px-4 py-2 text-right flex items-center justify-end gap-2">
                          {canEditUsers && (
                            <Button size="sm" variant="outline" onClick={() => setEditingUser({ ...u })}>Redaktə et</Button>
                          )}
                          {canDeleteUsers && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u._id)}>Sil</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {editingUser && (
                <form onSubmit={onUserEditSubmit} className="mt-4 p-4 border rounded-md">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">İstifadəçini redaktə et</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ad</label>
                      <Input value={editingUser.name || ''} onChange={(e) => setEditingUser((prev) => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">E‑poçt</label>
                      <Input value={editingUser.email || ''} onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Şifrə (ən azı 6 simvol)</label>
                      <Input type="password" value={editingUser.password || ''} onChange={(e) => setEditingUser((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={() => setEditingUser(null)}>İmtina</Button>
                    <Button type="submit">Yadda saxla</Button>
                  </div>
                  {userEditStatus && <p className="mt-2 text-xs text-gray-600">{userEditStatus}</p>}
                  {userActionStatus && <p className="mt-1 text-xs text-gray-600">{userActionStatus}</p>}
                </form>
              )}
            </div>
          ) : (
            <div>
              {employeesLoading ? (
                <p className="text-sm text-gray-500">Yüklənir...</p>
              ) : employeesError ? (
                <p className="text-sm text-red-600">{employeesError}</p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-gray-600">İşçi tapılmadı</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Soyad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">E‑poçt</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Telefon</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vəzifə</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((e) => (
                      <Fragment key={e._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{e.firstName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{e.lastName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{e.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{e.phone}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{e.position}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingEmployee({ ...e })}>Redaktə et</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(e._id)}>Sil</Button>
                            <Button size="sm" onClick={() => {
                              setDirectMessageOpen((p) => ({ ...p, [e._id]: !p[e._id] }));
                              if (!directMessageOpen[e._id]) fetchEmployeeHistory(e._id);
                            }}>Mesaj göndər</Button>
                          </div>
                        </td>
                       </tr>
                      {directMessageOpen[e._id] && (
                      <tr>
                        <td className="px-4 pb-4" colSpan={6}>
                          <div className="border rounded-md p-3 bg-white">
                            <div
                              ref={(el) => { if (el) editorRefs.current[e._id] = el; else delete editorRefs.current[e._id]; }}
                              className="min-h-[140px] border rounded-md p-3 text-sm focus:outline-none"
                              contentEditable
                              onInput={(ev) => handleEditorInput(e._id, ev)}
                              onPaste={handlePastePlain}
                              onBeforeInput={handleBeforeInput}
                              placeholder="Mesaj yazın"
                              suppressContentEditableWarning
                              style={{ width: '100%' }}
                            />
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <Button size="sm" onClick={() => handleSendDirectMessage(e._id)}>Göndər</Button>
                            </div>
                            {directMessageStatus[e._id] && (
                              <p className={`mt-1 text-xs ${String(directMessageStatus[e._id]).startsWith('Xəta') ? 'text-red-600' : directMessageStatus[e._id] === 'Göndərilir...' ? 'text-gray-600' : 'text-green-600'}`}>{directMessageStatus[e._id]}</p>
                            )}
                            <div className="mt-3">
                              <p className="text-xs text-gray-600">Birbaşa mesaj tarixi (son 20):</p>
                              {directMessageHistoryStatus[e._id] && (
                                <p className={`text-xs ${String(directMessageHistoryStatus[e._id]).startsWith('Xəta') ? 'text-red-600' : 'text-gray-600'}`}>{directMessageHistoryStatus[e._id]}</p>
                              )}
                              <ul className="mt-1 space-y-1 max-h-40 overflow-auto">
                                {(directMessageHistory[e._id] || []).map((m) => (
                                  <li key={m._id} className="text-xs text-gray-800">
                                    <span className="text-gray-500">{new Date(m.createdAt).toLocaleString()}:</span> {m.decryptedContent || ''}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-1 text-[10px] text-gray-400">Qeyd: Tarix yalnız bu sistem vasitəsilə göndərilən birbaşa mesajları əhatə edir.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}

              {editingEmployee && (
                <form onSubmit={onEmployeeEditSubmit} className="mt-4 p-4 border rounded-md">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">İşçini redaktə et</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ad</label>
                      <Input value={editingEmployee.firstName || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Soyad</label>
                      <Input value={editingEmployee.lastName || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, lastName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">TİMS istifadəçi adı</label>
                      <Input value={editingEmployee.timsUsername || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, timsUsername: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">E‑poçt</label>
                      <Input value={editingEmployee.email || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Telefon</label>
                      <Input value={editingEmployee.phone || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Vəzifə</label>
                      <Input value={editingEmployee.position || ''} onChange={(e) => setEditingEmployee((prev) => ({ ...prev, position: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={() => setEditingEmployee(null)}>İmtina</Button>
                    <Button type="submit">Yadda saxla</Button>
                  </div>
                  {employeeEditStatus && <p className="mt-2 text-xs text-gray-600">{employeeEditStatus}</p>}
                  {employeeActionStatus && <p className="mt-1 text-xs text-gray-600">{employeeActionStatus}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionDetailModal;