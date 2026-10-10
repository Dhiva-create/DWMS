import React, { useState, useMemo } from 'react';
import { useDwm } from '../context/DwmContext';
import { PositionId, RoleSheetEntry } from '../types/dwm';
import {
  Plus,
  Edit3,
  Trash2,
  LineChart,
  Download,
  Search,
  Filter,
  X,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const RoleSheetView: React.FC = () => {
  const {
    department,
    positions,
    selectedPositionId,
    setSelectedPositionId,
    roleSheetEntries,
    updateRoleSheetEntry,
    addRoleSheetEntry,
    deleteRoleSheetEntry,
    navigateToControlGraphForKpi,
    setControlGraphFrequency,
    kpis,
  } = useDwm();

  // Position filter ('all' or specific positionId)
  const [positionFilter, setPositionFilter] = useState<PositionId | 'all'>(selectedPositionId);
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'High-Priority'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Row Modal state
  const [editingEntry, setEditingEntry] = useState<RoleSheetEntry | null>(null);

  // Add Row Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSNo, setNewSNo] = useState<number>(roleSheetEntries.length + 1);
  const [newPositionId, setNewPositionId] = useState<PositionId>(selectedPositionId);
  const [newRoles, setNewRoles] = useState('');
  const [newKpi, setNewKpi] = useState('');
  const [newDirection, setNewDirection] = useState<'higher_is_better' | 'lower_is_better'>('higher_is_better');
  const [newTarget, setNewTarget] = useState<number>(100);
  const [newUom, setNewUom] = useState('mins');
  const [newFrequency, setNewFrequency] = useState('Daily');
  const [newOpDef, setNewOpDef] = useState('');
  const [newVcs, setNewVcs] = useState('Target: 60 | UCL: 85 | LCL: 35 | Checkpoint: HIS Audit Stamp');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High-Priority'>('Critical');

  // Sync position selection
  const handleSelectPosition = (posId: PositionId | 'all') => {
    setPositionFilter(posId);
    if (posId !== 'all') {
      setSelectedPositionId(posId);
    }
  };

  // Filter entries based on Position, Priority, Search
  const filteredEntries = useMemo(() => {
    return roleSheetEntries.filter((entry) => {
      const matchPosition = positionFilter === 'all' || entry.positionId === positionFilter;
      const matchPriority = priorityFilter === 'All' || entry.priority === priorityFilter;
      const matchSearch =
        searchQuery === '' ||
        entry.kpi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.roles.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.responsibility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.operationalDefinition.toLowerCase().includes(searchQuery.toLowerCase());

      return matchPosition && matchPriority && matchSearch;
    });
  }, [roleSheetEntries, positionFilter, priorityFilter, searchQuery]);

  // Current active position details (if single position selected)
  const currentPos = positions.find((p) => p.id === (positionFilter === 'all' ? selectedPositionId : positionFilter)) || positions[0];

  // Critical and High-Priority count in filtered view
  const criticalCount = filteredEntries.filter((e) => e.priority === 'Critical').length;
  const highPriorityCount = filteredEntries.filter((e) => e.priority === 'High-Priority').length;

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    updateRoleSheetEntry(editingEntry.id, {
      sNo: editingEntry.sNo,
      deptObjective: editingEntry.deptObjective,
      roles: editingEntry.roles,
      kpi: editingEntry.kpi,
      direction: editingEntry.direction,
      target: Number(editingEntry.target) || 0,
      uom: editingEntry.uom,
      frequency: editingEntry.frequency,
      operationalDefinition: editingEntry.operationalDefinition,
      vcs: editingEntry.vcs,
      responsibility: editingEntry.responsibility,
      priority: editingEntry.priority,
      positionId: editingEntry.positionId,
    });

    setEditingEntry(null);
  };

  // Handle Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpi.trim()) return;

    const matchedPos = positions.find((p) => p.id === newPositionId);

    addRoleSheetEntry({
      sNo: Number(newSNo) || roleSheetEntries.length + 1,
      positionId: newPositionId,
      deptObjective: department.objectiveText,
      roles: newRoles.trim() || `${matchedPos?.displayNumber}. ${matchedPos?.title}`,
      kpi: newKpi.trim(),
      direction: newDirection,
      target: Number(newTarget) || 0,
      uom: newUom.trim(),
      frequency: newFrequency.trim(),
      operationalDefinition: newOpDef.trim() || 'HIS billing audit formula',
      vcs: newVcs.trim() || `Target: ${newTarget} ${newUom} | Checkpoint: Audit Stamp`,
      responsibility: newResponsibility.trim() || 'Routine shift execution and verification',
      priority: newPriority,
    });

    setIsAddModalOpen(false);
  };

  // Export CSV with the updated columns
  const handleExportCSV = () => {
    const headers = [
      'S. No.',
      'Roles',
      'KPI',
      'Performance Direction',
      'Target',
      'UOM',
      'Frequency',
      'Operational Definition',
      'VCS',
      'Responsibility',
      'Priority',
    ];

    const rows = filteredEntries.map((e) => {
      const matched = kpis.find(
        (k) => k.id === e.kpiId || e.kpi.includes(k.code) || e.kpi.includes(k.name)
      );
      const dirText =
        (e.direction || matched?.direction) === 'lower_is_better'
          ? 'Lower the better'
          : 'Higher the better';
      const targetVal = e.target !== undefined ? e.target : (matched?.target ?? '');

      return [
        `"${e.sNo}"`,
        `"${e.roles.replace(/"/g, '""')}"`,
        `"${e.kpi.replace(/"/g, '""')}"`,
        `"${dirText}"`,
        `"${targetVal}"`,
        `"${e.uom}"`,
        `"${e.frequency}"`,
        `"${e.operationalDefinition.replace(/"/g, '""')}"`,
        `"${e.vcs.replace(/"/g, '""')}"`,
        `"${e.responsibility.replace(/"/g, '""')}"`,
        `"${e.priority}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Kauvery_Billing_DRM_Role_Sheets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Jump to Control Graph
  const handleOpenGraph = (entry: RoleSheetEntry) => {
    // Attempt to match KPI in list
    const matchedKpi = kpis.find(
      (k) => k.id === entry.kpiId || entry.kpi.includes(k.code) || entry.kpi.includes(k.name)
    );
    if (matchedKpi) {
      setControlGraphFrequency(matchedKpi.measurementFrequency);
      navigateToControlGraphForKpi(matchedKpi.id, entry.positionId);
    } else {
      const firstKpiForPos = kpis.find((k) => k.positionId === entry.positionId) || kpis[0];
      if (firstKpiForPos) {
        navigateToControlGraphForKpi(firstKpiForPos.id, entry.positionId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Position Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter by Department Position:
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredEntries.length} of {roleSheetEntries.length} DRM Responsibilities
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSelectPosition('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              positionFilter === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Positions ({roleSheetEntries.length})
          </button>

          {positions.map((pos) => {
            const count = roleSheetEntries.filter((r) => r.positionId === pos.id).length;
            const isSelected = positionFilter === pos.id;
            return (
              <button
                key={pos.id}
                onClick={() => handleSelectPosition(pos.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pos.displayNumber}. {pos.shortTitle} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Header Card with Summary Counters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>
                {positionFilter === 'all'
                  ? 'All 5 Department Roles (NABH & JCI Standard DRM)'
                  : `Position Code: ${currentPos.displayNumber} · Level ${currentPos.level}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {positionFilter === 'all'
                ? 'Consolidated Role Sheet Matrix'
                : `${currentPos.displayNumber}. ${currentPos.title}`}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed italic">
              &ldquo;{department.objectiveText}&rdquo;
            </p>
          </div>

          {/* Metric Summary Counters */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-24">
              <span className="text-[11px] text-slate-500 block uppercase font-medium">
                Total Rows
              </span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {filteredEntries.length}
              </span>
            </div>

            <div className="text-center p-3 bg-rose-50/70 rounded-lg border border-rose-200 min-w-24">
              <span className="text-[11px] text-rose-800 block uppercase font-medium">
                Critical KPIs
              </span>
              <span className="text-xl font-bold text-rose-700 font-mono tabular-nums">
                {criticalCount}
              </span>
            </div>

            <div className="text-center p-3 bg-blue-50/70 rounded-lg border border-blue-200 min-w-24">
              <span className="text-[11px] text-blue-800 block uppercase font-medium">
                High Priority
              </span>
              <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">
                {highPriorityCount}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Priority filter, Export CSV, and + Add Row button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Role Sheet..."
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              {(['All', 'Critical', 'High-Priority'] as const).map((prio) => (
                <button
                  key={prio}
                  onClick={() => setPriorityFilter(prio)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    priorityFilter === prio
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setNewSNo(roleSheetEntries.length + 1);
                setNewPositionId(positionFilter === 'all' ? selectedPositionId : positionFilter);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Role Sheet Row</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL ROLE SHEET TABLE WITH PERFORMANCE DIRECTION AND TARGET COLUMNS */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 font-mono border-r border-slate-200 text-center">
                  S. No.
                </th>
                <th className="py-3 px-3 w-36 border-r border-slate-200">
                  Roles
                </th>
                <th className="py-3 px-4 w-48 border-r border-slate-200">
                  KPI
                </th>
                {/* 1. Direction Column */}
                <th className="py-3 px-2 w-20 border-r border-slate-200 text-center" title="Performance Direction">
                  Direction
                </th>
                {/* 2. Target Column */}
                <th className="py-3 px-3 w-28 border-r border-slate-200 text-right">
                  Target
                </th>
                <th className="py-3 px-2 w-16 border-r border-slate-200 text-center">
                  UOM
                </th>
                <th className="py-3 px-3 w-24 border-r border-slate-200">
                  Frequency
                </th>
                <th className="py-3 px-4 w-60 border-r border-slate-200">
                  Operational Definition
                </th>
                <th className="py-3 px-4 w-56 border-r border-slate-200">
                  VCS
                </th>
                <th className="py-3 px-4 min-w-[220px] border-r border-slate-200">
                  Responsibility
                </th>
                <th className="py-3 px-3 w-28 border-r border-slate-200 text-center">
                  Priority
                </th>
                <th className="py-3 px-3 w-20 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 text-xs">
                    No role sheet entries matching the current filter. Click "+ Add Role Sheet Row" to create an entry.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isCritical = entry.priority === 'Critical';
                  const matchedKpi = kpis.find(
                    (k) => k.id === entry.kpiId || entry.kpi.includes(k.code) || entry.kpi.includes(k.name)
                  );
                  const direction = entry.direction || matchedKpi?.direction || 'higher_is_better';
                  const targetVal = entry.target !== undefined ? entry.target : matchedKpi?.target;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      {/* 1. S. No. */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 border-r border-slate-100 text-center">
                        {entry.sNo}
                      </td>

                      {/* 2. Roles */}
                      <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-100 text-xs">
                        {entry.roles}
                      </td>

                      {/* 3. KPI */}
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="font-bold text-slate-900 leading-tight">
                          {entry.kpi}
                        </div>
                        <button
                          onClick={() => handleOpenGraph(entry)}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          <LineChart className="w-3 h-3" />
                          <span>View Control Graph</span>
                        </button>
                      </td>

                      {/* 4. Direction (Only arrow shown, no full text) */}
                      <td className="py-3 px-2 border-r border-slate-100 text-center">
                        {direction === 'higher_is_better' ? (
                          <span
                            title="Higher the better (↑)"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-sm shadow-2xs hover:scale-110 transition-transform cursor-help"
                          >
                            &uarr;
                          </span>
                        ) : (
                          <span
                            title="Lower the better (↓)"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-black text-sm shadow-2xs hover:scale-110 transition-transform cursor-help"
                          >
                            &darr;
                          </span>
                        )}
                      </td>

                      {/* 5. Target (KPI target value) */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 border-r border-slate-100 text-right text-xs">
                        <span className="text-emerald-800 text-sm font-extrabold">
                          {targetVal !== undefined ? targetVal : '—'}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500 font-normal">{entry.uom}</span>
                      </td>

                      {/* 6. UOM */}
                      <td className="py-3 px-2 font-mono text-[11px] font-semibold text-slate-700 border-r border-slate-100 text-center">
                        {entry.uom}
                      </td>

                      {/* 7. Frequency */}
                      <td className="py-3 px-3 text-[11px] text-slate-700 font-medium border-r border-slate-100">
                        {entry.frequency}
                      </td>

                      {/* 8. Operational Definition */}
                      <td className="py-3 px-4 text-[11px] text-slate-700 leading-relaxed border-r border-slate-100 font-mono">
                        {entry.operationalDefinition}
                      </td>

                      {/* 9. VCS (Verification Control Standard) */}
                      <td className="py-3 px-4 text-[11px] text-slate-800 leading-relaxed border-r border-slate-100 bg-slate-50/40">
                        <div className="font-mono text-[10px] text-slate-600">
                          {entry.vcs}
                        </div>
                      </td>

                      {/* 10. Responsibility */}
                      <td className="py-3 px-4 text-xs text-slate-800 leading-relaxed border-r border-slate-100">
                        {entry.responsibility}
                      </td>

                      {/* 11. Priority */}
                      <td className="py-3 px-3 border-r border-slate-100 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {entry.priority}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const matched = kpis.find(
                                (k) => k.id === entry.kpiId || entry.kpi.includes(k.code) || entry.kpi.includes(k.name)
                              );
                              setEditingEntry({
                                ...entry,
                                direction: entry.direction || matched?.direction || 'higher_is_better',
                                target: entry.target !== undefined ? entry.target : (matched?.target ?? 100),
                              });
                            }}
                            title="Edit Role Sheet Entry"
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRoleSheetEntry(entry.id)}
                            title="Delete Row"
                            className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Sheet Row Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Role Sheet Row Editor
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Entry #{editingEntry.sNo}: {editingEntry.roles}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    S. No.
                  </label>
                  <input
                    type="number"
                    value={editingEntry.sNo}
                    onChange={(e) => setEditingEntry({ ...editingEntry, sNo: Number(e.target.value) })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roles
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEntry.roles}
                    onChange={(e) => setEditingEntry({ ...editingEntry, roles: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dept. Objective
                </label>
                <textarea
                  rows={2}
                  value={editingEntry.deptObjective}
                  onChange={(e) => setEditingEntry({ ...editingEntry, deptObjective: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KPI Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEntry.kpi}
                    onChange={(e) => setEditingEntry({ ...editingEntry, kpi: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UOM
                  </label>
                  <input
                    type="text"
                    value={editingEntry.uom}
                    onChange={(e) => setEditingEntry({ ...editingEntry, uom: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Performance Direction & Target inputs */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Performance Direction
                  </label>
                  <select
                    value={editingEntry.direction || 'higher_is_better'}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        direction: e.target.value as 'higher_is_better' | 'lower_is_better',
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="higher_is_better">Higher the better (&uarr;)</option>
                    <option value="lower_is_better">Lower the better (&darr;)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    KPI Target Value ({editingEntry.uom || 'units'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingEntry.target !== undefined ? editingEntry.target : ''}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        target: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-emerald-400 rounded font-mono font-bold text-emerald-950 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={editingEntry.frequency}
                    onChange={(e) => setEditingEntry({ ...editingEntry, frequency: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Shift-wise">Shift-wise</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Instance-based">Instance-based</option>
                    <option value="Trigger/Instance">Trigger/Instance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingEntry.priority}
                    onChange={(e) => setEditingEntry({ ...editingEntry, priority: e.target.value as any })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High-Priority">High-Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Definition
                </label>
                <textarea
                  rows={2}
                  value={editingEntry.operationalDefinition}
                  onChange={(e) => setEditingEntry({ ...editingEntry, operationalDefinition: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VCS (Verification Control Standard)
                </label>
                <input
                  type="text"
                  value={editingEntry.vcs}
                  onChange={(e) => setEditingEntry({ ...editingEntry, vcs: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsibility (Routine Task Procedure)
                </label>
                <textarea
                  rows={2}
                  value={editingEntry.responsibility}
                  onChange={(e) => setEditingEntry({ ...editingEntry, responsibility: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                Save Role Sheet Row
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Role Sheet Row Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  New Role Sheet Entry
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Add Role Sheet Row
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    S. No.
                  </label>
                  <input
                    type="number"
                    value={newSNo}
                    onChange={(e) => setNewSNo(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Position
                  </label>
                  <select
                    value={newPositionId}
                    onChange={(e) => {
                      const pos = e.target.value as PositionId;
                      setNewPositionId(pos);
                      const matched = positions.find((p) => p.id === pos);
                      if (matched) setNewRoles(`${matched.displayNumber}. ${matched.title}`);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayNumber}. {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roles (Position Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1. BILLING INCHARGE"
                    value={newRoles}
                    onChange={(e) => setNewRoles(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KPI Name / Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INC-KPI-01: Discharge Billing Turnaround Time (TAT)"
                    value={newKpi}
                    onChange={(e) => setNewKpi(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UOM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mins, %, ₹"
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Performance Direction & Target inputs */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Performance Direction
                  </label>
                  <select
                    value={newDirection}
                    onChange={(e) =>
                      setNewDirection(e.target.value as 'higher_is_better' | 'lower_is_better')
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="higher_is_better">Higher the better (&uarr;)</option>
                    <option value="lower_is_better">Lower the better (&darr;)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    KPI Target Value ({newUom || 'units'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 60 or 98.5"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-emerald-400 rounded font-mono font-bold text-emerald-950 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Shift-wise">Shift-wise</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Instance-based">Instance-based</option>
                    <option value="Trigger/Instance">Trigger/Instance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High-Priority">High-Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Definition
                </label>
                <textarea
                  rows={2}
                  placeholder="Measurement formula or operational calculation method"
                  value={newOpDef}
                  onChange={(e) => setNewOpDef(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VCS (Verification Control Standard)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Target: 60 mins | UCL: 85 | LCL: 35 | Checkpoint: HIS Audit Stamp"
                  value={newVcs}
                  onChange={(e) => setNewVcs(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsibility (Routine Task Procedure)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain standard procedure and daily routine execution responsibilities"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                Add Row to Role Sheet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
