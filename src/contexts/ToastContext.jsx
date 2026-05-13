import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '@/components/common/Toast/Toast';

const ToastContext = createContext({ notify: () => {} });

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast) => {
      const id = ++nextId;
      const t = {
        id,
        title: toast.title ?? '',
        body: toast.body ?? '',
        tone: toast.tone ?? 'info',
        duration: toast.duration ?? 4500,
      };
      setToasts((curr) => [...curr, t]);
      if (t.duration > 0) {
        setTimeout(() => dismiss(id), t.duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
