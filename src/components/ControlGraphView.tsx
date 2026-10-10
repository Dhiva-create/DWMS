import React, { useState, useMemo, useEffect } from 'react';
import { useDwm } from '../context/DwmContext';
import { PositionId, ControlDataPoint, KPI, FrequencyType } from '../types/dwm';
import {
  LineChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Edit3,
  Trash2,
  TrendingDown,
  TrendingUp,
  Download,
  Check,
  X,
  Sliders,
  ShieldCheck,
  Lock,
  RotateCcw,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ControlGraphViewProps {
  onOpenLogModal: () => void;
}

export const ControlGraphView: React.FC<ControlGraphViewProps> = ({ onOpenLogModal }) => {
  const {
    positions,
    kpis,
    controlPoints,
    selectedKpiId,
    setSelectedKpiId,
    selectedPositionId,
    setSelectedPositionId,
    selectedMemberId,
    setSelectedMemberId,
    getTeamMembersForPosition,
    updateKpi,
    updateControlPoint,
    deleteControlPoint,
    addControlPoint,
  } = useDwm();

  const [hoveredPoint, setHoveredPoint] = useState<ControlDataPoint | null>(null);

  // Active selected KPI
  const activeKpi = kpis.find((k) => k.id === selectedKpiId) || kpis[0];
  const assignedPosition = positions.find((p) => p.id === activeKpi?.positionId) || positions[0];
  const teamMembers = getTeamMembersForPosition(assignedPosition.id);

  // Base Frequency
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyType>(
    activeKpi.measurementFrequency || 'Daily'
  );

  // Number of Data Points Visible on Graph (default 30 for Daily, 12 for Monthly, 20 for Instance-based)
  const [dataPointsVisible, setDataPointsVisible] = useState<number>(() => {
    if (activeKpi.measurementFrequency === 'Monthly') return 12;
    if (activeKpi.measurementFrequency === 'Instance-based') return 20;
    return 30;
  });

  // Keep in sync when selected KPI changes
  useEffect(() => {
    const freq = activeKpi.measurementFrequency || 'Daily';
    setSelectedFrequency(freq);
    if (freq === 'Daily') setDataPointsVisible(30);
    else if (freq === 'Monthly') setDataPointsVisible(12);
    else if (freq === 'Instance-based') setDataPointsVisible(20);
    else if (freq === 'Weekly') setDataPointsVisible(12);
  }, [activeKpi.id, activeKpi.measurementFrequency]);

  const handleFrequencyChange = (freq: FrequencyType) => {
    setSelectedFrequency(freq);
    if (freq === 'Daily') setDataPointsVisible(30);
    else if (freq === 'Monthly') setDataPointsVisible(12);
    else if (freq === 'Instance-based') setDataPointsVisible(20);
    else if (freq === 'Weekly') setDataPointsVisible(12);
  };

  // GRAPH CUSTOMIZATION STATE:
  // 1. Panel expanded/collapsed
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // 2. Y-Axis Upper and Lower Limits (null = auto calculate)
  const [customUpperLimit, setCustomUpperLimit] = useState<number | null>(null);
  const [customLowerLimit, setCustomLowerLimit] = useState<number | null>(null);

  // 3. Axis Major Grid (Interval/step or 'auto')
  const [majorGridInterval, setMajorGridInterval] = useState<number | 'auto'>('auto');

  // 4. Axis Minor Grid (Interval/step, or 'auto', and toggle)
  const [showMinorGrid, setShowMinorGrid] = useState<boolean>(true);
  const [minorGridInterval, setMinorGridInterval] = useState<number | 'auto'>('auto');

  // Target Fixed by Incharge modal & state
  const [isInchargeTargetModalOpen, setIsInchargeTargetModalOpen] = useState(false);
  const [inchargeTargetInput, setInchargeTargetInput] = useState<number>(activeKpi.target);
  const [inchargeNotes, setInchargeNotes] = useState<string>(
    'Standard approved as departmental benchmark by Billing Incharge.'
  );

  useEffect(() => {
    setInchargeTargetInput(activeKpi.target);
  }, [activeKpi.target]);

  // Inline actuals editing
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editPointValue, setEditPointValue] = useState<string>('');
  const [editPointRemarks, setEditPointRemarks] = useState<string>('');

  // Quick Add Actual Reading inline bar
  const [quickAddVal, setQuickAddVal] = useState('');
  const [quickAddLabel, setQuickAddLabel] = useState('');
  const [quickAddRemarks, setQuickAddRemarks] = useState('');

  // Filter control points based on selected frequency and visible data points count
  const filteredPoints = useMemo(() => {
    let pts = controlPoints.filter(
      (pt) => pt.kpiId === activeKpi.id && pt.periodType === selectedFrequency
    );

    if (pts.length === 0) {
      pts = controlPoints.filter((pt) => pt.kpiId === activeKpi.id);
    }

    if (selectedMemberId !== 'all') {
      pts = pts.filter((pt) => !pt.memberId || pt.memberId === selectedMemberId);
    }

    // Sort chronologically (oldest to newest for plotting left-to-right on graph)
    const sorted = [...pts].reverse();
    // Slice by customizable number of data points visible
    return sorted.slice(-Math.max(3, dataPointsVisible));
  }, [controlPoints, activeKpi.id, selectedFrequency, selectedMemberId, dataPointsVisible]);

  // For the Live Actuals table: newly updated/logged readings are displayed at the TOP (newest first)
  const tablePoints = useMemo(() => {
    return [...filteredPoints].reverse();
  }, [filteredPoints]);

  // STATISTICAL CALCULATIONS: CENTRE LINE, UCL, AND LCL ARE AUTOPOPULATED BASED ON PAST DATA!
  const stats = useMemo(() => {
    if (filteredPoints.length === 0) {
      return {
        mean: activeKpi.target,
        stdDev: 0,
        ucl: Number((activeKpi.target * 1.3).toFixed(1)),
        lcl: Number((activeKpi.target * 0.7).toFixed(1)),
        min: 0,
        max: 0,
        outOfControlCount: 0,
        inControlPercent: '100',
        cpk: '1.33',
      };
    }

    const values = filteredPoints.map((p) => p.value);
    const sum = values.reduce((a, b) => a + b, 0);
    // Autopopulated Mean (Centre Line X̄)
    const autoMean = sum / values.length;

    // Autopopulated Standard Deviation (σ)
    const squareDiffs = values.map((val) => Math.pow(val - autoMean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / (values.length || 1);
    const autoStdDev = Math.sqrt(variance);

    // Autopopulated UCL (+3σ) & LCL (-3σ)
    const autoUcl = Number((autoMean + 3 * autoStdDev).toFixed(1));
    const autoLcl = Number(Math.max(0, autoMean - 3 * autoStdDev).toFixed(1));

    const min = Math.min(...values);
    const max = Math.max(...values);

    const outOfControlCount = filteredPoints.filter(
      (p) => p.value > autoUcl || p.value < autoLcl
    ).length;

    const inControlPercent = (
      ((filteredPoints.length - outOfControlCount) / filteredPoints.length) *
      100
    ).toFixed(1);

    const sigma = autoStdDev || 0.001;
    const cpu = (autoUcl - autoMean) / (3 * sigma);
    const cpl = (autoMean - autoLcl) / (3 * sigma);
    const cpk = Math.max(0, Math.min(cpu, cpl)).toFixed(2);

    return {
      mean: Number(autoMean.toFixed(1)),
      stdDev: Number(autoStdDev.toFixed(1)),
      ucl: autoUcl,
      lcl: autoLcl,
      min,
      max,
      outOfControlCount,
      inControlPercent,
      cpk,
    };
  }, [filteredPoints, activeKpi.target]);

  // Handle Save Incharge Target
  const handleSaveInchargeTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(inchargeTargetInput);
    if (isNaN(val)) return;

    updateKpi(activeKpi.id, {
      target: val,
      centerLine: stats.mean,
      ucl: stats.ucl,
      lcl: stats.lcl,
    });

    setIsInchargeTargetModalOpen(false);
  };

  // Handle Quick Add Actual Reading
  const handleQuickAddActual = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAddVal);
    if (isNaN(val)) return;

    const periodType = selectedFrequency;

    const defaultLabel =
      quickAddLabel.trim() ||
      (periodType === 'Instance-based'
        ? `Case #${Math.floor(1000 + Math.random() * 9000)}`
        : periodType === 'Monthly'
        ? new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : periodType === 'Weekly'
        ? `Wk ${Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % 52}`
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    addControlPoint({
      kpiId: activeKpi.id,
      periodType,
      label: defaultLabel,
      timestamp: new Date().toISOString(),
      value: val,
      memberId: selectedMemberId === 'all' ? undefined : selectedMemberId,
      remarks: quickAddRemarks.trim() || undefined,
    });

    setQuickAddVal('');
    setQuickAddLabel('');
    setQuickAddRemarks('');
  };

  // Handle Save inline point edit
  const handleSavePointEdit = (pointId: string) => {
    const val = parseFloat(editPointValue);
    if (!isNaN(val)) {
      updateControlPoint(pointId, {
        value: val,
        remarks: editPointRemarks.trim() || undefined,
      });
    }
    setEditingPointId(null);
  };

  // Reset graph customizer to defaults
  const handleResetCustomizer = () => {
    setCustomUpperLimit(null);
    setCustomLowerLimit(null);
    setMajorGridInterval('auto');
    setMinorGridInterval('auto');
    setShowMinorGrid(true);
    if (selectedFrequency === 'Daily') setDataPointsVisible(30);
    else if (selectedFrequency === 'Monthly') setDataPointsVisible(12);
    else if (selectedFrequency === 'Instance-based') setDataPointsVisible(20);
    else if (selectedFrequency === 'Weekly') setDataPointsVisible(12);
  };

  // SVG Chart Geometry
  const chartWidth = 960;
  const chartHeight = 370;
  const padding = { top: 35, right: 140, bottom: 45, left: 65 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Natural Auto-calculated Range
  const autoYValues = [
    activeKpi.target,
    stats.ucl,
    stats.lcl,
    stats.mean,
    ...filteredPoints.map((p) => p.value),
  ];
  const autoMinY = Math.max(0, Math.floor(Math.min(...autoYValues) * 0.85));
  const autoMaxY = Math.ceil(Math.max(...autoYValues) * 1.15) || 10;

  // Effective Y-axis limits (Custom Upper Limit & Custom Lower Limit applied)
  const minY = customLowerLimit !== null && !isNaN(customLowerLimit) ? customLowerLimit : autoMinY;
  const maxY = customUpperLimit !== null && !isNaN(customUpperLimit) ? customUpperLimit : autoMaxY;
  const yRange = Math.max(0.1, maxY - minY);

  // Compute Major & Minor Grid Steps
  const effectiveMajorStep = useMemo(() => {
    if (majorGridInterval !== 'auto' && typeof majorGridInterval === 'number' && majorGridInterval > 0) {
      return majorGridInterval;
    }
    // Auto step selection based on range
    if (yRange <= 6) return 1;
    if (yRange <= 15) return 2;
    if (yRange <= 35) return 5;
    if (yRange <= 75) return 10;
    if (yRange <= 160) return 20;
    if (yRange <= 350) return 50;
    return 100;
  }, [majorGridInterval, yRange]);

  const effectiveMinorStep = useMemo(() => {
    if (!showMinorGrid) return null;
    if (minorGridInterval !== 'auto' && typeof minorGridInterval === 'number' && minorGridInterval > 0) {
      return minorGridInterval;
    }
    // Auto minor step
    if (effectiveMajorStep >= 50) return 10;
    if (effectiveMajorStep >= 20) return 5;
    if (effectiveMajorStep >= 10) return 2;
    if (effectiveMajorStep >= 5) return 1;
    if (effectiveMajorStep >= 2) return 0.5;
    return 0.25;
  }, [showMinorGrid, minorGridInterval, effectiveMajorStep]);

  // Generate grid tick values
  const gridTicks = useMemo(() => {
    const ticks: { val: number; isMajor: boolean; y: number }[] = [];
    const step = effectiveMinorStep || effectiveMajorStep;

    if (step <= 0 || yRange / step > 100) {
      // Safety limit to avoid infinite loops if bad step
      const majorValues = [0, 0.25, 0.5, 0.75, 1].map((r) => minY + r * yRange);
      return majorValues.map((v) => ({
        val: Number(v.toFixed(1)),
        isMajor: true,
        y: padding.top + plotHeight - ((v - minY) / yRange) * plotHeight,
      }));
    }

    const startVal = Math.floor(minY / step) * step;
    const endVal = Math.ceil(maxY / step) * step;

    for (let v = startVal; v <= endVal + 0.0001; v += step) {
      if (v < minY - 0.0001 || v > maxY + 0.0001) continue;
      const roundedVal = Number(v.toFixed(2));
      // Check if it corresponds to a major step
      const isMajor = Math.abs((roundedVal / effectiveMajorStep) - Math.round(roundedVal / effectiveMajorStep)) < 0.001;

      const normalized = (roundedVal - minY) / yRange;
      const y = padding.top + plotHeight - normalized * plotHeight;
      ticks.push({ val: roundedVal, isMajor, y });
    }

    return ticks;
  }, [minY, maxY, yRange, effectiveMajorStep, effectiveMinorStep, plotHeight, padding.top]);

  const getYCoord = (val: number) => {
    const normalized = (val - minY) / yRange;
    return padding.top + plotHeight - normalized * plotHeight;
  };

  const getXCoord = (index: number, total: number) => {
    if (total <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (total - 1)) * plotWidth;
  };

  // Generate SVG path for actual trend line
  const trendLinePath = useMemo(() => {
    if (filteredPoints.length === 0) return '';
    return filteredPoints
      .map((pt, idx) => {
        const x = getXCoord(idx, filteredPoints.length);
        const y = getYCoord(pt.value);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [filteredPoints, minY, yRange]);

  const isHigherBetter = activeKpi.direction === 'higher_is_better';

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Period/Instance',
      'Timestamp',
      'Actual Value',
      'Target (Fixed by Incharge)',
      'Centre Line (Autopopulated X̄)',
      'UCL (Autopopulated +3σ)',
      'LCL (Autopopulated -3σ)',
      'Status',
      'Remarks',
    ];
    const rows = filteredPoints.map((pt) => [
      pt.label,
      pt.timestamp,
      pt.value,
      activeKpi.target,
      stats.mean,
      stats.ucl,
      stats.lcl,
      pt.value > stats.ucl || pt.value < stats.lcl ? 'OUT OF CONTROL' : 'IN CONTROL',
      pt.remarks || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeKpi.code}_SPC_Control_Graph.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* KPI Selection Dropdown */}
          <div className="lg:col-span-8">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select KPI Control Graph
            </label>
            <select
              value={selectedKpiId}
              onChange={(e) => {
                const k = kpis.find((x) => x.id === e.target.value);
                if (k) {
                  setSelectedKpiId(k.id);
                  setSelectedPositionId(k.positionId);
                }
              }}
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

          {/* Team Member Filter */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Team Member Filter ({teamMembers.length} staff)
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Personnel ({assignedPosition.shortTitle})</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main KPI Control Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {/* Header row with KPI Details and Action CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <span className="font-mono text-slate-700 font-bold">{activeKpi.code}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-blue-700">
                {assignedPosition.displayNumber}. {assignedPosition.title}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-semibold ${
                  activeKpi.priority === 'Critical' ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {activeKpi.priority}
              </span>
              <span aria-hidden="true">·</span>
              {/* Direction badge */}
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded ${
                  isHigherBetter
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {isHigherBetter ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>Higher the better (&uarr;)</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-blue-600" />
                    <span>Lower the better (&darr;)</span>
                  </>
                )}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeKpi.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              {activeKpi.description}
            </p>
          </div>

          {/* Action CTAs: Customize Toggle, Incharge Fix Target Button, Export, Log */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Toggle Graph Customizer Button */}
            <button
              onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isCustomizerOpen
                  ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Graph</span>
              {isCustomizerOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Incharge Fix Target Button */}
            <button
              onClick={() => setIsInchargeTargetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Fix Target (Incharge)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenLogModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Reading</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE GRAPH CUSTOMIZER CONTROL PANEL */}
        {isCustomizerOpen && (
          <div className="my-5 p-5 bg-indigo-50/60 border-2 border-indigo-200 rounded-xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Graph Customizer: Axis Limits, Major/Minor Grids &amp; Visible Data Points
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCustomizer}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded border border-indigo-200 hover:border-indigo-300 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomizerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* 1. Y-Axis Limits (Upper Limit & Lower Limit) */}
              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  1. Y-Axis Bounds (Upper &amp; Lower Limits)
                </span>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="text-slate-600 font-semibold">Upper Limit (Max):</label>
                    <button
                      onClick={() => setCustomUpperLimit(null)}
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        customUpperLimit === null ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-400 hover:text-indigo-600'
                      }`}
                    >
                      Auto ({autoMaxY})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={customUpperLimit !== null ? customUpperLimit : ''}
                    placeholder={`Auto: ${autoMaxY}`}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                      setCustomUpperLimit(val);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="text-slate-600 font-semibold">Lower Limit (Min):</label>
                    <button
                      onClick={() => setCustomLowerLimit(null)}
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        customLowerLimit === null ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-400 hover:text-indigo-600'
                      }`}
                    >
                      Auto ({autoMinY})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={customLowerLimit !== null ? customLowerLimit : ''}
                    placeholder={`Auto: ${autoMinY}`}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                      setCustomLowerLimit(val);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Axis Major Grid Interval */}
              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  2. Axis Major Grid
                </span>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Major Interval Step:
                  </label>
                  <select
                    value={majorGridInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMajorGridInterval(val === 'auto' ? 'auto' : parseFloat(val));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="auto">Auto Calculated ({effectiveMajorStep})</option>
                    <option value="1">Every 1 unit</option>
                    <option value="2">Every 2 units</option>
                    <option value="5">Every 5 units</option>
                    <option value="10">Every 10 units</option>
                    <option value="20">Every 20 units</option>
                    <option value="25">Every 25 units</option>
                    <option value="50">Every 50 units</option>
                    <option value="100">Every 100 units</option>
                  </select>
                </div>

                <div className="pt-1 text-[11px] text-slate-500">
                  <span>Current Major Step: </span>
                  <strong className="text-slate-800 font-mono">
                    {effectiveMajorStep} {activeKpi.unit}
                  </strong>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Major lines have bold dashed rules and numeric axis values.
                  </p>
                </div>
              </div>

              {/* 3. Axis Minor Grid Interval */}
              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    3. Axis Minor Grid
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showMinorGrid}
                      onChange={(e) => setShowMinorGrid(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-700">Enable</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Minor Interval Step:
                  </label>
                  <select
                    disabled={!showMinorGrid}
                    value={minorGridInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMinorGridInterval(val === 'auto' ? 'auto' : parseFloat(val));
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      !showMinorGrid ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="auto">
                      Auto Subdivide ({effectiveMinorStep || 'None'})
                    </option>
                    <option value="0.5">Every 0.5 unit</option>
                    <option value="1">Every 1 unit</option>
                    <option value="2">Every 2 units</option>
                    <option value="5">Every 5 units</option>
                    <option value="10">Every 10 units</option>
                    <option value="20">Every 20 units</option>
                  </select>
                </div>

                <div className="pt-1 text-[11px] text-slate-500">
                  <span>Current Minor Step: </span>
                  <strong className="text-slate-800 font-mono">
                    {showMinorGrid && effectiveMinorStep ? `${effectiveMinorStep} ${activeKpi.unit}` : 'Disabled'}
                  </strong>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Subtle subdivisions for high-precision visual reading.
                  </p>
                </div>
              </div>

              {/* 4. No. of Data Points Visible */}
              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  4. Visible Data Points
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={dataPointsVisible}
                    onChange={(e) => setDataPointsVisible(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                  <input
                    type="number"
                    min="3"
                    max="90"
                    value={dataPointsVisible}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setDataPointsVisible(Math.max(3, Math.min(90, val)));
                    }}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded text-center"
                  />
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {[10, 20, 30, 60, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDataPointsVisible(preset)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        dataPointsVisible === preset
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset} pts
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Frequency & Reading Window Selector Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Frequency:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['Daily', 'Monthly', 'Instance-based', 'Weekly'] as FrequencyType[]).map((freq) => (
                <button
                  key={freq}
                  onClick={() => handleFrequencyChange(freq)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedFrequency === freq
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              No. of Readings Displayed:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {selectedFrequency === 'Daily' && (
                <>
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setDataPointsVisible(days)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        dataPointsVisible === days
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </>
              )}

              {selectedFrequency === 'Monthly' && (
                <>
                  {[12, 24].map((months) => (
                    <button
                      key={months}
                      onClick={() => setDataPointsVisible(months)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        dataPointsVisible === months
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {months} Months
                    </button>
                  ))}
                </>
              )}

              {selectedFrequency === 'Instance-based' && (
                <>
                  {[10, 20, 30, 50].map((count) => (
                    <button
                      key={count}
                      onClick={() => setDataPointsVisible(count)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        dataPointsVisible === count
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {count} Data Points {count === 50 ? '(Max)' : ''}
                    </button>
                  ))}
                </>
              )}

              {selectedFrequency === 'Weekly' && (
                <>
                  {[12, 24].map((wks) => (
                    <button
                      key={wks}
                      onClick={() => setDataPointsVisible(wks)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        dataPointsVisible === wks
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {wks} Weeks
                    </button>
                  ))}
                </>
              )}

              {/* Direct count badge */}
              <span className="text-[10px] font-mono text-slate-600 px-2 py-1 bg-white rounded border border-slate-200">
                Plotting: <strong>{filteredPoints.length}</strong> pts
              </span>
            </div>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {/* Target Line: Bolder card with Fixed by Incharge designation */}
          <div className="p-3 bg-emerald-50/90 border-2 border-emerald-400 rounded-xl text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              <Lock className="w-2.5 h-2.5" />
              <span>Target Line</span>
            </div>
            <span className="text-xl font-extrabold text-emerald-900 font-mono tabular-nums block mt-0.5">
              {activeKpi.target} {activeKpi.unit}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              Fixed by Incharge
            </span>
          </div>

          {/* Autopopulated Centre Line (Thinner) */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-blue-800 uppercase block">
              Centre Line (X̄)
            </span>
            <span className="text-lg font-bold text-blue-900 font-mono tabular-nums">
              {stats.mean} {activeKpi.unit}
            </span>
            <span className="text-[10px] text-blue-700 block font-mono">
              Autopopulated ({filteredPoints.length} pts)
            </span>
          </div>

          {/* Autopopulated UCL (Thinner) */}
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-rose-800 uppercase block">
              UCL (+3σ)
            </span>
            <span className="text-lg font-bold text-rose-900 font-mono tabular-nums">
              {stats.ucl} {activeKpi.unit}
            </span>
            <span className="text-[10px] text-rose-700 block font-mono">
              Autopopulated boundary
            </span>
          </div>

          {/* Autopopulated LCL (Thinner) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-700 uppercase block">
              LCL (-3σ)
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {stats.lcl} {activeKpi.unit}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Autopopulated boundary
            </span>
          </div>

          {/* Std Dev */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-700 uppercase block">
              Std Dev (σ)
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {stats.stdDev}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Cpk: {stats.cpk}
            </span>
          </div>

          {/* In-Control Rate */}
          <div
            className={`p-3 border rounded-xl text-center ${
              stats.outOfControlCount === 0
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-300 text-amber-900'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase block">
              In-Control Rate
            </span>
            <span className="text-lg font-bold font-mono tabular-nums">
              {stats.inControlPercent}%
            </span>
            <span className="text-[10px] block font-medium">
              {stats.outOfControlCount} Points &gt; Limits
            </span>
          </div>
        </div>

        {/* Legend with explicit line weights and customized active settings */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Bold Target Line Legend */}
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1 bg-emerald-600 rounded-full inline-block" />
              <span className="text-emerald-800 font-bold">
                Target Line (Bold · Fixed by Incharge)
              </span>
            </div>

            {/* Thinner Centre Line */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-[1px] bg-slate-600 inline-block" />
              <span className="text-slate-700 font-medium">
                Centre Line (Thin X̄ · Autopopulated)
              </span>
            </div>

            {/* Thinner UCL */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-[1px] border-b border-rose-500 border-dashed inline-block" />
              <span className="text-rose-600 font-medium">
                UCL (Thin +3σ · Autopopulated)
              </span>
            </div>

            {/* Thinner LCL */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-[1px] border-b border-slate-500 border-dashed inline-block" />
              <span className="text-slate-600 font-medium">
                LCL (Thin -3σ · Autopopulated)
              </span>
            </div>

            {/* Actual Trend */}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-blue-600 inline-block" />
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block -ml-2" />
              <span className="text-slate-700 font-medium">Actuals</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
            <span>Y-Bounds: [{minY.toFixed(1)} – {maxY.toFixed(1)}]</span>
            <span>·</span>
            <span>Major Step: {effectiveMajorStep}</span>
            {showMinorGrid && effectiveMinorStep && (
              <>
                <span>·</span>
                <span>Minor: {effectiveMinorStep}</span>
              </>
            )}
          </div>
        </div>

        {/* Verification Control Standard (VCS) Card with Direction in Top-Right Corner */}
        <div className="mt-5 p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Verification Control Standard (VCS)
              </span>
              <span className="text-[10px] font-mono text-slate-400">· {activeKpi.code}</span>
            </div>
            <div className="text-xs text-slate-800 font-semibold mt-0.5">
              Target: <span className="text-emerald-700 font-bold">{activeKpi.target} {activeKpi.unit}</span> | UCL: <span className="text-rose-700 font-bold">{activeKpi.ucl}</span> | LCL: <span className="text-slate-700 font-bold">{activeKpi.lcl}</span> | Center Line X̄: <span className="text-blue-700 font-bold">{stats.mean}</span>
            </div>
          </div>

          {/* Top-Right Corner of VCS: Direction Badge */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold text-xs shadow-2xs ${
                isHigherBetter
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}
            >
              <span className="text-sm font-black">{isHigherBetter ? '↑' : '↓'}</span>
              <span>{isHigherBetter ? 'Higher the better' : 'Lower the better'}</span>
            </span>
          </div>
        </div>

        {/* Interactive SVG Trend & Control Chart with Customizable Axis Major/Minor and Limits */}
        <div className="mt-4 relative bg-slate-50/50 rounded-xl border border-slate-200 p-2 overflow-x-auto">
          {/* Top-Right Corner of Graph: Direction Badge */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-xs text-xs font-bold ${
                isHigherBetter
                  ? 'bg-emerald-50/95 text-emerald-800 border-emerald-300 backdrop-blur-xs'
                  : 'bg-blue-50/95 text-blue-800 border-blue-300 backdrop-blur-xs'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Direction:
              </span>
              <span className="text-base font-black leading-none">{isHigherBetter ? '↑' : '↓'}</span>
              <span>{isHigherBetter ? 'Higher the better' : 'Lower the better'}</span>
            </div>
          </div>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[780px] select-none"
          >
            {/* Shaded In-Control Zone (Between Autopopulated UCL and LCL) */}
            <rect
              x={padding.left}
              y={Math.min(getYCoord(stats.ucl), getYCoord(stats.lcl))}
              width={plotWidth}
              height={Math.max(0, Math.abs(getYCoord(stats.lcl) - getYCoord(stats.ucl)))}
              fill="#f8fafc"
              opacity={0.85}
            />

            {/* Left Axis Line */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1.2"
            />

            {/* Bottom Axis Line */}
            <line
              x1={padding.left}
              y1={chartHeight - padding.bottom}
              x2={chartWidth - padding.right}
              y2={chartHeight - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1.2"
            />

            {/* CUSTOMIZABLE AXIS MAJOR & MINOR GRID LINES */}
            {gridTicks.map((tick, idx) => {
              if (tick.isMajor) {
                return (
                  <g key={`major_${idx}`}>
                    {/* Major Horizontal Grid line */}
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={chartWidth - padding.right}
                      y2={tick.y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    {/* Major Tick on Axis */}
                    <line
                      x1={padding.left - 6}
                      y1={tick.y}
                      x2={padding.left}
                      y2={tick.y}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    {/* Major Axis Numeric Label */}
                    <text
                      x={padding.left - 9}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-slate-600 font-mono font-bold"
                    >
                      {tick.val}
                    </text>
                  </g>
                );
              } else if (showMinorGrid) {
                return (
                  <g key={`minor_${idx}`}>
                    {/* Minor Horizontal Grid line */}
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={chartWidth - padding.right}
                      y2={tick.y}
                      stroke="#e2e8f0"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                      opacity={0.7}
                    />
                    {/* Minor Tick on Axis */}
                    <line
                      x1={padding.left - 3}
                      y1={tick.y}
                      x2={padding.left}
                      y2={tick.y}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                  </g>
                );
              }
              return null;
            })}

            {/* 1. THINNER Upper Control Limit (UCL) Line: Autopopulated based on past data */}
            <line
              x1={padding.left}
              y1={getYCoord(stats.ucl)}
              x2={chartWidth - padding.right}
              y2={getYCoord(stats.ucl)}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={chartWidth - padding.right + 6}
              y={getYCoord(stats.ucl) + 3}
              className="text-[10px] font-medium fill-rose-600 font-mono"
            >
              UCL: {stats.ucl} (+3σ)
            </text>

            {/* 2. THINNER Lower Control Limit (LCL) Line: Autopopulated based on past data */}
            <line
              x1={padding.left}
              y1={getYCoord(stats.lcl)}
              x2={chartWidth - padding.right}
              y2={getYCoord(stats.lcl)}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={chartWidth - padding.right + 6}
              y={getYCoord(stats.lcl) + 3}
              className="text-[10px] font-medium fill-slate-600 font-mono"
            >
              LCL: {stats.lcl} (-3σ)
            </text>

            {/* 3. THINNER Centre Line (X̄): Autopopulated based on past data */}
            <line
              x1={padding.left}
              y1={getYCoord(stats.mean)}
              x2={chartWidth - padding.right}
              y2={getYCoord(stats.mean)}
              stroke="#334155"
              strokeWidth="1"
            />
            <text
              x={chartWidth - padding.right + 6}
              y={getYCoord(stats.mean) + 3}
              className="text-[10px] font-semibold fill-slate-700 font-mono"
            >
              Centre: {stats.mean} (X̄)
            </text>

            {/* 4. BOLDER Target Line: Fixed by Incharge */}
            <line
              x1={padding.left}
              y1={getYCoord(activeKpi.target)}
              x2={chartWidth - padding.right}
              y2={getYCoord(activeKpi.target)}
              stroke="#059669"
              strokeWidth="3.5"
            />
            <text
              x={chartWidth - padding.right + 6}
              y={getYCoord(activeKpi.target) + 3}
              className="text-[11px] font-extrabold fill-emerald-800 font-mono"
            >
              Target: {activeKpi.target} [Incharge]
            </text>

            {/* Actual Trend Line */}
            <path
              d={trendLinePath}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Individual Data Points */}
            {filteredPoints.map((pt, idx) => {
              const x = getXCoord(idx, filteredPoints.length);
              const y = getYCoord(pt.value);
              const isOut = pt.value > stats.ucl || pt.value < stats.lcl;
              const isSelected = hoveredPoint?.id === pt.id;

              return (
                <g key={pt.id} className="cursor-pointer">
                  {/* Point Aura if Out of control */}
                  {isOut && (
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="#fee2e2"
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Point Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={isOut ? '#dc2626' : '#1d4ed8'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* X-axis Label (sampled if dense) */}
                  {(filteredPoints.length <= 25 || idx % Math.ceil(filteredPoints.length / 20) === 0) && (
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 18}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 font-mono select-none"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div className="absolute top-4 left-6 bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs z-10 pointer-events-none border border-slate-700 max-w-xs space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-300">
                  {hoveredPoint.label} ({hoveredPoint.periodType})
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    hoveredPoint.value > stats.ucl || hoveredPoint.value < stats.lcl
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {hoveredPoint.value > stats.ucl || hoveredPoint.value < stats.lcl
                    ? 'Out of Control'
                    : 'In Control'}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                Actual: {hoveredPoint.value} {activeKpi.unit}
              </div>
              <div className="text-[11px] text-slate-300 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                <div>Target (Fixed): <strong className="text-emerald-400">{activeKpi.target}</strong></div>
                <div>Centre Line (X̄): <strong className="text-blue-300">{stats.mean}</strong></div>
                <div>UCL: <strong className="text-rose-400">{stats.ucl}</strong> · LCL: <strong className="text-slate-300">{stats.lcl}</strong></div>
              </div>
              {hoveredPoint.remarks && (
                <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                  <strong>Remark:</strong> {hoveredPoint.remarks}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Actual Reading Inline Form */}
        <form
          onSubmit={handleQuickAddActual}
          className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              + Update Actuals (Real-Time Recalculation of Centre Line, UCL &amp; LCL)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Target Fixed: {activeKpi.target} {activeKpi.unit}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Period / Instance Label
              </label>
              <input
                type="text"
                placeholder={
                  selectedFrequency === 'Instance-based' ? 'e.g. Case #1052' : 'e.g. Oct 06'
                }
                value={quickAddLabel}
                onChange={(e) => setQuickAddLabel(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                Actual Value ({activeKpi.unit})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder={`Target: ${activeKpi.target}`}
                value={quickAddVal}
                onChange={(e) => setQuickAddVal(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-300 rounded bg-white text-blue-900"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Remarks / Observations (Optional)
              </label>
              <input
                type="text"
                placeholder="Shift remarks, reasons for variation, or CAPA"
                value={quickAddRemarks}
                onChange={(e) => setQuickAddRemarks(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save Actual</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Actuals Log Table with In-Place Edit & Delete (Newly updated on Top) */}
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Live Actuals Log ({tablePoints.length} Readings in Selected Window)
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Newly Updated on Top
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Centre Line: {stats.mean} · UCL: {stats.ucl} · LCL: {stats.lcl}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-slate-600 border-b border-slate-200 sticky top-0 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Period / Instance</th>
                  <th className="py-2.5 px-4 text-right">Actual Value</th>
                  <th className="py-2.5 px-4 text-right">Target (Fixed)</th>
                  <th className="py-2.5 px-4 text-right">Centre Line (X̄)</th>
                  <th className="py-2.5 px-4 text-right">Variance vs Target</th>
                  <th className="py-2.5 px-4">Control Status</th>
                  <th className="py-2.5 px-4">Remarks</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tablePoints.map((pt, idx) => {
                  const isOut = pt.value > stats.ucl || pt.value < stats.lcl;
                  const delta = pt.value - activeKpi.target;
                  const isEditingThis = editingPointId === pt.id;

                  return (
                    <tr
                      key={pt.id}
                      className={`hover:bg-slate-50 ${isOut ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="py-2 px-4 font-semibold text-slate-900 font-mono">
                        <div className="flex items-center gap-2">
                          <span>{pt.label}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                              Latest
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actual Value - Editable inline */}
                      <td className="py-2 px-4 text-right font-mono font-bold">
                        {isEditingThis ? (
                          <input
                            type="number"
                            step="any"
                            value={editPointValue}
                            onChange={(e) => setEditPointValue(e.target.value)}
                            className="w-20 px-1 py-0.5 border border-blue-400 rounded text-right bg-white text-xs font-bold"
                          />
                        ) : (
                          <span className="text-slate-900">
                            {pt.value} {activeKpi.unit}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-4 text-right font-mono text-emerald-800 font-bold">
                        {activeKpi.target} {activeKpi.unit}
                      </td>

                      <td className="py-2 px-4 text-right font-mono text-slate-600">
                        {stats.mean}
                      </td>

                      <td
                        className={`py-2 px-4 text-right font-mono font-semibold ${
                          (isHigherBetter && delta < 0) || (!isHigherBetter && delta > 0)
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </td>

                      <td className="py-2 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Out of Control' : 'In Control'}
                        </span>
                      </td>

                      <td className="py-2 px-4 text-slate-600 text-[11px] max-w-xs">
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={editPointRemarks}
                            onChange={(e) => setEditPointRemarks(e.target.value)}
                            className="w-full px-1 py-0.5 border border-blue-400 rounded bg-white text-xs"
                          />
                        ) : (
                          <span className="truncate block">{pt.remarks || '—'}</span>
                        )}
                      </td>

                      <td className="py-2 px-4 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSavePointEdit(pt.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPointId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingPointId(pt.id);
                                setEditPointValue(pt.value.toString());
                                setEditPointRemarks(pt.remarks || '');
                              }}
                              title="Edit Actual"
                              className="p-1 text-slate-400 hover:text-blue-700 rounded hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteControlPoint(pt.id)}
                              title="Delete Reading"
                              className="p-1 text-slate-400 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* MODAL: FIX TARGET LINE (BILLING INCHARGE APPROVAL) */}
      {isInchargeTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveInchargeTarget}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                    Incharge Authority
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Fix Target Line: {activeKpi.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInchargeTargetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Target Line Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                The Target Line represents the fixed departmental performance benchmark authorized by the <strong>Billing Incharge</strong>. The statistical Centre line (X̄), UCL, and LCL will continue to be autopopulated dynamically from actual historical data.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fixed Target Value ({activeKpi.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={inchargeTargetInput}
                  onChange={(e) => setInchargeTargetInput(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-extrabold font-mono px-3 py-2 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-emerald-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Current X̄</span>
                  <span className="font-bold text-slate-900 font-mono">{stats.mean} {activeKpi.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Autopop. UCL</span>
                  <span className="font-bold text-rose-700 font-mono">{stats.ucl} {activeKpi.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Autopop. LCL</span>
                  <span className="font-bold text-slate-700 font-mono">{stats.lcl} {activeKpi.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incharge Authorization Remarks
                </label>
                <textarea
                  rows={2}
                  value={inchargeNotes}
                  onChange={(e) => setInchargeNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInchargeTargetModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Fix &amp; Authorize Target</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
