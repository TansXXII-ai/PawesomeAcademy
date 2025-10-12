// app/components/shared/ToastProvider.js
'use client';
import React, { useState, createContext } from 'react';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slide-in border-2 ${
              toast.type === 'success' ? 'bg-[#32303b] border-[#dcac6e]' :
              toast.type === 'error' ? 'bg-red-600 border-red-800' :
              toast.type === 'info' ? 'bg-[#dcac6e] text-[#32303b] border-[#c49654]' : 'bg-gray-600 border-gray-800'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
