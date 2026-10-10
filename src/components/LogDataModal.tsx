import React, { useState } from 'react';
import { useDwm } from '../context/DwmContext';
import { FrequencyType } from '../types/dwm';
import { X, PlusCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LogDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogDataModal: React.FC<LogDataModalProps> = ({ isOpen, onClose }) => {
  const { kpis, positions, selectedKpiId, addControlPoint, getTeamMembersForPosition } = useDwm();

  const [kpiId, setKpiId] = useState(selectedKpiId || (kpis[0]?.id ?? ''));
  const [periodType, setPeriodType] = useState<FrequencyType>('Daily');
  const [label, setLabel] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [memberId, setMemberId] = useState<string>('all');
  const [remarks, setRemarks] = useState('');
  const [operatorName, setOperatorName] = useState('Staff Operator');

  if (!isOpen) return null;

  const currentKpi = kpis.find((k) => k.id === kpiId) || kpis[0];
  const assignedPosition = positions.find((p) => p.id === currentKpi?.positionId);
  const positionMembers = assignedPosition ? getTeamMembersForPosition(assignedPosition.id) : [];

  const numericVal = parseFloat(valueStr);
  const hasValue = !isNaN(numericVal);
  const isOutOfLimits = hasValue && (numericVal > currentKpi.ucl || numericVal < currentKpi.lcl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValue) return;

    const defaultLabel =
      label.trim() ||
      (periodType === 'Daily'
        ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : periodType === 'Weekly'
        ? 'Wk Current'
        : periodType === 'Monthly'
        ? 'Month Current'
        : `Case #${Math.floor(1000 + Math.random() * 9000)}`);

    addControlPoint({
      kpiId: currentKpi.id,
      periodType,
      label: defaultLabel,
      timestamp: new Date().toISOString(),
      value: numericVal,
      memberId: memberId === 'all' ? undefined : memberId,
      operatorName: operatorName.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });

    setValueStr('');
    setRemarks('');
    setLabel('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Control Graph Entry
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Log Statistical Data Point
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select KPI
            </label>
            <select
              value={kpiId}
              onChange={(e) => setKpiId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {positions.map((pos) => {
                const posKpis = kpis.filter((k) => k.positionId === pos.id);
                return (
                  <optgroup key={pos.id} label={`${pos.displayNumber}. ${pos.title}`}>
                    {posKpis.map((kpi) => (
                      <option key={kpi.id} value={kpi.id}>
                        {kpi.code} – {kpi.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Statistical Limits Preview Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                Target
              </span>
              <span className="font-bold text-emerald-700 font-mono">
                {currentKpi.target} {currentKpi.unit}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                UCL (+3σ)
              </span>
              <span className="font-bold text-rose-700 font-mono">
                {currentKpi.ucl} {currentKpi.unit}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                LCL (-3σ)
              </span>
              <span className="font-bold text-slate-700 font-mono">
                {currentKpi.lcl} {currentKpi.unit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measurement Cadence
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as FrequencyType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Instance-based">Instance-based</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Oct 06 or Case #1041"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Measured Value ({currentKpi.unit})
              </label>
              <input
                type="number"
                step="any"
                required
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="e.g. 58.5"
                className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Team Member (Optional)
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Entire Position Team</option>
                {positionMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Out of Control Warning / In Control Confirmation */}
          {hasValue && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                isOutOfLimits
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {isOutOfLimits ? (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>Statistical Alert:</strong> Value ({numericVal} {currentKpi.unit}) exceeds control limit (UCL: {currentKpi.ucl}, LCL: {currentKpi.lcl}). Please provide remarks below.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Within Limits:</strong> Value is under statistical control between LCL ({currentKpi.lcl}) and UCL ({currentKpi.ucl}).
                  </span>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Root Cause / Corrective Action (CAPA)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reason for special variation or operational shift observations."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Record Data Point
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
