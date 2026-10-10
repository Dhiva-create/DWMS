import React, { useState } from 'react';
import { useDwm } from '../context/DwmContext';
import { TaskStatus, PositionId } from '../types/dwm';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Filter,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

export const DailyRoutineChecksheet: React.FC = () => {
  const {
    positions,
    responsibilities,
    updateResponsibilityStatus,
    navigateToPositionRoleSheet,
  } = useDwm();

  const [selectedPosFilter, setSelectedPosFilter] = useState<PositionId | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = responsibilities.filter((r) => {
    const posMatch = selectedPosFilter === 'all' || r.positionId === selectedPosFilter;
    const statusMatch = selectedStatusFilter === 'all' || r.currentStatus === selectedStatusFilter;
    return posMatch && statusMatch;
  });

  const compliantCount = responsibilities.filter((r) => r.currentStatus === 'compliant').length;
  const inProgressCount = responsibilities.filter((r) => r.currentStatus === 'in_progress').length;
  const pendingCount = responsibilities.filter((r) => r.currentStatus === 'pending').length;
  const flaggedCount = responsibilities.filter((r) => r.currentStatus === 'flagged').length;

  const complianceRate = ((compliantCount / (responsibilities.length || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Shift Operations · Daily Work Management Checksheet</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Billing Daily Routine Verification
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Audit and track compliance against 35 routine responsibilities across all 5 positions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl min-w-28">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                Today's Adherence
              </span>
              <span className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
                {complianceRate}%
              </span>
            </div>

            <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-xl min-w-28">
              <span className="text-[11px] font-semibold text-slate-600 uppercase block">
                Compliant Tasks
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {compliantCount} / {responsibilities.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Position:</span>
            <select
              value={selectedPosFilter}
              onChange={(e) => setSelectedPosFilter(e.target.value as any)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Positions (35 Tasks)</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayNumber}. {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({responsibilities.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('compliant')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatusFilter === 'compliant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-100/50'
              }`}
            >
              Compliant ({compliantCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatusFilter === 'in_progress'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-100/50'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('pending')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-100/50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('flagged')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatusFilter === 'flagged'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100/50'
              }`}
            >
              Flagged ({flaggedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Routine Checksheet List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-48">Position</th>
                <th className="py-3 px-4 w-12 font-mono">S.No</th>
                <th className="py-3 px-4 w-60">Routine Responsibility</th>
                <th className="py-3 px-4">Standard Operational Procedure</th>
                <th className="py-3 px-4 w-28">Timing</th>
                <th className="py-3 px-4 w-40">Checkpoint</th>
                <th className="py-3 px-4 w-32 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map((task) => {
                const pos = positions.find((p) => p.id === task.positionId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => navigateToPositionRoleSheet(task.positionId)}
                        className="text-left hover:text-blue-700 transition-colors"
                      >
                        <span className="font-mono text-slate-400 block text-[10px]">
                          Level {pos?.level}
                        </span>
                        <span>{pos?.shortTitle}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      #{task.sNo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {task.frequency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-sm">
                      {task.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.standardOperatingTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {task.verificationCheckpoint}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={task.currentStatus}
                        onChange={(e) =>
                          updateResponsibilityStatus(task.id, e.target.value as TaskStatus)
                        }
                        className={`text-xs font-semibold rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                          task.currentStatus === 'compliant'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : task.currentStatus === 'in_progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : task.currentStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="compliant">Compliant</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="flagged">Flagged</option>
                      </select>
                      {task.lastCheckedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {task.lastCheckedAt}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
