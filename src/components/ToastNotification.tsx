import React, { useEffect } from 'react';
import { useDwm } from '../context/DwmContext';
import { CheckCircle2, X, FileSpreadsheet } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast, clearToast, navigateToPositionRoleSheet, selectedPositionId } = useDwm();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white tracking-wide uppercase">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {toast.message}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                navigateToPositionRoleSheet(selectedPositionId);
                clearToast();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-white underline underline-offset-2"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>Inspect Role Sheet</span>
            </button>
          </div>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
