import React from 'react';
import { useDwm, AppView } from '../context/DwmContext';
import {
  Network,
  FileSpreadsheet,
  LineChart,
  GitFork,
  RotateCcw,
  PlusCircle,
  Building2,
  Users,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  onOpenLogModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLogModal }) => {
  const { activeView, setActiveView, resetToDefaults, positions } = useDwm();

  const navItems: { id: AppView; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'organogram',
      label: 'Organogram',
      description: 'Department structure & staff',
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'rolesheets',
      label: 'Role Sheets',
      description: 'Responsibilities & KPI limits',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'kpitree',
      label: 'KPI Tree',
      description: 'Objective to KPI tree (L → R)',
      icon: <GitFork className="w-4 h-4" />,
    },
    {
      id: 'controlgraph',
      label: 'Control Graphs',
      description: 'SPC trend, UCL, LCL & actuals',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      id: 'stability_matrix',
      label: 'Stability vs. Capability Matrix',
      description: '2×2 Process Quality Matrix',
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  const totalHeadcount = positions.reduce((acc, p) => acc + p.headcount, 0);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight truncate">
            Kauvery Hospital
          </span>
          <span className="text-[11px] text-blue-700 font-semibold block leading-tight truncate">
            Billing DWM System
          </span>
        </div>
      </div>

      {/* Navigation (Left Sidebar Nav) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Management Modules
        </div>

        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Buttons & Department Info in Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <button
          onClick={onOpenLogModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Log Reading</span>
        </button>

        <button
          onClick={resetToDefaults}
          title="Reset any dragged KPIs or edits back to hospital default setup"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg border border-slate-200 transition-colors bg-white"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset Defaults</span>
        </button>

        <div className="pt-2 border-t border-slate-200 px-1 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>{totalHeadcount} Staff</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>DWM Active</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
