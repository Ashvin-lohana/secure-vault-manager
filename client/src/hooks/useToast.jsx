import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-3 shadow-2xl border text-sm pointer-events-auto
              ${t.variant === 'destructive'
                ? 'bg-red-950/90 border-red-800 text-red-100 backdrop-blur-sm'
                : 'bg-slate-800/90 border-slate-700 text-white backdrop-blur-sm'
              }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && <p className="text-slate-400 text-xs mt-0.5">{t.description}</p>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function Toaster() {
  return null;
}

export function useToast() {
  return useContext(Ctx);
}
