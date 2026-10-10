import React, { useState } from 'react';
import { useDwm } from '../context/DwmContext';
import { PositionId, TeamMember } from '../types/dwm';
import {
  Users,
  ChevronRight,
  FileSpreadsheet,
  LineChart,
  Edit3,
  CheckCircle2,
  Plus,
  Trash2,
  Lock,
  Unlock,
  X,
  Save,
  Check,
} from 'lucide-react';

export const OrganogramView: React.FC = () => {
  const {
    department,
    positions,
    getKpisForPosition,
    getResponsibilitiesForPosition,
    getTeamMembersForPosition,
    updatePosition,
    updateTeamMember,
    addTeamMember,
    deleteTeamMember,
    navigateToPositionRoleSheet,
    navigateToControlGraphForKpi,
    setActiveView,
    setSelectedPositionId,
  } = useDwm();

  const [activeNodeId, setActiveNodeId] = useState<PositionId>('billing_incharge');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for editing selected position
  const selectedPosition = positions.find((p) => p.id === activeNodeId) || positions[0];
  const [editTitle, setEditTitle] = useState(selectedPosition.title);
  const [editShortTitle, setEditShortTitle] = useState(selectedPosition.shortTitle);
  const [editDisplayNum, setEditDisplayNum] = useState(selectedPosition.displayNumber);
  const [editThemeColor, setEditThemeColor] = useState(selectedPosition.themeColor);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmpNo, setNewStaffEmpNo] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('General (09:00 - 18:00)');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Editing staff inline
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffEditName, setStaffEditName] = useState('');
  const [staffEditEmpNo, setStaffEditEmpNo] = useState('');
  const [staffEditShift, setStaffEditShift] = useState('');

  const incharge = positions.find((p) => p.id === 'billing_incharge')!;
  const supervisor = positions.find((p) => p.id === 'billing_supervisor')!;
  const functionalTeams = positions.filter((p) => p.level === 3);

  const selectedMembers = getTeamMembersForPosition(selectedPosition.id);
  const selectedKpis = getKpisForPosition(selectedPosition.id);
  const selectedResponsibilities = getResponsibilitiesForPosition(selectedPosition.id);

  const criticalKpis = selectedKpis.filter((k) => k.priority === 'Critical');
  const highPriorityKpis = selectedKpis.filter((k) => k.priority === 'High-Priority');

  const handleOpenEditModal = () => {
    setEditTitle(selectedPosition.title);
    setEditShortTitle(selectedPosition.shortTitle);
    setEditDisplayNum(selectedPosition.displayNumber);
    setEditThemeColor(selectedPosition.themeColor);
    setIsEditModalOpen(true);
  };

  const handleSavePositionAndStaff = (finalise: boolean = false) => {
    updatePosition(selectedPosition.id, {
      title: editTitle.trim(),
      shortTitle: editShortTitle.trim(),
      displayNumber: Number(editDisplayNum),
      themeColor: editThemeColor,
      isFinalized: finalise ? true : selectedPosition.isFinalized,
    });
    setIsEditModalOpen(false);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmpNo.trim()) return;

    addTeamMember({
      name: newStaffName.trim(),
      employeeCode: newStaffEmpNo.trim(),
      roleTitle: newStaffRole.trim() || `${selectedPosition.shortTitle} Staff`,
      positionId: selectedPosition.id,
      shift: newStaffShift,
      email: newStaffEmail.trim() || `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@kauveryhospital.com`,
      phone: newStaffPhone.trim() || '+91 98400 00000',
      avatarColor: 'bg-blue-600',
    });

    setNewStaffName('');
    setNewStaffEmpNo('');
    setNewStaffRole('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setIsAddStaffOpen(false);
  };

  const startEditStaff = (m: TeamMember) => {
    setEditingStaffId(m.id);
    setStaffEditName(m.name);
    setStaffEditEmpNo(m.employeeCode);
    setStaffEditShift(m.shift);
  };

  const saveEditStaff = (mId: string) => {
    updateTeamMember(mId, {
      name: staffEditName.trim(),
      employeeCode: staffEditEmpNo.trim(),
      shift: staffEditShift.trim(),
    });
    setEditingStaffId(null);
  };

  return (
    <div className="space-y-6">
      {/* Department Objective Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <span>Department Objective</span>
              <span aria-hidden="true">·</span>
              <span>Billing Department</span>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed italic">
              &ldquo;{department.objectiveText}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <span className="text-xs text-slate-500 block">Total Manpower</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {positions.reduce((acc, p) => acc + p.headcount, 0)}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-xs text-slate-500 block">Positions</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {positions.length}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-xs text-slate-500 block">Responsibilities</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {positions.reduce((acc, p) => acc + p.responsibilitiesCount, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Organogram on left/center + Position Details Drawer on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Organogram Chart Area */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 lg:p-8">
          <div className="text-center mb-8 relative">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Billing Department – Organogram
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-1">
              <span>Position-based structure</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">
                Total manpower: {positions.reduce((acc, p) => acc + p.headcount, 0)}
              </span>
            </div>
          </div>

          {/* Tree Diagram */}
          <div className="flex flex-col items-center">
            {/* Level 1: Billing Incharge */}
            <div className="w-full max-w-md">
              <button
                onClick={() => setActiveNodeId(incharge.id)}
                className={`w-full text-center p-4 rounded-xl text-white transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-sm relative ${
                  activeNodeId === incharge.id
                    ? 'ring-4 ring-blue-300 ring-offset-2'
                    : 'opacity-95 hover:opacity-100'
                }`}
                style={{ backgroundColor: incharge.themeColor }}
              >
                {incharge.isFinalized && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Finalised</span>
                  </span>
                )}
                <div className="text-xs tracking-wider uppercase font-semibold text-blue-100">
                  Level 1 · Department Head
                </div>
                <div className="text-lg font-bold tracking-tight">
                  {incharge.displayNumber}. {incharge.title}
                </div>
                <div className="text-xs text-blue-100 mt-1 flex items-center justify-center gap-2">
                  <span>Headcount: {incharge.headcount}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getKpisForPosition(incharge.id).length} KPIs</span>
                </div>
              </button>
            </div>

            {/* Connecting Vertical Line 1 */}
            <div className="w-0.5 h-8 bg-slate-500" />

            {/* Level 2: Billing Supervisor */}
            <div className="w-full max-w-md">
              <button
                onClick={() => setActiveNodeId(supervisor.id)}
                className={`w-full text-center p-4 rounded-xl text-white transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-sm relative ${
                  activeNodeId === supervisor.id
                    ? 'ring-4 ring-blue-300 ring-offset-2'
                    : 'opacity-95 hover:opacity-100'
                }`}
                style={{ backgroundColor: supervisor.themeColor }}
              >
                {supervisor.isFinalized && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Finalised</span>
                  </span>
                )}
                <div className="text-xs tracking-wider uppercase font-semibold text-blue-100">
                  Level 2 · Operations Management
                </div>
                <div className="text-lg font-bold tracking-tight">
                  {supervisor.displayNumber}. {supervisor.title}
                </div>
                <div className="text-xs text-blue-100 mt-1 flex items-center justify-center gap-2">
                  <span>Headcount: {supervisor.headcount}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getKpisForPosition(supervisor.id).length} KPIs</span>
                </div>
              </button>
            </div>

            {/* Connecting Fork Stem */}
            <div className="w-0.5 h-8 bg-slate-500" />

            {/* Horizontal Branch Bar linking 3 functional teams */}
            <div className="w-full max-w-2xl relative">
              <div className="w-full h-0.5 bg-slate-500" />
              <div className="flex justify-between items-start px-8">
                <div className="w-0.5 h-6 bg-slate-500" />
                <div className="w-0.5 h-6 bg-slate-500" />
                <div className="w-0.5 h-6 bg-slate-500" />
              </div>
            </div>

            {/* Level 3: Functional Billing Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-0">
              {functionalTeams.map((team) => {
                const isSelected = activeNodeId === team.id;
                const teamKpiCount = getKpisForPosition(team.id).length;
                return (
                  <button
                    key={team.id}
                    onClick={() => setActiveNodeId(team.id)}
                    className={`text-center p-4 rounded-xl text-white transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-sm relative ${
                      isSelected
                        ? 'ring-4 ring-teal-300 ring-offset-2'
                        : 'opacity-95 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: team.themeColor }}
                  >
                    {team.isFinalized && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Finalised</span>
                      </span>
                    )}
                    <div className="text-xs tracking-wider uppercase font-semibold text-teal-100">
                      Level 3 · Desk Operations
                    </div>
                    <div className="text-base font-bold tracking-tight mt-0.5">
                      {team.displayNumber}. {team.title}
                    </div>
                    <div className="text-xs text-teal-100 mt-1 flex items-center justify-center gap-2">
                      <span>Headcount: {team.headcount}</span>
                      <span aria-hidden="true">·</span>
                      <span>{teamKpiCount} KPIs</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reporting Footnote from user image */}
            <div className="mt-8 text-center text-xs text-slate-500 italic">
              Reporting structure: Billing Incharge &rarr; Billing Supervisor &rarr; Functional Billing Teams
            </div>
          </div>
        </div>

        {/* Selected Position Quick Inspector Drawer & Staff Editor */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Position Details
              </span>
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit &amp; Finalise</span>
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {selectedPosition.displayNumber}. {selectedPosition.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reports to:{' '}
              <strong className="text-slate-700">
                {selectedPosition.reportsToPositionId
                  ? positions.find((p) => p.id === selectedPosition.reportsToPositionId)?.shortTitle
                  : 'Hospital Operations Director'}
              </strong>
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Headcount</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {selectedPosition.headcount}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Critical KPIs</span>
              <span className="text-lg font-bold text-rose-700 font-mono tabular-nums">
                {criticalKpis.length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">High Priority</span>
              <span className="text-lg font-bold text-blue-700 font-mono tabular-nums">
                {highPriorityKpis.length}
              </span>
            </div>
          </div>

          {/* Assigned Staff Members with Name & Emp No */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Staff ({selectedMembers.length})</span>
              </span>
              <button
                onClick={() => setIsAddStaffOpen(!isAddStaffOpen)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Add Staff</span>
              </button>
            </div>

            {/* Quick Add Staff Dropdown */}
            {isAddStaffOpen && (
              <form
                onSubmit={handleCreateStaff}
                className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
              >
                <div className="font-semibold text-slate-800">Assign New Staff Member</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Staff Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Emp No. (e.g. KH-BIL-110)"
                    value={newStaffEmpNo}
                    onChange={(e) => setNewStaffEmpNo(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Role Title"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={newStaffShift}
                    onChange={(e) => setNewStaffShift(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white"
                  >
                    <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                    <option value="Morning Shift A (07:00 - 15:30)">Morning Shift A (07:00 - 15:30)</option>
                    <option value="Day Shift B (11:00 - 19:30)">Day Shift B (11:00 - 19:30)</option>
                    <option value="Night Shift C (15:00 - 23:30)">Night Shift C (15:00 - 23:30)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-700 text-white rounded font-medium hover:bg-blue-800"
                  >
                    Add to Roster
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedMembers.map((member) => {
                const isEditing = editingStaffId === member.id;
                return (
                  <div
                    key={member.id}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100 text-xs transition-colors"
                  >
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={staffEditName}
                          onChange={(e) => setStaffEditName(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-semibold"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={staffEditEmpNo}
                            onChange={(e) => setStaffEditEmpNo(e.target.value)}
                            placeholder="Emp No"
                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
                          />
                          <input
                            type="text"
                            value={staffEditShift}
                            onChange={(e) => setStaffEditShift(e.target.value)}
                            placeholder="Shift"
                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStaffId(null)}
                            className="px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditStaff(member.id)}
                            className="px-2 py-0.5 text-[11px] bg-blue-700 text-white rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs ${member.avatarColor}`}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-mono">
                                {member.employeeCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{member.roleTitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditStaff(member)}
                            title="Edit Staff Name & Emp. No"
                            className="p-1 text-slate-400 hover:text-blue-700 rounded hover:bg-slate-200/50"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTeamMember(member.id)}
                            title="Remove staff member"
                            className="p-1 text-slate-400 hover:text-rose-700 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigateToPositionRoleSheet(selectedPosition.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Role Sheet</span>
            </button>
            <button
              onClick={() => {
                const firstKpi = selectedKpis[0];
                if (firstKpi) navigateToControlGraphForKpi(firstKpi.id, selectedPosition.id);
                else setActiveView('controlgraph');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Control Graphs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit & Finalise Position Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Organogram Editor
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Position &amp; Finalise
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Position Title (Full Display Name)
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Code #
                  </label>
                  <input
                    type="number"
                    value={editDisplayNum}
                    onChange={(e) => setEditDisplayNum(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Title
                  </label>
                  <input
                    type="text"
                    value={editShortTitle}
                    onChange={(e) => setEditShortTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Card Background Color
                  </label>
                  <input
                    type="color"
                    value={editThemeColor}
                    onChange={(e) => setEditThemeColor(e.target.value)}
                    className="w-full h-9 px-1 py-1 border border-slate-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Staff Management inside modal */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Assigned Personnel ({selectedMembers.length} Staff)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Headcount will automatically sync: {selectedMembers.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">
                          {m.employeeCode}
                        </span>
                        <span className="text-[11px] text-slate-500">{m.shift}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTeamMember(m.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePositionAndStaff(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePositionAndStaff(true)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalise &amp; Lock Position</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
