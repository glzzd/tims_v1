import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postRequests } from '@/apiRequests/postRequests';
import { getRequests } from '@/apiRequests/getRequests';
import { useAuth } from '@/context/AuthContext';

const EmployeesPage = () => {
  const { user } = useAuth();
  const perms = user?.permissions || {};
  const canManage = perms?.isSuperAdmin === true || perms?.canAddEmployee === true;

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    timsUsername: '',
    email: '',
    phone: '',
    institution: '',
    position: ''
  });
  const [institutionsOptions, setInstitutionsOptions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [status, setStatus] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  const fetchEmployees = async (toPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: toPage, limit };
      if (search) params.search = search;
      if (selectedInstitution) params.institution = selectedInstitution;
      // Use general list endpoint to include both active and inactive employees
      const res = await getRequests.getEmployees(params);
      const list = res?.data?.data || [];
      setEmployees(list);
      const pagination = res?.data?.pagination || {};
      setTotal(pagination.totalItems ?? pagination.total ?? list.length ?? 0);
      setPage(pagination.currentPage ?? pagination.page ?? toPage);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
    (async () => {
      try {
        const res = await getRequests.getInstitutions();
        const opts = res?.data?.data || [];
        setInstitutionsOptions(opts);
        // If user has a specific institution, default to it
        const myInst = user?.institution;
        if (myInst) {
          const myId = typeof myInst === 'object' ? (myInst._id || myInst.id) : String(myInst);
          setSelectedInstitution(String(myId || ''));
        }
      } catch (err) {
        // qurum seçenekleri yüklenemezse form yine manual girdi yerine boş dropdown gösterir
        setInstitutionsOptions([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        timsUsername: form.timsUsername,
        email: form.email,
        institution: form.institution || selectedInstitution || undefined,
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.position ? { position: form.position } : {})
      };
      await postRequests.createEmployee(payload);
      setStatus('Uğurlu');
      setForm({ firstName: '', lastName: '', timsUsername: '', email: '', phone: '', institution: '', position: '' });
      setIsCreateOpen(false);
      fetchEmployees(1);
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const formatInstitution = (inst) => {
    if (!inst) return '-';
    if (typeof inst === 'object') return inst.shortName || inst.displayName || inst.longName || inst._id || '-';
    return String(inst);
  };

  const toggleActive = async (emp) => {
    // Optimistik UI: dərhal statusu dəyiş
    const id = emp._id || emp.id;
    setEmployees((prev) => prev.map((e) => (String(e._id || e.id) === String(id) ? { ...e, isActive: !e.isActive } : e)));
    try {
      setStatus('Yüklənir...');
      let res;
      if (emp?.isActive === false) {
        res = await postRequests.activateEmployee(id);
      } else {
        res = await postRequests.deactivateEmployee(id);
      }
      const updated = res?.data?.data;
      if (updated && typeof updated.isActive === 'boolean') {
        // Yalnız isActive alanını güncelle, digər sahələri (institution vs.) qoruyaraq
        setEmployees((prev) => prev.map((e) => (
          String(e._id || e.id) === String(id) ? { ...e, isActive: updated.isActive } : e
        )));
      }
      setStatus(null);
    } catch (err) {
      // Geri al və yenidən yüklə
      fetchEmployees(page);
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const deleteEmployee = async (emp) => {
    const ok = window.confirm('Bu işçini silmək istədiyinizə əminsiniz?');
    if (!ok) return;
    try {
      await postRequests.deleteEmployee(emp._id || emp.id);
      fetchEmployees(page);
    } catch (err) {
      setStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  const openEdit = (emp) => {
    setEditing({
      _id: emp._id || emp.id,
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      timsUsername: emp.timsUsername || '',
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position || '',
      institution: typeof emp.institution === 'object' ? (emp.institution._id || emp.institution.id || '') : (emp.institution || '')
    });
    setEditStatus(null);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    setEditStatus('Yüklənir...');
    try {
      const payload = {
        firstName: editing.firstName,
        lastName: editing.lastName,
        timsUsername: editing.timsUsername,
        email: editing.email,
        phone: editing.phone,
        position: editing.position,
        institution: editing.institution || selectedInstitution || undefined
      };
      await postRequests.updateEmployee(editing._id, payload);
      setEditStatus('Uğurla yeniləndi');
      setEditing(null);
      fetchEmployees(page);
    } catch (err) {
      setEditStatus(`Xəta: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İşçilər</h1>
          <p className="text-gray-600">İşçi siyahısını görüntüləyin, axtarın və idarə edin.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>Yeni İşçi</Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar (ad, e‑poçt, TIMS)" />
        <select
          className="h-9 border rounded-md px-3 text-sm"
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          <option value="">Bütün qurumlar</option>
          {institutionsOptions.map((inst) => (
            <option key={inst.id || inst._id} value={String(inst.id || inst._id)}>
              {inst.shortName || inst.displayName || inst.longName}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => fetchEmployees(1)}>Axtar</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E‑poçt</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIMS istifadəçi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qurum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vəzifə</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {canManage && (<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyatlar</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan={canManage ? 7 : 6}>Yüklənir...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-4 text-red-600" colSpan={canManage ? 7 : 6}>{error}</td></tr>
            ) : employees.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={canManage ? 7 : 6}>Qeyd tapılmadı</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id || emp._id}>
                  <td className="px-4 py-3 text-gray-900">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3">{emp.email}</td>
                  <td className="px-4 py-3">{emp.timsUsername}</td>
                  <td className="px-4 py-3">{formatInstitution(emp.institution)}</td>
                  <td className="px-4 py-3">{emp.position || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${emp.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {emp.isActive ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>Redaktə et</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(emp)}>
                          {emp?.isActive === false ? 'Aktiv et' : 'Deaktiv et'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteEmployee(emp)}>Sil</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchEmployees(p); }} disabled={page === 1}>Əvvəlki</Button>
        <p className="text-sm text-gray-600">Səhifə {page} / {Math.max(1, Math.ceil(total / limit))}</p>
        <Button variant="outline" onClick={() => { const p = page + 1; const max = Math.ceil(total / limit); if (p <= max) { setPage(p); fetchEmployees(p); } }} disabled={(page * limit) >= total}>Sonrakı</Button>
      </div>

      {isCreateOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İşçi yarat</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Ad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Soyad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIMS istifadəçi adı</label>
                <Input value={form.timsUsername} onChange={(e) => setForm({ ...form, timsUsername: e.target.value })} placeholder="tims_username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E‑poçt</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ornek.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (opsional)</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+994..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
                <select
                  className="w-full border rounded-md h-10 px-3"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                >
                  <option value="">Qurum seçin</option>
                  {institutionsOptions.map((inst) => (
                    <option key={inst.id || inst._id} value={inst.id || inst._id}>
                      {inst.shortName || inst.displayName || inst.longName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vəzifə (opsional)</label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Mütəxəssis, Müdir..." />
              </div>
              <div className="md:col-span-2 flex items-center justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>İmtina</Button>
                <Button type="submit">Yarat</Button>
              </div>
              {status && (
                <p className={`md:col-span-2 text-sm ${status.startsWith('Xəta') ? 'text-red-600' : status === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{status}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {editing && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İşçini düzənlə</h2>
            <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <Input value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                <Input value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIMS istifadəçi adı</label>
                <Input value={editing.timsUsername} onChange={(e) => setEditing({ ...editing, timsUsername: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E‑poçt</label>
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vəzifə</label>
                <Input value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
                <select className="w-full border rounded-md h-10 px-3" value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })}>
                  <option value="">—</option>
                  {institutionsOptions.map((inst) => (
                    <option key={inst.id || inst._id} value={inst.id || inst._id}>
                      {inst.shortName || inst.displayName || inst.longName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>İmtina</Button>
                <Button type="submit">Yadda saxla</Button>
              </div>
              {editStatus && <p className="md:col-span-2 text-sm text-gray-600">{editStatus}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;