import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ToastItem = ({ id, type = 'info', title, message, onClose }) => {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };
  return (
    <div className={`shadow-lg rounded-md p-3 text-white ${colors[type] || colors.info}`}> 
      {title && <div className="font-semibold text-sm">{title}</div>}
      {message && <div className="text-sm mt-0.5">{message}</div>}
      <button className="mt-2 text-xs underline" onClick={() => onClose(id)}>Bağla</button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ type = 'info', title = '', message = '', duration = 3500 }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Global köprü: interceptors/CX dışından çağrılabilsin
    window.__showToast = (opts) => addToast(opts || {});
    return () => { delete window.__showToast; };
  }, []);

  const value = useMemo(() => ({ addToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-[9999] top-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};