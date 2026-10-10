import React, { useState } from 'react';
import { useDwm } from '../context/DwmContext';
import { PositionId, KPI, FrequencyType } from '../types/dwm';
import {
  GitFork,
  Move,
  ArrowRight,
  Plus,
  Edit3,
  Trash2,
  LineChart,
  FileSpreadsheet,
  Search,
  TrendingUp,
  TrendingDown,
  X,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const KpiTreeView: React.FC = () => {
  const {
    department,
    positions,
    kpis,
    reassignKpiPosition,
    updateKpi,
    addKpi,
    deleteKpi,
    navigateToPositionRoleSheet,
    navigateToControlGraphForKpi,
    setControlGraphFrequency,
  } = useDwm();

  const [draggedKpiId, setDraggedKpiId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('all');

  // Edit KPI modal
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);

  // Add Child KPI modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addUnderParentKpiId, setAddUnderParentKpiId] = useState<string | null>(null);
  const [addForPositionId, setAddForPositionId] = useState<PositionId>('billing_supervisor');
  const [newKpiName, setNewKpiName] = useState('');
  const [newKpiCode, setNewKpiCode] = useState('');
  const [newKpiDesc, setNewKpiDesc] = useState('');
  const [newKpiPriority, setNewKpiPriority] = useState<'Critical' | 'High-Priority'>('Critical');
  const [newKpiTarget, setNewKpiTarget] = useState<number>(60);
  const [newKpiUcl, setNewKpiUcl] = useState<number>(85);
  const [newKpiLcl, setNewKpiLcl] = useState<number>(35);
  const [newKpiUnit, setNewKpiUnit] = useState('mins');
  const [newKpiDirection, setNewKpiDirection] = useState<'lower_is_better' | 'higher_is_better'>('lower_is_better');
  const [newKpiFreq, setNewKpiFreq] = useState<FrequencyType>('Daily');

  // Categorize KPIs by Hierarchy Level:
  // Level 1: Billing Incharge KPIs (Parent KPIs)
  const inchargeKpis = kpis.filter(
    (k) =>
      k.positionId === 'billing_incharge' &&
      (searchQuery === '' ||
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Level 2: Billing Supervisor KPIs (Child of Incharge, or Parent to Functional)
  const supervisorKpis = kpis.filter(
    (k) =>
      k.positionId === 'billing_supervisor' &&
      (searchQuery === '' ||
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Level 3: Functional Teams KPIs (Cash, Insurance, Ward)
  const functionalKpis = kpis.filter(
    (k) =>
      k.positionId !== 'billing_incharge' &&
      k.positionId !== 'billing_supervisor' &&
      (searchQuery === '' ||
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper to open Add Child modal
  const openAddChildModal = (parentKpi: KPI, targetPosition?: PositionId) => {
    setAddUnderParentKpiId(parentKpi.id);
    if (targetPosition) {
      setAddForPositionId(targetPosition);
    } else if (parentKpi.positionId === 'billing_incharge') {
      setAddForPositionId('billing_supervisor');
    } else {
      setAddForPositionId('bill_closure_cash');
    }
    setNewKpiName('');
    setNewKpiCode('');
    setNewKpiDesc('');
    setNewKpiTarget(parentKpi.target);
    setNewKpiUcl(parentKpi.ucl);
    setNewKpiLcl(parentKpi.lcl);
    setNewKpiUnit(parentKpi.unit);
    setNewKpiDirection(parentKpi.direction);
    setNewKpiFreq(parentKpi.measurementFrequency);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiName.trim()) return;

    addKpi({
      code: newKpiCode.trim() || `KPI-${Math.floor(100 + Math.random() * 900)}`,
      name: newKpiName.trim(),
      description: newKpiDesc.trim() || 'Process KPI linked to parent objective',
      positionId: addForPositionId,
      priority: newKpiPriority,
      target: Number(newKpiTarget),
      ucl: Number(newKpiUcl),
      lcl: Number(newKpiLcl),
      centerLine: Number(newKpiTarget),
      unit: newKpiUnit.trim() || 'units',
      direction: newKpiDirection,
      measurementFrequency: newKpiFreq,
      calculationMethod: 'HIS logged daily audit parameters',
      parentKpiId: addUnderParentKpiId || null,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKpi) return;

    updateKpi(editingKpi.id, {
      code: editingKpi.code,
      name: editingKpi.name,
      description: editingKpi.description,
      priority: editingKpi.priority,
      target: Number(editingKpi.target),
      ucl: Number(editingKpi.ucl),
      lcl: Number(editingKpi.lcl),
      centerLine: Number(editingKpi.centerLine ?? editingKpi.target),
      unit: editingKpi.unit,
      direction: editingKpi.direction,
      measurementFrequency: editingKpi.measurementFrequency,
      positionId: editingKpi.positionId,
      parentKpiId: editingKpi.parentKpiId || null,
    });

    setEditingKpi(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, kpiId: string) => {
    e.dataTransfer.setData('text/plain', kpiId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedKpiId(kpiId);
  };

  const handleDragEnd = () => {
    setDraggedKpiId(null);
    setDragOverTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTargetId !== targetId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDropOnParent = (e: React.DragEvent, parentKpi: KPI) => {
    e.preventDefault();
    const sourceKpiId = e.dataTransfer.getData('text/plain') || draggedKpiId;
    if (sourceKpiId && sourceKpiId !== parentKpi.id) {
      const sourceKpi = kpis.find((k) => k.id === sourceKpiId);
      if (sourceKpi) {
        // Update parent linkage while keeping or shifting appropriate position
        let targetPos = sourceKpi.positionId;
        if (parentKpi.positionId === 'billing_incharge' && sourceKpi.positionId === 'billing_incharge') {
          targetPos = 'billing_supervisor';
        }
        reassignKpiPosition(sourceKpiId, targetPos, parentKpi.id);
      }
    }
    setDraggedKpiId(null);
    setDragOverTargetId(null);
  };

  const handleDropOnPosition = (e: React.DragEvent, targetPosId: PositionId) => {
    e.preventDefault();
    const sourceKpiId = e.dataTransfer.getData('text/plain') || draggedKpiId;
    if (sourceKpiId) {
      reassignKpiPosition(sourceKpiId, targetPosId);
    }
    setDraggedKpiId(null);
    setDragOverTargetId(null);
  };

  // Render a KPI node card in the Left-to-Right tree
  const renderKpiCard = (kpi: KPI, isChild = false) => {
    const isCritical = kpi.priority === 'Critical';
    const isHigherBetter = kpi.direction === 'higher_is_better';
    const isDragOver = dragOverTargetId === kpi.id;
    const isBeingDragged = draggedKpiId === kpi.id;
    const pos = positions.find((p) => p.id === kpi.positionId);
    const parentKpi = kpis.find((p) => p.id === kpi.parentKpiId);

    return (
      <div
        key={kpi.id}
        draggable
        onDragStart={(e) => handleDragStart(e, kpi.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, kpi.id)}
        onDrop={(e) => handleDropOnParent(e, kpi)}
        className={`bg-white border rounded-xl p-4 transition-all relative shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing ${
          isBeingDragged
            ? 'opacity-40 scale-95 border-blue-500'
            : isDragOver
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50'
            : isCritical
            ? 'border-rose-200 hover:border-rose-400'
            : 'border-slate-200 hover:border-blue-400'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div
              title="Drag to reassign parent or position"
              className="mt-0.5 text-slate-400 hover:text-slate-700 cursor-grab"
            >
              <Move className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                <span className="font-mono text-slate-500 font-bold">
                  {kpi.code}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-semibold ${
                    isCritical ? 'text-rose-700' : 'text-blue-700'
                  }`}
                >
                  {kpi.priority}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {kpi.measurementFrequency}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 leading-tight">
                {kpi.name}
              </h5>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setControlGraphFrequency(kpi.measurementFrequency);
                navigateToControlGraphForKpi(kpi.id, kpi.positionId);
              }}
              title="Open Control Graph"
              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditingKpi(kpi)}
              title="Edit KPI Limits &amp; Role Sheet"
              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openAddChildModal(kpi)}
              title="Add Child KPI under this node"
              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteKpi(kpi.id)}
              title="Delete KPI"
              className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
          {kpi.description}
        </p>

        {/* Direction & Parent link */}
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-semibold ${
              isHigherBetter
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-blue-50 text-blue-800'
            }`}
          >
            {isHigherBetter ? (
              <>
                <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                <span>Higher the better (&uarr;)</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-2.5 h-2.5 text-blue-600" />
                <span>Lower the better (&darr;)</span>
              </>
            )}
          </span>

          <span className="font-mono text-slate-400 font-medium">
            {pos?.shortTitle}
          </span>
        </div>

        {/* Statistical Control Limits Strip */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span className="font-semibold text-emerald-700">
            Target: {kpi.target} {kpi.unit}
          </span>
          <span className="text-slate-400">
            UCL: {kpi.ucl} · LCL: {kpi.lcl}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Left-to-Right Hierarchy Instruction */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <GitFork className="w-3.5 h-3.5" />
              <span>Hierarchical Parent-Child KPI Flow (Left &rarr; Right)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Billing Strategic Objective &rarr; Parent KPIs &rarr; Child KPIs
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Flows from left to right: Department Objective &rarr; Billing Incharge Parent KPIs &rarr; Billing Supervisor Child KPIs &rarr; Functional Team Child KPIs. Drag cards or edit limits; changes update the Role Sheets and Control Graphs in real time.
            </p>
          </div>

          {/* Quick Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search KPI tree..."
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>

            <button
              onClick={() => {
                setAddUnderParentKpiId(inchargeKpis[0]?.id || null);
                setAddForPositionId('billing_incharge');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add KPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* LEFT-TO-RIGHT 4-COLUMN HIERARCHICAL KPI TREE CANVAS */}
      <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-6 overflow-x-auto min-h-[600px]">
        <div className="grid grid-cols-4 gap-6 min-w-[1100px]">
          {/* COLUMN 1: ROOT DEPARTMENT STRATEGIC OBJECTIVE */}
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 sticky top-20">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Level 0 · Department Objective</span>
              </div>
              <h3 className="text-sm font-bold">{department.title}</h3>
              <p className="text-xs text-slate-300 mt-2 font-medium italic leading-relaxed">
                &ldquo;{department.objectiveText}&rdquo;
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>9 Total Manpower</span>
                <span>5 Positions</span>
              </div>
              <div className="mt-4 p-2 bg-slate-800/80 rounded-lg text-[11px] text-blue-200 flex items-center justify-between">
                <span>Flows into Incharge KPIs &rarr;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* COLUMN 2: BILLING INCHARGE (PARENT KPIS) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'billing_incharge')}
            onDrop={(e) => handleDropOnPosition(e, 'billing_incharge')}
            className="space-y-3"
          >
            <div className="bg-blue-700 text-white p-3 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
                  Level 1 · Parent KPIs
                </div>
                <h4 className="text-sm font-bold">1. BILLING INCHARGE</h4>
              </div>
              <button
                onClick={() => navigateToPositionRoleSheet('billing_incharge')}
                title="View Role Sheet"
                className="p-1 bg-blue-800 hover:bg-blue-900 text-white rounded"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {inchargeKpis.map((kpi) => renderKpiCard(kpi))}
            </div>
          </div>

          {/* COLUMN 3: BILLING SUPERVISOR (CHILD / MID-TIER KPIS) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'billing_supervisor')}
            onDrop={(e) => handleDropOnPosition(e, 'billing_supervisor')}
            className="space-y-3"
          >
            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
                  Level 2 · Supervisory Child KPIs
                </div>
                <h4 className="text-sm font-bold">2. BILLING SUPERVISOR</h4>
              </div>
              <button
                onClick={() => navigateToPositionRoleSheet('billing_supervisor')}
                title="View Role Sheet"
                className="p-1 bg-blue-700 hover:bg-blue-800 text-white rounded"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {supervisorKpis.map((kpi) => renderKpiCard(kpi, true))}
            </div>
          </div>

          {/* COLUMN 4: FUNCTIONAL BILLING TEAMS (CHILD KPIS: CASH, INSURANCE, WARD) */}
          <div className="space-y-4">
            <div className="bg-teal-700 text-white p-3 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-wider uppercase font-semibold text-teal-200">
                  Level 3 · Functional Desk Child KPIs
                </div>
                <h4 className="text-sm font-bold">DESK OPERATIONS</h4>
              </div>
              <span className="text-[11px] font-mono text-teal-200">
                Cash · Ins · Ward
              </span>
            </div>

            {/* Split into Functional Desks */}
            <div className="space-y-4">
              {/* Cash Desk */}
              <div
                onDragOver={(e) => handleDragOver(e, 'bill_closure_cash')}
                onDrop={(e) => handleDropOnPosition(e, 'bill_closure_cash')}
                className="bg-white/80 border border-teal-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between pb-1 border-b border-teal-100">
                  <span className="text-xs font-bold text-teal-900">
                    4. Bill Closure – Cash
                  </span>
                  <button
                    onClick={() => navigateToPositionRoleSheet('bill_closure_cash')}
                    className="text-[10px] text-teal-700 hover:underline font-semibold"
                  >
                    Role Sheet
                  </button>
                </div>
                <div className="space-y-2">
                  {functionalKpis
                    .filter((k) => k.positionId === 'bill_closure_cash')
                    .map((kpi) => renderKpiCard(kpi, true))}
                </div>
              </div>

              {/* Insurance Desk */}
              <div
                onDragOver={(e) => handleDragOver(e, 'insurance_coordinator')}
                onDrop={(e) => handleDropOnPosition(e, 'insurance_coordinator')}
                className="bg-white/80 border border-teal-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between pb-1 border-b border-teal-100">
                  <span className="text-xs font-bold text-teal-900">
                    5. Insurance Coordinator
                  </span>
                  <button
                    onClick={() => navigateToPositionRoleSheet('insurance_coordinator')}
                    className="text-[10px] text-teal-700 hover:underline font-semibold"
                  >
                    Role Sheet
                  </button>
                </div>
                <div className="space-y-2">
                  {functionalKpis
                    .filter((k) => k.positionId === 'insurance_coordinator')
                    .map((kpi) => renderKpiCard(kpi, true))}
                </div>
              </div>

              {/* Ward Coordinator Desk */}
              <div
                onDragOver={(e) => handleDragOver(e, 'ward_coordinator')}
                onDrop={(e) => handleDropOnPosition(e, 'ward_coordinator')}
                className="bg-white/80 border border-teal-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between pb-1 border-b border-teal-100">
                  <span className="text-xs font-bold text-teal-900">
                    7. Ward Coordinator
                  </span>
                  <button
                    onClick={() => navigateToPositionRoleSheet('ward_coordinator')}
                    className="text-[10px] text-teal-700 hover:underline font-semibold"
                  >
                    Role Sheet
                  </button>
                </div>
                <div className="space-y-2">
                  {functionalKpis
                    .filter((k) => k.positionId === 'ward_coordinator')
                    .map((kpi) => renderKpiCard(kpi, true))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit KPI Modal */}
      {editingKpi && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  KPI Tree Node Editor
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Edit KPI &amp; Sync Role Sheet: {editingKpi.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KPI Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingKpi.name}
                    onChange={(e) => setEditingKpi({ ...editingKpi, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingKpi.code}
                    onChange={(e) => setEditingKpi({ ...editingKpi, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingKpi.description}
                  onChange={(e) => setEditingKpi({ ...editingKpi, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Statistical Limits */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1 uppercase">
                    Target
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingKpi.target}
                    onChange={(e) => setEditingKpi({ ...editingKpi, target: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1 uppercase">
                    UCL (+3σ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingKpi.ucl}
                    onChange={(e) => setEditingKpi({ ...editingKpi, ucl: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase">
                    LCL (-3σ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingKpi.lcl}
                    onChange={(e) => setEditingKpi({ ...editingKpi, lcl: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editingKpi.unit}
                    onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Direction & Cadence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direction
                  </label>
                  <select
                    value={editingKpi.direction}
                    onChange={(e) => setEditingKpi({ ...editingKpi, direction: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="lower_is_better">Lower the better (&darr;)</option>
                    <option value="higher_is_better">Higher the better (&uarr;)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measurement Cadence
                  </label>
                  <select
                    value={editingKpi.measurementFrequency}
                    onChange={(e) => setEditingKpi({ ...editingKpi, measurementFrequency: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Instance-based">Instance-based</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Position Accountability
                  </label>
                  <select
                    value={editingKpi.positionId}
                    onChange={(e) => setEditingKpi({ ...editingKpi, positionId: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayNumber}. {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent KPI Link
                  </label>
                  <select
                    value={editingKpi.parentKpiId || ''}
                    onChange={(e) => setEditingKpi({ ...editingKpi, parentKpiId: e.target.value || null })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">None (Root Department Objective)</option>
                    {kpis
                      .filter((k) => k.id !== editingKpi.id)
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.code} – {k.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Update KPI &amp; Sync Role Sheet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Child KPI Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Add Child KPI
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  New KPI under Parent Hierarchy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KPI Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bedside Consumable Verification Speed"
                    value={newKpiName}
                    onChange={(e) => setNewKpiName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BIL-KPI-22"
                    value={newKpiCode}
                    onChange={(e) => setNewKpiCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Measurement scope and operational goal."
                  value={newKpiDesc}
                  onChange={(e) => setNewKpiDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Statistical Limits */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1 uppercase">
                    Target
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newKpiTarget}
                    onChange={(e) => setNewKpiTarget(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1 uppercase">
                    UCL (+3σ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newKpiUcl}
                    onChange={(e) => setNewKpiUcl(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase">
                    LCL (-3σ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newKpiLcl}
                    onChange={(e) => setNewKpiLcl(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newKpiUnit}
                    onChange={(e) => setNewKpiUnit(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Direction & Cadence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direction
                  </label>
                  <select
                    value={newKpiDirection}
                    onChange={(e) => setNewKpiDirection(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="lower_is_better">Lower the better (&darr;)</option>
                    <option value="higher_is_better">Higher the better (&uarr;)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measurement Cadence
                  </label>
                  <select
                    value={newKpiFreq}
                    onChange={(e) => setNewKpiFreq(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Instance-based">Instance-based</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Position
                  </label>
                  <select
                    value={addForPositionId}
                    onChange={(e) => setAddForPositionId(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayNumber}. {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent KPI Link
                  </label>
                  <select
                    value={addUnderParentKpiId || ''}
                    onChange={(e) => setAddUnderParentKpiId(e.target.value || null)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">None (Top-Level Department Objective)</option>
                    {kpis.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.code} – {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Add Child KPI to Tree &amp; Role Sheet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
