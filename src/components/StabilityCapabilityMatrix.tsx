import React, { useState, useMemo } from 'react';
import { useDwm } from '../context/DwmContext';
import { KPI, PositionId } from '../types/dwm';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Layers,
} from 'lucide-react';

interface StabilityCapabilityMatrixProps {
  onSelectKpi: (kpiId: string) => void;
}

export interface KpiMatrixEvaluation {
  kpi: KPI;
  kpiNumber: number; // Running number starting from Incharge (1, 2, 3...)
  positionTitle: string;
  positionNumber: number;
  inControlRate: number; // percentage (0 - 100)
  cpk: number;
  isStable: boolean;
  isCapable: boolean;
  quadrant: 'stable_capable' | 'unstable_capable' | 'stable_not_capable' | 'unstable_not_capable';
  mean: number;
  ucl: number;
  lcl: number;
  outOfControlCount: number;
  totalPoints: number;
}

export const StabilityCapabilityMatrix: React.FC<StabilityCapabilityMatrixProps> = ({
  onSelectKpi,
}) => {
  const { positions, kpis, controlPoints, selectedKpiId } = useDwm();

  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [hoveredKpi, setHoveredKpi] = useState<KpiMatrixEvaluation | null>(null);
  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState<string>('all');

  // Compute running KPI numbers starting from Incharge down through all positions and added KPIs
  const kpiNumberMap = useMemo(() => {
    // Sort positions by displayNumber (1: Incharge, 2: Discharge, 3: Cashier, 4: Insurance, 5: OP Billing)
    const sortedPositions = [...positions].sort((a, b) => a.displayNumber - b.displayNumber);
    const map = new Map<string, number>();
    let runningNo = 1;

    sortedPositions.forEach((pos) => {
      const posKpis = kpis.filter((k) => k.positionId === pos.id);
      posKpis.forEach((k) => {
        map.set(k.id, runningNo++);
      });
    });

    // In case there are any leftover KPIs not matched
    kpis.forEach((k) => {
      if (!map.has(k.id)) {
        map.set(k.id, runningNo++);
      }
    });

    return map;
  }, [positions, kpis]);

  // Evaluate Stability & Capability for all KPIs
  const evaluations = useMemo(() => {
    return kpis.map((kpi): KpiMatrixEvaluation => {
      const pos = positions.find((p) => p.id === kpi.positionId) || positions[0];
      const kpiNumber = kpiNumberMap.get(kpi.id) || 1;

      // Gather historical points for this KPI
      let pts = controlPoints.filter((pt) => pt.kpiId === kpi.id);
      if (pts.length === 0) {
        pts = controlPoints.filter((pt) => pt.periodType === 'Daily').slice(-20);
      }

      // Compute Stability
      const ucl = kpi.ucl;
      const lcl = kpi.lcl;
      const totalPoints = pts.length || 1;
      const outOfControlCount = pts.filter((p) => p.value > ucl || p.value < lcl).length;
      const inControlRate = Math.max(0, Math.min(100, ((totalPoints - outOfControlCount) / totalPoints) * 100));

      // Threshold: >= 90% in control is considered Stable
      const isStable = inControlRate >= 90 && outOfControlCount <= 1;

      // Compute Capability (Cpk)
      const values = pts.map((p) => p.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / totalPoints;
      const squareDiffs = values.map((val) => Math.pow(val - mean, 2));
      const variance = squareDiffs.reduce((a, b) => a + b, 0) / (totalPoints || 1);
      const stdDev = Math.sqrt(variance) || 0.01;

      const isHigherBetter = kpi.direction === 'higher_is_better';
      let cpk = 1.33;
      if (isHigherBetter) {
        cpk = Number(((mean - lcl) / (3 * stdDev)).toFixed(2));
      } else {
        cpk = Number(((ucl - mean) / (3 * stdDev)).toFixed(2));
      }
      if (isNaN(cpk) || cpk < 0) cpk = 0.5;

      // Capability standard threshold: Cpk >= 1.15
      const isCapable = cpk >= 1.15;

      // Determine Quadrant
      let quadrant: KpiMatrixEvaluation['quadrant'] = 'stable_capable';
      if (isStable && isCapable) {
        quadrant = 'stable_capable';
      } else if (!isStable && isCapable) {
        quadrant = 'unstable_capable';
      } else if (isStable && !isCapable) {
        quadrant = 'stable_not_capable';
      } else {
        quadrant = 'unstable_not_capable';
      }

      return {
        kpi,
        kpiNumber,
        positionTitle: pos.title,
        positionNumber: pos.displayNumber,
        inControlRate: Number(inControlRate.toFixed(1)),
        cpk,
        isStable,
        isCapable,
        quadrant,
        mean: Number(mean.toFixed(1)),
        ucl: Number(ucl.toFixed(1)),
        lcl: Number(lcl.toFixed(1)),
        outOfControlCount,
        totalPoints,
      };
    });
  }, [kpis, positions, controlPoints, kpiNumberMap]);

  // Filter evaluations by position and quadrant
  const filteredEvaluations = useMemo(() => {
    let list = evaluations;
    if (positionFilter !== 'all') {
      list = list.filter((e) => e.kpi.positionId === positionFilter);
    }
    if (activeQuadrantFilter !== 'all') {
      list = list.filter((e) => e.quadrant === activeQuadrantFilter);
    }
    return list;
  }, [evaluations, positionFilter, activeQuadrantFilter]);

  // Quadrant subsets - Guaranteed 100% inside their respective quadrants
  const q1Items = useMemo(
    () => filteredEvaluations.filter((e) => e.quadrant === 'stable_capable'),
    [filteredEvaluations]
  );
  const q2Items = useMemo(
    () => filteredEvaluations.filter((e) => e.quadrant === 'unstable_capable'),
    [filteredEvaluations]
  );
  const q3Items = useMemo(
    () => filteredEvaluations.filter((e) => e.quadrant === 'stable_not_capable'),
    [filteredEvaluations]
  );
  const q4Items = useMemo(
    () => filteredEvaluations.filter((e) => e.quadrant === 'unstable_not_capable'),
    [filteredEvaluations]
  );

  // Summary counts
  const counts = useMemo(() => {
    return {
      total: evaluations.length,
      stableCapable: evaluations.filter((e) => e.quadrant === 'stable_capable').length,
      unstableCapable: evaluations.filter((e) => e.quadrant === 'unstable_capable').length,
      stableNotCapable: evaluations.filter((e) => e.quadrant === 'stable_not_capable').length,
      unstableNotCapable: evaluations.filter((e) => e.quadrant === 'unstable_not_capable').length,
    };
  }, [evaluations]);

  // 3D Sphere Style definitions per quadrant:
  // Quadrant 1 (Top-Right): Green (Ideal)
  // Quadrant 2 (Top-Left): Orange (Capable but Unstable) - per user instruction
  // Quadrant 3 (Bottom-Right): Blue (Stable but Not Capable) - per user instruction
  // Quadrant 4 (Bottom-Left): Red (Unstable & Not Capable)
  const getBallStyles = (quadrant: KpiMatrixEvaluation['quadrant'], isSelected: boolean) => {
    switch (quadrant) {
      case 'stable_capable':
        return {
          bgGradient:
            'radial-gradient(circle at 30% 30%, #6ee7b7 0%, #10b981 35%, #047857 75%, #064e3b 100%)',
          shadow: isSelected
            ? '0 0 0 2px #ffffff, 0 0 0 4px #10b981, 0 6px 12px rgba(16, 185, 129, 0.7)'
            : '0 4px 8px rgba(4, 120, 87, 0.5), inset -1.5px -1.5px 3px rgba(0,0,0,0.35)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'Stable & Capable (Ideal)',
        };
      case 'unstable_capable':
        // Quadrant 2: ORANGE
        return {
          bgGradient:
            'radial-gradient(circle at 30% 30%, #fed7aa 0%, #fb923c 35%, #ea580c 75%, #9a3412 100%)',
          shadow: isSelected
            ? '0 0 0 2px #ffffff, 0 0 0 4px #ea580c, 0 6px 12px rgba(234, 88, 12, 0.7)'
            : '0 4px 8px rgba(234, 88, 12, 0.5), inset -1.5px -1.5px 3px rgba(0,0,0,0.35)',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
          title: 'Capable but Unstable',
        };
      case 'stable_not_capable':
        // Quadrant 3: BLUE
        return {
          bgGradient:
            'radial-gradient(circle at 30% 30%, #93c5fd 0%, #3b82f6 35%, #1d4ed8 75%, #172554 100%)',
          shadow: isSelected
            ? '0 0 0 2px #ffffff, 0 0 0 4px #3b82f6, 0 6px 12px rgba(59, 130, 246, 0.7)'
            : '0 4px 8px rgba(29, 78, 216, 0.5), inset -1.5px -1.5px 3px rgba(0,0,0,0.35)',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          title: 'Stable but Not Capable',
        };
      case 'unstable_not_capable':
        // Quadrant 4: RED
        return {
          bgGradient:
            'radial-gradient(circle at 30% 30%, #fca5a5 0%, #ef4444 35%, #b91c1c 75%, #450a0a 100%)',
          shadow: isSelected
            ? '0 0 0 2px #ffffff, 0 0 0 4px #ef4444, 0 6px 12px rgba(239, 68, 68, 0.7)'
            : '0 4px 8px rgba(185, 28, 28, 0.5), inset -1.5px -1.5px 3px rgba(0,0,0,0.35)',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
          title: 'Unstable & Not Capable',
        };
    }
  };

  // Reusable 3D Sphere Renderer (Compact 32px diameter with single running KPI number)
  const renderBall = (item: KpiMatrixEvaluation) => {
    const isSelected = selectedKpiId === item.kpi.id;
    const isHovered = hoveredKpi?.kpi.id === item.kpi.id;
    const styles = getBallStyles(item.quadrant, isSelected);

    return (
      <div
        key={item.kpi.id}
        onClick={() => onSelectKpi(item.kpi.id)}
        onMouseEnter={() => setHoveredKpi(item)}
        onMouseLeave={() => setHoveredKpi(null)}
        className={`cursor-pointer transition-transform duration-150 relative ${
          isHovered || isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-20'
        }`}
      >
        <div className="relative group/ball">
          <div
            style={{
              background: styles.bgGradient,
              boxShadow: styles.shadow,
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white relative transition-all"
          >
            {/* Glossy Spherical Highlight Reflection */}
            <div
              className="absolute top-0.5 left-1 w-2.5 h-1.5 rounded-full bg-white/80 pointer-events-none"
              style={{
                transform: 'rotate(-25deg)',
                filter: 'blur(0.4px)',
              }}
            />

            {/* Single Running KPI Number on Ball Face (1, 2, 3...) */}
            <span className="text-[12px] font-black text-white font-mono select-none drop-shadow-md leading-none">
              {item.kpiNumber}
            </span>
          </div>

          {/* Pulsing Aura if selected */}
          {isSelected && (
            <div className="absolute -inset-1 rounded-full border-2 border-indigo-600 animate-ping opacity-45 pointer-events-none" />
          )}

          {/* Micro tooltip on hover showing KPI Code */}
          <div className="opacity-0 group-hover/ball:opacity-100 transition-opacity absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none border border-slate-200 z-50">
            #{item.kpiNumber} {item.kpi.code}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Title & Description Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Process Quality Diagnostic Framework</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Stability vs. Capability 2×2 Matrix</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Interactive SPC Diagnostic
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Diagnoses hospital billing KPIs along two core dimensions: <strong>Statistical Stability</strong> (% readings within control limits) vs. <strong>Process Capability (Cpk)</strong> (meeting defined hospital targets). All balls are securely placed <strong>inside their designated quadrant</strong> with their <strong>KPI Running No. (#1 onwards from Incharge)</strong>.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All 5 Positions ({evaluations.length} KPIs)</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.displayNumber}. {pos.shortTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Counters for each of the 4 Quadrants */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Quadrant I: Stable & Capable (Green) */}
        <button
          onClick={() =>
            setActiveQuadrantFilter(
              activeQuadrantFilter === 'stable_capable' ? 'all' : 'stable_capable'
            )
          }
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeQuadrantFilter === 'stable_capable'
              ? 'bg-emerald-100/90 border-emerald-500 shadow-sm'
              : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase">
              Q1: Stable &amp; Capable
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
            {counts.stableCapable} <span className="text-xs font-normal text-emerald-700">KPIs</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
            Green Balls · Top-Right Corner
          </span>
        </button>

        {/* Quadrant II: Capable but Unstable (ORANGE) */}
        <button
          onClick={() =>
            setActiveQuadrantFilter(
              activeQuadrantFilter === 'unstable_capable' ? 'all' : 'unstable_capable'
            )
          }
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeQuadrantFilter === 'unstable_capable'
              ? 'bg-orange-100/90 border-orange-500 shadow-sm'
              : 'bg-orange-50/70 border-orange-200 hover:bg-orange-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-900 uppercase">
              Q2: Capable / Unstable
            </span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-800 font-mono mt-1">
            {counts.unstableCapable} <span className="text-xs font-normal text-orange-700">KPIs</span>
          </div>
          <span className="text-[10px] text-orange-700 font-medium block mt-0.5">
            Orange Balls · Top-Left
          </span>
        </button>

        {/* Quadrant III: Stable but Not Capable (BLUE) */}
        <button
          onClick={() =>
            setActiveQuadrantFilter(
              activeQuadrantFilter === 'stable_not_capable' ? 'all' : 'stable_not_capable'
            )
          }
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeQuadrantFilter === 'stable_not_capable'
              ? 'bg-blue-100/90 border-blue-500 shadow-sm'
              : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase">
              Q3: Stable / Not Capable
            </span>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono mt-1">
            {counts.stableNotCapable} <span className="text-xs font-normal text-blue-700">KPIs</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
            Blue Balls · Bottom-Right
          </span>
        </button>

        {/* Quadrant IV: Unstable & Not Capable (RED) */}
        <button
          onClick={() =>
            setActiveQuadrantFilter(
              activeQuadrantFilter === 'unstable_not_capable' ? 'all' : 'unstable_not_capable'
            )
          }
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeQuadrantFilter === 'unstable_not_capable'
              ? 'bg-rose-100/90 border-rose-500 shadow-sm'
              : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase">
              Q4: Unstable &amp; Not Capable
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800 font-mono mt-1">
            {counts.unstableNotCapable} <span className="text-xs font-normal text-rose-700">KPIs</span>
          </div>
          <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
            Red Balls · Bottom-Left
          </span>
        </button>
      </div>

      {/* THE 2X2 STABILITY VS CAPABILITY MATRIX CANVAS */}
      <div className="relative border-2 border-slate-300 rounded-2xl bg-white overflow-hidden shadow-xs">
        {/* Outer Axis Labels */}
        {/* Vertical Axis (Capability) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-xs font-black uppercase tracking-widest text-slate-500 z-10 pointer-events-none whitespace-nowrap">
          &larr; Process Capability (Cpk) &rarr;
        </div>

        {/* Horizontal Axis (Stability) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-widest text-slate-500 z-10 pointer-events-none whitespace-nowrap">
          &larr; Statistical Stability (% In-Control) &rarr;
        </div>

        {/* Matrix Container: 4 Distinct Quadrants containing their balls 100% inside */}
        <div className="relative w-full min-h-[520px] p-8 sm:p-12">
          {/* Background Grid Quadrants */}
          <div className="w-full h-full min-h-[460px] grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden border border-slate-300">
            {/* Quadrant II: Top-Left (Unstable but Capable) - ORANGE THEME */}
            <div className="bg-orange-50/40 p-4 border-r border-b border-slate-300 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-extrabold text-orange-950 uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border border-orange-200 shadow-2xs">
                  Quadrant II: Capable · Unstable (Orange)
                </span>
                <span className="text-[10px] text-orange-800 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
                  {q2Items.length} KPIs
                </span>
              </div>

              {/* BALLS INSIDE QUADRANT II */}
              <div className="my-3 flex-1 flex flex-wrap gap-2.5 items-center justify-start p-2 rounded-lg bg-orange-100/20 border border-orange-200/40">
                {q2Items.length > 0 ? (
                  q2Items.map((item) => renderBall(item))
                ) : (
                  <span className="text-[11px] text-orange-400 italic">No KPIs in this quadrant</span>
                )}
              </div>

              <div className="text-[11px] text-orange-900/80 italic z-10 leading-snug">
                Process meets targets but suffers from special causes. Action: Root-cause analysis.
              </div>
            </div>

            {/* Quadrant I: Top-Right (STABLE & CAPABLE - IDEAL BENCHMARK) - GREEN THEME */}
            <div className="bg-emerald-50/50 p-4 border-b border-slate-300 flex flex-col justify-between relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider bg-white/95 px-2.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                    Quadrant I: Stable &amp; Capable (Green)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  {q1Items.length} KPIs
                </span>
              </div>

              {/* BALLS CLUSTERED AT TOP-RIGHT CORNER INSIDE QUADRANT I */}
              <div className="my-3 flex-1 flex flex-col items-end justify-start pr-1 pt-1">
                <div className="flex flex-wrap gap-2.5 max-w-[240px] justify-end p-2 rounded-xl bg-emerald-100/40 border border-emerald-200/60 shadow-2xs">
                  {q1Items.length > 0 ? (
                    q1Items.map((item) => renderBall(item))
                  ) : (
                    <span className="text-[11px] text-emerald-600 italic">No KPIs</span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-emerald-900/90 font-medium italic z-10 text-right leading-snug">
                ★ Ideal Process Performance: Predictable &amp; meeting targets. Action: Standardize routines.
              </div>
            </div>

            {/* Quadrant IV: Bottom-Left (Unstable & Not Capable - Critical) - RED THEME */}
            <div className="bg-rose-50/40 p-4 border-r border-slate-300 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-extrabold text-rose-950 uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
                  Quadrant IV: Unstable · Not Capable (Red)
                </span>
                <span className="text-[10px] text-rose-800 font-semibold bg-rose-100 px-2 py-0.5 rounded-full">
                  {q4Items.length} KPIs
                </span>
              </div>

              {/* BALLS INSIDE QUADRANT IV */}
              <div className="my-3 flex-1 flex flex-wrap gap-2.5 items-center justify-start p-2 rounded-lg bg-rose-100/20 border border-rose-200/40">
                {q4Items.length > 0 ? (
                  q4Items.map((item) => renderBall(item))
                ) : (
                  <span className="text-[11px] text-rose-400 italic">No KPIs in this quadrant</span>
                )}
              </div>

              <div className="text-[11px] text-rose-800/80 italic z-10 leading-snug">
                Process in severe variation &amp; missing target. Action: Immediate containment &amp; Kaizen CAPA.
              </div>
            </div>

            {/* Quadrant III: Bottom-Right (Stable but Not Capable) - BLUE THEME */}
            <div className="bg-blue-50/40 p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                  Quadrant III: Stable · Not Capable (Blue)
                </span>
                <span className="text-[10px] text-blue-800 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                  {q3Items.length} KPIs
                </span>
              </div>

              {/* BALLS INSIDE QUADRANT III */}
              <div className="my-3 flex-1 flex flex-wrap gap-2.5 items-center justify-start p-2 rounded-lg bg-blue-100/20 border border-blue-200/40">
                {q3Items.length > 0 ? (
                  q3Items.map((item) => renderBall(item))
                ) : (
                  <span className="text-[11px] text-blue-400 italic">No KPIs in this quadrant</span>
                )}
              </div>

              <div className="text-[11px] text-blue-900/80 italic z-10 text-right leading-snug">
                Predictable, but missing targets. Action: Shift process mean &amp; reduce common causes.
              </div>
            </div>
          </div>

          {/* Central Crossing Dividing Axes */}
          <div className="absolute left-1/2 top-8 sm:top-12 bottom-8 sm:bottom-12 w-[2px] bg-slate-400 -translate-x-1/2 pointer-events-none z-30" />
          <div className="absolute top-1/2 left-8 sm:left-12 right-8 sm:right-12 h-[2px] bg-slate-400 -translate-y-1/2 pointer-events-none z-30" />

          {/* Center Target Crosshair Emblem */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-slate-400 rounded-full w-6 h-6 flex items-center justify-center z-30 text-[10px] font-bold text-slate-500 shadow-xs">
            +
          </div>
        </div>

        {/* Hovered Ball Detailed Tooltip Card */}
        {hoveredKpi && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-700 max-w-sm pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center font-mono">
                  {hoveredKpi.kpiNumber}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Position {hoveredKpi.positionNumber}: {hoveredKpi.positionTitle}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {hoveredKpi.kpi.code} – {hoveredKpi.kpi.name}
                  </h4>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                  hoveredKpi.quadrant === 'stable_capable'
                    ? 'bg-emerald-500 text-white'
                    : hoveredKpi.quadrant === 'unstable_capable'
                    ? 'bg-orange-500 text-white'
                    : hoveredKpi.quadrant === 'stable_not_capable'
                    ? 'bg-blue-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {hoveredKpi.quadrant === 'stable_capable'
                  ? 'Q1: Stable & Capable'
                  : hoveredKpi.quadrant === 'unstable_capable'
                  ? 'Q2: Capable / Unstable'
                  : hoveredKpi.quadrant === 'stable_not_capable'
                  ? 'Q3: Stable / Not Capable'
                  : 'Q4: Unstable / Not Capable'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2 bg-slate-800/80 p-2 rounded-lg">
              <div>
                <span className="text-[10px] text-slate-400 block">Stability (In-Control):</span>
                <strong className={hoveredKpi.isStable ? 'text-emerald-400' : 'text-rose-400'}>
                  {hoveredKpi.inControlRate}% ({hoveredKpi.isStable ? 'Stable' : 'Unstable'})
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Capability (Cpk):</span>
                <strong className={hoveredKpi.isCapable ? 'text-emerald-400' : 'text-amber-400'}>
                  {hoveredKpi.cpk} ({hoveredKpi.isCapable ? 'Capable' : 'Not Capable'})
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Current Mean X̄:</span>
                <span className="text-white">
                  {hoveredKpi.mean} {hoveredKpi.kpi.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target:</span>
                <span className="text-emerald-300 font-bold">
                  {hoveredKpi.kpi.target} {hoveredKpi.kpi.unit}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
              <strong className="text-indigo-300">Action: </strong>
              {hoveredKpi.quadrant === 'stable_capable' &&
                'Maintain current standard work, audit frequency, and standard operating routines.'}
              {hoveredKpi.quadrant === 'unstable_capable' &&
                'Investigate special causes, eliminate systemic process spikes and portal delays.'}
              {hoveredKpi.quadrant === 'stable_not_capable' &&
                'Process is predictable but baseline needs re-engineering to reach benchmark target.'}
              {hoveredKpi.quadrant === 'unstable_not_capable' &&
                'High priority intervention required. Form Kaizen CAPA team to re-establish control.'}
            </div>

            <div className="mt-2 text-[10px] text-slate-400 italic text-right">
              Click ball to open control chart &rarr;
            </div>
          </div>
        )}
      </div>

      {/* MATRIX AUDIT & ACTION REGISTER TABLE WITH RUNNING KPI NUMBER COLUMN */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              KPI Stability &amp; Capability Diagnostic Register ({filteredEvaluations.length} KPIs)
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              Running No. starting from Incharge (#1) to last KPI
            </span>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-600 border-b border-slate-200 sticky top-0 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center">KPI #</th>
                <th className="py-2.5 px-4">KPI Code &amp; Title</th>
                <th className="py-2.5 px-4">Position</th>
                <th className="py-2.5 px-4 text-center">Stability</th>
                <th className="py-2.5 px-4 text-center">In-Control %</th>
                <th className="py-2.5 px-4 text-center">Cpk</th>
                <th className="py-2.5 px-4 text-center">Capability</th>
                <th className="py-2.5 px-4">Quadrant Classification</th>
                <th className="py-2.5 px-4">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.map((item) => {
                const isSelected = selectedKpiId === item.kpi.id;

                return (
                  <tr
                    key={item.kpi.id}
                    onClick={() => onSelectKpi(item.kpi.id)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70 font-semibold' : ''
                    }`}
                  >
                    {/* Running KPI Number Pill */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <div
                          style={{
                            background: getBallStyles(item.quadrant, false).bgGradient,
                          }}
                          className="w-5 h-5 rounded-full text-white font-black text-[10px] font-mono flex items-center justify-center shadow-xs"
                        >
                          {item.kpiNumber}
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-4">
                      <div>
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {item.kpi.code}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate max-w-xs">
                          {item.kpi.name}
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-4 text-slate-600 text-[11px]">
                      P{item.positionNumber}. {item.positionTitle}
                    </td>

                    <td className="py-2 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isStable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {item.isStable ? 'Stable' : 'Unstable'}
                      </span>
                    </td>

                    <td className="py-2 px-4 text-center font-mono font-bold text-slate-800">
                      {item.inControlRate}%
                    </td>

                    <td className="py-2 px-4 text-center font-mono font-bold text-slate-800">
                      {item.cpk}
                    </td>

                    <td className="py-2 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isCapable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.isCapable ? 'Capable' : 'Not Capable'}
                      </span>
                    </td>

                    <td className="py-2 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          item.quadrant === 'stable_capable'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.quadrant === 'unstable_capable'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : item.quadrant === 'stable_not_capable'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {item.quadrant === 'stable_capable'
                          ? 'Q1: Stable & Capable'
                          : item.quadrant === 'unstable_capable'
                          ? 'Q2: Capable / Unstable'
                          : item.quadrant === 'stable_not_capable'
                          ? 'Q3: Stable / Not Capable'
                          : 'Q4: Unstable / Not Capable'}
                      </span>
                    </td>

                    <td className="py-2 px-4 text-slate-600 text-[11px]">
                      {item.quadrant === 'stable_capable' && 'Maintain Standard Routine'}
                      {item.quadrant === 'unstable_capable' && 'Eliminate Special Causes'}
                      {item.quadrant === 'stable_not_capable' && 'Shift Process Mean Target'}
                      {item.quadrant === 'unstable_not_capable' && 'Execute Kaizen CAPA Action'}
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
