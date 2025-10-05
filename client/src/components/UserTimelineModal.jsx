import { Button } from '@/components/ui/button';

const getActionStyle = (actionRaw) => {
  const action = String(actionRaw || '').toLowerCase();
  if (action.includes('create')) return { color: 'bg-emerald-500', ring: 'ring-emerald-200', badge: 'text-emerald-700 bg-emerald-100', icon: '＋', label: 'Yaradılma' };
  if (action.includes('delete')) return { color: 'bg-rose-500', ring: 'ring-rose-200', badge: 'text-rose-700 bg-rose-100', icon: '✖', label: 'Silinmə' };
  if (action.includes('permission')) return { color: 'bg-violet-500', ring: 'ring-violet-200', badge: 'text-violet-700 bg-violet-100', icon: '⚙', label: 'İcazə yenilənməsi' };
  if (action.includes('update')) return { color: 'bg-amber-500', ring: 'ring-amber-200', badge: 'text-amber-700 bg-amber-100', icon: '✎', label: 'Yenilənmə' };
  return { color: 'bg-blue-500', ring: 'ring-blue-200', badge: 'text-blue-700 bg-blue-100', icon: '•', label: 'Əməliyyat' };
};

const UserTimelineModal = ({
  selectedUser,
  institutionText,
  institutions = [],
  onClose,
  logsLoading,
  logsError,
  userLogs,
  userActivity,
  activeLogTab,
  setActiveLogTab
}) => {
  const formatInstitutionByIdOrObj = (value) => {
    if (!value) return '-';
    // If value is populated object
    if (typeof value === 'object') {
      const short = value.shortName || '';
      const long = value.longName || '';
      return short || long || '-'; // prefer short name
    }
    // If value is id string, resolve from institutions list
    const id = String(value);
    const found = institutions.find(i => String(i?._id || i?.id || '') === id);
    if (found) return found.shortName || found.longName || '-';
    return '-';
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg w-[50vw]  p-0 ring-1 ring-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">İstifadəçi detalları</h2>
              <p className="text-sm text-gray-600">Vaxt xətti ilə əməliyyat qeydləri</p>
            </div>
            <Button variant="ghost" onClick={onClose}>Bağla</Button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Ad</p>
              <p className="text-sm text-gray-900">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">E‑poçt</p>
              <p className="text-sm text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Qurum</p>
              <p className="text-sm text-gray-900">{institutionText}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm text-gray-900">{selectedUser.isActive !== false ? 'Aktiv' : 'Passiv'}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Vaxt xətti</h3>
          <div className="mb-3 flex items-center space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded-md border ${activeLogTab === 'subject' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveLogTab('subject')}
            >İstifadəçiyə edilənlər</button>
            <button
              className={`px-3 py-1 text-sm rounded-md border ${activeLogTab === 'actor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveLogTab('actor')}
            >İstifadəçinin etdiyi əməliyyatlar</button>
          </div>
        </div>
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {logsLoading ? (
            <p className="text-sm text-gray-500">Yüklənir...</p>
          ) : logsError ? (
            <p className="text-sm text-red-600">{logsError}</p>
          ) : (activeLogTab === 'subject' ? userLogs.length === 0 : userActivity.length === 0) ? (
            <p className="text-sm text-gray-600">Hələ qeyd yoxdur.</p>
          ) : (
            <ul className="space-y-3">
              {(activeLogTab === 'subject' ? userLogs : userActivity).map((log) => {
                const style = getActionStyle(log.action);
                return (
                  <li key={log._id} className={`relative rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition ring-1 ${style.ring}`}>
                    <div className="flex items-start">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${style.color} mr-3 shrink-0`}>{style.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">{String(log.action || '').replaceAll('_', ' ')}</span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        {log.message && (
                          <p className="mt-1 text-sm text-gray-700">{log.message}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          {activeLogTab === 'subject' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">👤<span className="font-medium">Edən:</span> {log?.actorUserId?.name || log?.actorUserId?.email || '-'}</span>
                          )}
                          {activeLogTab === 'actor' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">🎯<span className="font-medium">Hədəf:</span> {log?.userId?.name || log?.userId?.email || '-'}</span>
                          )}
                        </div>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-gray-800 mb-1">Dəyişikliklər</div>
                            <div className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-gray-50 max-h-56 overflow-y-auto">
                              {Object.entries(log.changes).map(([key, val]) => (
                                (key === 'permissions' && typeof val === 'object' && val !== null && !('from' in val)) ? (
                                  <div key={key} className="px-3 py-2 text-xs">
                                    <div className="text-gray-500 mb-1">{key}</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(val).map(([perm, enabled]) => (
                                        <span
                                          key={perm}
                                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium border ${enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                        >
                                          {perm}: {String(Boolean(enabled))}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2 text-xs">
                                    <span className="text-gray-500 break-words">{key}</span>
                                    <span className="text-center text-gray-400">→</span>
                                    <span className="text-gray-700 break-words">
                                      {(() => {
                                        const isInstKey = key === 'institution' || key === 'institutionId';
                                        if (typeof val === 'object' && val !== null && 'from' in val && 'to' in val) {
                                          if (isInstKey) {
                                            const fromText = formatInstitutionByIdOrObj(val.from);
                                            const toText = formatInstitutionByIdOrObj(val.to);
                                            return `${fromText} → ${toText}`;
                                          }
                                          return `${String(val.from)} → ${String(val.to)}`;
                                        } else {
                                          if (isInstKey) {
                                            return formatInstitutionByIdOrObj(val);
                                          }
                                          try {
                                            return JSON.stringify(val);
                                          } catch {
                                            return String(val);
                                          }
                                        }
                                      })()}
                                    </span>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTimelineModal;