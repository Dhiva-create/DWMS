import React from 'react';
import { useDwm } from '../context/DwmContext';
import { Database } from 'lucide-react';

interface NavbarProps {
  onOpenLogModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { activeView, supabaseStatus, setIsSetupModalOpen } = useDwm();

  const getBreadcrumb = () => {
    switch (activeView) {
      case 'organogram':
        return 'Department Organogram & Headcount';
      case 'rolesheets':
        return 'Daily Routine Management (DRM) Role Sheets';
      case 'kpitree':
        return 'Left-to-Right Hierarchical KPI Tree';
      case 'controlgraph':
        return 'Statistical Process Control (SPC) Graphs';
      case 'stability_matrix':
        return 'Stability vs. Capability 2×2 Matrix';
      case 'checksheet':
        return 'Daily Routine Shift Checksheet';
      default:
        return 'Billing Operations';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Contextual Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">
            Kauvery Hospital Billing
          </span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-blue-700 font-bold">{getBreadcrumb()}</span>
        </div>

        {/* Right Header Status: Cloud Database Connection Indicator */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="Click to view Supabase connection status & SQL schema"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : supabaseStatus === 'schema_needed'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {supabaseStatus === 'connected'
                  ? 'Supabase Synced'
                  : supabaseStatus === 'schema_needed'
                  ? 'Supabase Setup Needed'
                  : 'Supabase Cloud'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
