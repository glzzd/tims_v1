import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postRequests } from '@/apiRequests/postRequests';
import { getRequests } from '@/apiRequests/getRequests';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  const [status, setStatus] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequests.getEmployees(search ? { search } : undefined);
      setEmployees(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    (async () => {
      try {
        const res = await getRequests.getInstitutions();
        setInstitutionsOptions(res?.data?.data || []);
      } catch (err) {
        // qurum seçenekleri yüklenemezse form yine manual girdi yerine boş dropdown gösterir
        setInstitutionsOptions([]);
      }
    })();
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
        institution: form.institution,
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.position ? { position: form.position } : {})
      };
      await postRequests.createEmployee(payload);
      setStatus('Başarılı');
      setForm({ firstName: '', lastName: '', timsUsername: '', email: '', phone: '', institution: '', position: '' });
      setIsCreateOpen(false);
      fetchEmployees();
    } catch (err) {
      setStatus(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="text-gray-600">Tüm çalışanları görüntüleyin ve yeni çalışan ekleyin.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Yeni Çalışan</Button>
      </div>

      <div className="flex items-center space-x-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara (ad, e-posta veya TIMS)" />
        <Button variant="outline" onClick={fetchEmployees}>Ara</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-posta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIMS İstifadəçi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qurum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pozisyon</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan={5}>Yükleniyor...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-4 text-red-600" colSpan={5}>{error}</td></tr>
            ) : employees.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={5}>Kayıt bulunamadı</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id || emp._id}>
                  <td className="px-4 py-3 text-gray-900">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3">{emp.email}</td>
                  <td className="px-4 py-3">{emp.timsUsername}</td>
                  <td className="px-4 py-3">{
                    typeof emp.institution === 'object'
                      ? (emp.institution.displayName || emp.institution.shortName || emp.institution.id || emp.institution._id || '-')
                      : (emp.institution || '-')
                  }</td>
                  <td className="px-4 py-3">{emp.position || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Çalışan Oluştur</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">TIMS İstifadəçi Adı</label>
                <Input value={form.timsUsername} onChange={(e) => setForm({ ...form, timsUsername: e.target.value })} placeholder="tims_username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ornek.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (opsiyonel)</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90..." />
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
                      {inst.displayName || `${inst.shortName} - ${inst.longName}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon (opsiyonel)</label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Uzman, Müdür..." />
              </div>
              <div className="md:col-span-2 flex items-center justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>İptal</Button>
                <Button type="submit">Oluştur</Button>
              </div>
              {status && (
                <p className={`md:col-span-2 text-sm ${status.startsWith('Hata') ? 'text-red-600' : status === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{status}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;