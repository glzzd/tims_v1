import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRequests } from '@/apiRequests/getRequests';
import InstitutionDetailModal from '@/components/InstitutionDetailModal';
import { postRequests } from '@/apiRequests/postRequests';

const InstitutionsPage = () => {
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ longName: '', shortName: '', type: 'dövlət', messageLimit: 10 });
  const [createStatus, setCreateStatus] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [groupsModalInstitution, setGroupsModalInstitution] = useState(null);
  const [groupsForInstitution, setGroupsForInstitution] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [rowActionStatus, setRowActionStatus] = useState(null);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeResults, setEmployeeResults] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);
  const [expandedMembers, setExpandedMembers] = useState({});
  const [groupMessageInputs, setGroupMessageInputs] = useState({});
  const [groupMessageStatus, setGroupMessageStatus] = useState({});

  const displayGroups = useMemo(() => {
    if (!groupsSearch) return groupsForInstitution;
    const term = groupsSearch.trim().toLowerCase();
    return groupsForInstitution.filter((g) => {
      const nameMatch = (g.name || '').toLowerCase().includes(term);
      const membersText = Array.isArray(g.members) ? g.members.map(m => `${m.firstName || ''} ${m.lastName || ''} ${m.email || ''}`.toLowerCase()).join(' ') : '';
      return nameMatch || membersText.includes(term);
    });
  }, [groupsForInstitution, groupsSearch]);

  // Çalışan araması (qurum bazlı), düzenleme modu aktifken ve arama terimi değiştiğinde tetiklenir
  useEffect(() => {
    const run = async () => {
      if (!editingGroupId) return;
      const term = employeeSearch.trim();
      if (!term) { setEmployeeResults([]); setEmployeeError(null); return; }
      try {
        setEmployeeLoading(true);
        setEmployeeError(null);
        const instId = groupsModalInstitution?.id || groupsModalInstitution?._id || undefined;
        const res = await getRequests.searchEmployees({ search: term, institution: instId, limit: 20 });
        setEmployeeResults(res?.data?.data || []);
      } catch (err) {
        setEmployeeError(err?.response?.data?.message || err.message);
        setEmployeeResults([]);
      } finally {
        setEmployeeLoading(false);
      }
    };
    const t = setTimeout(run, 300); // debounce
    return () => clearTimeout(t);
  }, [employeeSearch, editingGroupId, groupsModalInstitution]);

  const toggleEditGroup = (e, groupId) => {
    e.stopPropagation();
    setEditingGroupId(prev => prev === groupId ? null : groupId);
    setEmployeeSearch('');
    setEmployeeResults([]);
    setEmployeeError(null);
  };

  const handleAddMember = async (groupId, employeeId) => {
    try {
      await postRequests.addGroupMember(groupId, { employeeId });
      // Lokal state'i güncelle
      setGroupsForInstitution(prev => prev.map(g => {
        if ((g.id || g._id) === groupId) {
          const exists = Array.isArray(g.members) && g.members.some(m => (m._id || m.id) === employeeId);
          if (!exists) {
            const found = employeeResults.find(e => (e._id || e.id) === employeeId) || { _id: employeeId };
            return { ...g, members: [...(g.members || []), found] };
          }
        }
        return g;
      }));
      setRowActionStatus('Katılımcı eklendi');
    } catch (err) {
      setRowActionStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleRemoveMember = async (groupId, employeeId) => {
    try {
      await postRequests.removeGroupMember(groupId, { employeeId });
      setGroupsForInstitution(prev => prev.map(g => {
        if ((g.id || g._id) === groupId) {
          return { ...g, members: (g.members || []).filter(m => (m._id || m.id) !== employeeId) };
        }
        return g;
      }));
      setRowActionStatus('Katılımcı çıkarıldı');
    } catch (err) {
      setRowActionStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  const toggleExpandMembers = (groupId) => {
    setExpandedMembers(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSendGroupMessage = async (groupId) => {
    const content = (groupMessageInputs[groupId] || '').trim();
    if (!content) {
      setGroupMessageStatus(prev => ({ ...prev, [groupId]: 'Lütfen mesaj məzmunu girin' }));
      return;
    }
    try {
      setGroupMessageStatus(prev => ({ ...prev, [groupId]: 'gönderiliyor' }));
      await postRequests.sendGroupMessage(groupId, { content });
      setGroupMessageStatus(prev => ({ ...prev, [groupId]: 'Gönderildi' }));
      setGroupMessageInputs(prev => ({ ...prev, [groupId]: '' }));
    } catch (err) {
      setGroupMessageStatus(prev => ({ ...prev, [groupId]: `Hata: ${err?.response?.data?.message || err.message}` }));
    }
  };

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequests.getInstitutions(search ? { search } : undefined);
      setInstitutions(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const handleDeleteInstitutionInline = async (e, id) => {
    e.stopPropagation();
    if (!id) return;
    if (!confirm('Qurumu silmək istədiyinizə əminsiniz?')) return;
    setRowActionStatus('Silinir...');
    try {
      await postRequests.deleteInstitution(id);
      setRowActionStatus('Uğurla silindi');
      await fetchInstitutions();
    } catch (err) {
      setRowActionStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleEditInstitutionInline = (e, inst) => {
    e.stopPropagation();
    setSelectedInstitution(inst);
  };

  const handleViewGroupsInline = async (e, inst) => {
    e.stopPropagation();
    const id = inst.id || inst._id;
    if (!id) return;
    setGroupsModalInstitution(inst);
    setGroupsLoading(true);
    setGroupsError(null);
    setGroupsForInstitution([]);
    try {
      const res = await getRequests.getGroupsByInstitution(id);
      setGroupsForInstitution(res?.data?.data || []);
    } catch (err) {
      setGroupsError(err?.response?.data?.message || err.message);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateStatus('loading');
    try {
      const payload = {
        longName: createForm.longName,
        shortName: createForm.shortName,
        type: createForm.type,
        messageLimit: createForm.messageLimit
      };
      await postRequests.createInstitution(payload);
      setCreateStatus('Uğurlu');
      setCreateForm({ longName: '', shortName: '', type: 'dövlət', messageLimit: 10 });
      setIsCreateOpen(false);
      fetchInstitutions();
    } catch (err) {
      setCreateStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qurumlar</h1>
          <p className="text-gray-600">Bütün qurumları görüntüləyin və yeni qurum əlavə edin.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Yeni Qurum</Button>
      </div>

      <div className="flex items-center space-x-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar (qurum adı)" />
        <Button variant="outline" onClick={fetchInstitutions}>Axtar</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Növ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesaj limiti</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan={5}>Yüklənir...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-4 text-red-600" colSpan={5}>{error}</td></tr>
            ) : institutions.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={5}>Qeyd tapılmadı</td></tr>
            ) : (
              institutions.map((i) => (
                <tr key={i.id || i._id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedInstitution(i)}>
                  <td className="px-4 py-3 text-gray-900">{i.displayName || `${i.shortName} - ${i.longName}`}</td>
                  <td className="px-4 py-3">{i.type || '-'}</td>
                  <td className="px-4 py-3">{typeof i.messageLimit === 'number' ? i.messageLimit : '-'}</td>
                  <td className="px-4 py-3">{i.id || i._id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => handleEditInstitutionInline(e, i)}>Redaktə et</Button>
                      <Button size="sm" variant="secondary" onClick={(e) => handleViewGroupsInline(e, i)}>Qrupları gör</Button>
                      <Button size="sm" variant="destructive" onClick={(e) => handleDeleteInstitutionInline(e, i.id || i._id)}>Sil</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rowActionStatus && (
        <p className="text-xs text-gray-600">{rowActionStatus}</p>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[50vw] p-0 ring-1 ring-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Qurum yarad</h2>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uzun ad</label>
                <Input value={createForm.longName} onChange={(e) => setCreateForm({ ...createForm, longName: e.target.value })} placeholder="Qurumun uzun adı" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qısa ad</label>
                <Input value={createForm.shortName} onChange={(e) => setCreateForm({ ...createForm, shortName: e.target.value })} placeholder="Qurumun qısa adı" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Növ</label>
                <select className="w-full border rounded-md h-10 px-3" value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}>
                  {['dövlət','özəl','beynəlxalq','qeyri-hökumət','təhsil','səhiyyə','maliyyə','digər'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj limiti</label>
                <Input type="number" min={0} value={createForm.messageLimit} onChange={(e) => setCreateForm({ ...createForm, messageLimit: Number(e.target.value) })} placeholder="10" />
              </div>
              <div className="md:col-span-2 flex items-center justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Ləğv et</Button>
                <Button type="submit">Yarat</Button>
              </div>
              {createStatus && (
                <p className={`md:col-span-2 text-sm ${createStatus.startsWith('Xəta') ? 'text-red-600' : createStatus === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{createStatus}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {selectedInstitution && (
        <InstitutionDetailModal
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onUpdated={fetchInstitutions}
        />
      )}

      {groupsModalInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setGroupsModalInstitution(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[50vw] p-0 ring-1 ring-gray-200 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Qurum qrupları</h2>
              <Button variant="ghost" onClick={() => setGroupsModalInstitution(null)}>Bağla</Button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-700 mb-2">{groupsModalInstitution.displayName || `${groupsModalInstitution.shortName} - ${groupsModalInstitution.longName}`}</p>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Qruplarda axtar</label>
                  <Input value={groupsSearch} onChange={(e) => setGroupsSearch(e.target.value)} placeholder="Ad, üzv və ya admin" />
                </div>
                <div className="md:col-span-1">
                  <p className="text-xs text-gray-600">Ümumi qrup</p>
                  <p className="text-sm text-gray-900">{groupsForInstitution.length}</p>
                </div>
              </div>
              {groupsLoading ? (
                <p className="text-sm text-gray-500">Yüklənir...</p>
              ) : groupsError ? (
                <p className="text-sm text-red-600">{groupsError}</p>
              ) : displayGroups.length === 0 ? (
                <p className="text-sm text-gray-600">Qrup tapılmadı</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Katılımcılar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayGroups.map((g) => (
                      <tr key={g.id || g._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{g.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">Ümumi: {Array.isArray(g.members) ? g.members.length : 0}</div>
                            <Button size="sm" variant="outline" onClick={(e) => toggleEditGroup(e, g.id || g._id)}>
                              {editingGroupId === (g.id || g._id) ? 'Düzenlemeyi kapat' : 'Katılımcıları düzenle'}
                            </Button>
                          </div>
                          {Array.isArray(g.members) && g.members.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(expandedMembers[g.id || g._id] ? g.members : g.members.slice(0, 30)).map((m) => (
                                <span key={m._id || `${m.email}-${m.firstName}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                  <span>{(m.firstName || '').trim()} {(m.lastName || '').trim()}</span>
                                  {editingGroupId === (g.id || g._id) && (
                                    <button className="ml-1 text-red-600" onClick={() => handleRemoveMember(g.id || g._id, m._id || m.id)}>×</button>
                                  )}
                                </span>
                              ))}
                              {g.members.length > 30 && (
                                <button className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700" onClick={() => toggleExpandMembers(g.id || g._id)}>
                                  {expandedMembers[g.id || g._id] ? 'Daha az göster' : `Tümünü göster (+${g.members.length - 30})`}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}

                          {editingGroupId === (g.id || g._id) && (
                            <div className="mt-3 space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Çalışan arayın ve ekleyin</label>
                                <Input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="Ad, e-posta veya TIMS" />
                              </div>
                              {employeeLoading ? (
                                <p className="text-xs text-gray-500">Aranıyor...</p>
                              ) : employeeError ? (
                                <p className="text-xs text-red-600">{employeeError}</p>
                              ) : employeeResults.length > 0 ? (
                                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                                  {employeeResults.map((emp) => (
                                    <div key={emp._id || emp.id} className="flex items-center justify-between py-1">
                                      <div className="text-xs text-gray-800">{emp.firstName} {emp.lastName} <span className="text-gray-500">({emp.email})</span></div>
                                      <Button size="sm" variant="secondary" onClick={() => handleAddMember(g.id || g._id, emp._id || emp.id)}>Ekle</Button>
                                    </div>
                                  ))}
                                </div>
                              ) : employeeSearch.trim() ? (
                                <p className="text-xs text-gray-500">Sonuç yok</p>
                              ) : null}
                            </div>
                          )}

                          {/* Grup mesajı gönderme alanı */}
                          <div className="mt-4 space-y-2">
                            <label className="block text-xs text-gray-600 mb-1">Grup mesajı gönder</label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={groupMessageInputs[g.id || g._id] || ''}
                                onChange={(e) => setGroupMessageInputs(prev => ({ ...prev, [g.id || g._id]: e.target.value }))}
                                placeholder="Mesaj məzmunu"
                              />
                              <Button size="sm" onClick={() => handleSendGroupMessage(g.id || g._id)}>Gönder</Button>
                            </div>
                            {groupMessageStatus[g.id || g._id] && (
                              <p className={`text-xs ${String(groupMessageStatus[g.id || g._id]).startsWith('Hata') ? 'text-red-600' : groupMessageStatus[g.id || g._id] === 'gönderiliyor' ? 'text-gray-500' : 'text-green-600'}`}>{groupMessageStatus[g.id || g._id]}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;