import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { postRequests } from '@/apiRequests/postRequests';
import { getRequests } from '@/apiRequests/getRequests';
import { useAuth } from '@/context/AuthContext';

const MessagingPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('institution'); // 'institution' | 'direct' | 'group'
  const [content, setContent] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        if (user?.permissions?.isSuperAdmin === true) {
          const [instRes, grpRes] = await Promise.all([
            getRequests.getInstitutions(),
            getRequests.getGroups(),
          ]);
          const insts = instRes?.data?.data || [];
          setInstitutions(insts);
          setGroups(grpRes?.data?.data || []);
          const firstInstId = insts[0]?.id || insts[0]?._id || '';
          setSelectedInstitutionId(firstInstId || '');
          if (firstInstId) {
            const empRes = await getRequests.getEmployeesByInstitution(firstInstId);
            setEmployees(empRes?.data?.data || []);
          }
        } else if (user?.permissions?.canMessageInstitutionGroups === true) {
          const myInstRes = await getRequests.getMyInstitutions();
          const myInstitutions = myInstRes?.data?.data || [];
          setInstitutions(myInstitutions);
          const firstInstId = myInstitutions[0]?.id || myInstitutions[0]?._id || '';
          setSelectedInstitutionId(firstInstId || '');
          if (firstInstId) {
            try {
              const [empRes, grpRes] = await Promise.all([
                getRequests.getEmployeesByInstitution(firstInstId),
                getRequests.getGroupsByInstitution(firstInstId)
              ]);
              setEmployees(empRes?.data?.data || []);
              setGroups(grpRes?.data?.data || []);
            } catch {
              setEmployees([]);
              setGroups([]);
            }
          } else {
            setEmployees([]);
            setGroups([]);
          }
        } else {
          const myGrpRes = await getRequests.getMyGroups();
          setGroups(myGrpRes?.data?.data || []);
          setInstitutions([]);
          setEmployees([]);
          setSelectedInstitutionId('');
        }
        // Load initial logs
        await fetchLogs(1);
      } catch {
        // no-op
      }
    })();
  }, [user]);

  const onInstitutionChange = async (id) => {
    setSelectedInstitutionId(id);
    setSelectedEmployeeId('');
    setSelectedGroupId('');
    if (!id) {
      setEmployees([]);
      setGroups([]);
      return;
    }
    try {
      const [empRes, grpRes] = await Promise.all([
        getRequests.getEmployeesByInstitution(id),
        getRequests.getGroupsByInstitution(id)
      ]);
      setEmployees(empRes?.data?.data || []);
      setGroups(grpRes?.data?.data || []);
    } catch {
      setEmployees([]);
      setGroups([]);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const res = await getRequests.getMessageLogs({ page, limit: 10, action: 'send' });
      const items = res?.data?.data || [];
      setLogs(items);
      setLogsTotal(res?.data?.pagination?.total || items.length);
      setLogsPage(page);
    } catch {
      // ignore
    }
  };

  const actorLabel = (log) => {
    const a = log?.actorUserId;
    if (!a) return '';
    if (typeof a === 'string') return a;
    return a.email || a.name || a._id || '';
  };

  const detailsText = (log) => {
    const parts = [];
    const instLabel = (inst) => {
      if (!inst) return '';
      if (typeof inst === 'string') return inst;
      return inst.shortName || inst.longName || inst._id || '';
    };
    if (log?.type === 'direct') {
      const r = log?.receiver;
      let rName = '';
      if (typeof r === 'string') rName = r;
      else rName = [r?.firstName, r?.lastName].filter(Boolean).join(' ') || r?.email || r?._id || '';
      if (rName) parts.push(`Alıcı: ${rName}`);
      const rInst = typeof r === 'object' ? r?.institution : null;
      const rInstName = instLabel(rInst);
      if (rInstName) parts.push(`Qurum: ${rInstName}`);
    }
    if (log?.type === 'group') {
      const g = log?.group;
      const gName = typeof g === 'string' ? g : (g?.name || g?._id || '');
      if (gName) parts.push(`Qrup: ${gName}`);
      const gInst = typeof g === 'object' ? g?.institution : null;
      const gInstName = instLabel(gInst);
      if (gInstName) parts.push(`Qurum: ${gInstName}`);
    }
    if (log?.type === 'institution') {
      const i = log?.institution;
      const iName = typeof i === 'string' ? i : (i?.shortName || i?.longName || i?._id || '');
      if (iName) parts.push(`Qurum: ${iName}`);
    }
    if (log?.responseCode !== null && log?.responseCode !== undefined) parts.push(`Kod: ${log.responseCode}`);
    if (log?.errorMessage) parts.push(`Xəta: ${log.errorMessage}`);
    return parts.join(' • ');
  };

  const actionLabel = (action) => {
    if (action === 'send') return 'Göndərmə';
    if (action === 'delivered') return 'Çatdırıldı';
    if (action === 'failed') return 'Uğursuz';
    return action || '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('loading');
    try {
      let res;
      if (mode === 'institution') {
        if (!selectedInstitutionId) throw new Error('Qurum seçin');
        res = await postRequests.sendInstitutionMessage(selectedInstitutionId, { content });
      } else if (mode === 'direct') {
        if (!selectedEmployeeId) throw new Error('Çalışan seçin');
        res = await postRequests.sendDirectMessage({ employeeId: selectedEmployeeId, content });
      } else if (mode === 'group') {
        if (!selectedGroupId) throw new Error('Grup seçin');
        res = await postRequests.sendGroupMessage(selectedGroupId, { content });
      }
      setStatusMsg(`Başarılı: ${res?.data?.message || 'Mesaj gönderildi'}`);
      setContent('');
      await fetchLogs(1);
    } catch (err) {
      setStatusMsg(`Hata: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mesajlaşma</h1>
        <p className="text-gray-600">Tək kartdan işçiyə, quruma və ya qrupa mesaj göndərin.</p>
      </div>

      <div className="space-y-8">
        {/* Birleşik Gönderim Kartı */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mesaj Göndər</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hədəf növü</label>
                <select className="w-full border rounded-md h-10 px-3" value={mode} onChange={(e) => setMode(e.target.value)}>
                  {(user?.permissions?.isSuperAdmin || user?.permissions?.canMessageInstitutionGroups) && (
                    <option value="institution">Qurum</option>
                  )}
                  {user?.permissions?.canMessageDirect === true && (
                    <option value="direct">İşçi</option>
                  )}
                  <option value="group">Qrup</option>
                </select>
              </div>

              {(mode === 'institution' || mode === 'direct' || (user?.permissions?.isSuperAdmin === true)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qurum</label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={selectedInstitutionId}
                    onChange={(e) => onInstitutionChange(e.target.value)}
                    disabled={institutions.length === 0}
                  >
                    <option value="">Qurumu seçin</option>
                    {institutions.map((inst) => (
                      <option key={inst.id || inst._id} value={inst.id || inst._id}>
                        {inst.displayName || `${inst.shortName} - ${inst.longName}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'direct' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşçi</label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    disabled={employees.length === 0}
                  >
                    <option value="">İşçini seçin</option>
                    {employees.map((emp) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.fullName || `${emp.firstName} ${emp.lastName}`} {emp.email ? `- ${emp.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qrup</label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    disabled={groups.length === 0}
                  >
                    <option value="">Qrupu seçin</option>
                    {groups.map((g) => (
                      <option key={g.id || g._id} value={g.id || g._id}>
                        {g.name} {g.institution?.shortName ? `- ${g.institution?.shortName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
              <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Göndər</Button>
            {statusMsg && (
              <p className={`text-sm ${statusMsg.startsWith('Xəta') ? 'text-red-600' : statusMsg === 'loading' ? 'text-gray-500' : 'text-green-600'}`}>{statusMsg}</p>
            )}
          </form>
        </div>

        {/* İşlem Günlükleri */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mesaj Əməliyyat Jurnalı</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.length === 0 && (
              <p className="text-sm text-gray-500">Jurnal tapılmadı.</p>
            )}
            {logs.map((log) => (
              <div key={log._id || `${actorLabel(log)}-${log.createdAt}`} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{actionLabel(log.action)}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(log.createdAt).toLocaleString()} • Aktor: {actorLabel(log)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded bg-blue-100 text-blue-700`}>{actionLabel(log.action)}</span>
                </div>
                {user?.permissions?.isSuperAdmin === true && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Məzmun</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{log.contentPreview || ''}</p>
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Detallar</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{detailsText(log)}</p>
                </div>
                {log?.type === 'group' && Array.isArray(log?.group?.members) && log.group.members.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Alıcılar</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {log.group.members.map((m) => {
                        const name = [m?.firstName, m?.lastName].filter(Boolean).join(' ');
                        return name || m?.email || '';
                      }).filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={() => fetchLogs(Math.max(1, logsPage - 1))} disabled={logsPage === 1}>Əvvəlki</Button>
            <p className="text-sm text-gray-600">Səhifə {logsPage}</p>
            <Button variant="outline" onClick={() => fetchLogs(logsPage + 1)} disabled={(logsPage * 10) >= logsTotal}>Sonrakı</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;