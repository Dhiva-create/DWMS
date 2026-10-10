export type PositionId =
  | 'billing_incharge'
  | 'billing_supervisor'
  | 'bill_closure_cash'
  | 'insurance_coordinator'
  | 'ward_coordinator';

export type FrequencyType = 'Daily' | 'Weekly' | 'Monthly' | 'Instance-based';

export type TaskStatus = 'compliant' | 'in_progress' | 'pending' | 'flagged';

export interface TeamMember {
  id: string;
  name: string;
  positionId: PositionId;
  roleTitle: string;
  shift: string;
  email: string;
  phone: string;
  employeeCode: string;
  avatarColor: string;
}

export interface Responsibility {
  id: string;
  positionId: PositionId;
  sNo: number;
  title: string;
  description: string;
  frequency: 'Daily' | 'Shift-wise' | 'Weekly' | 'Monthly' | 'Trigger/Instance';
  standardOperatingTime: string;
  verificationCheckpoint: string;
  currentStatus: TaskStatus;
  notes?: string;
  lastCheckedAt?: string;
}

export interface KPI {
  id: string;
  code: string;
  name: string;
  description: string;
  positionId: PositionId;
  parentKpiId?: string | null; // For hierarchical linking from Objective to Incharge to Supervisor to Functional teams
  priority: 'Critical' | 'High-Priority';
  target: number;
  ucl: number; // Upper Control Limit
  lcl: number; // Lower Control Limit
  centerLine?: number; // Historical mean
  unit: string;
  measurementFrequency: FrequencyType;
  calculationMethod: string;
  direction: 'lower_is_better' | 'higher_is_better';
}

export interface ControlDataPoint {
  id: string;
  kpiId: string;
  memberId?: string; // Optional: individual team member or position aggregate
  periodType: FrequencyType;
  label: string; // e.g. "Oct 01", "Wk 40", "Sep 2026", "Discharge #412"
  timestamp: string;
  value: number;
  operatorName?: string;
  remarks?: string;
  correctiveAction?: string;
}

export interface RoleSheetEntry {
  id: string;
  positionId: PositionId;
  sNo: number;
  deptObjective: string;
  roles: string;
  kpi: string;
  kpiId?: string;
  direction?: 'higher_is_better' | 'lower_is_better';
  target?: number;
  uom: string;
  frequency: string;
  operationalDefinition: string;
  vcs: string; // Verification Control Standard (Target, UCL/LCL, Checkpoint)
  responsibility: string;
  priority: 'Critical' | 'High-Priority';
}

export interface PositionInfo {
  id: PositionId;
  sNo: number;
  displayNumber: number; // as seen on organogram e.g. 1, 2, 4, 5, 7
  title: string;
  shortTitle: string;
  headcount: number;
  level: 1 | 2 | 3;
  reportsToPositionId: PositionId | null;
  themeColor: string; // primary background
  accentBorder: string;
  responsibilitiesCount: number;
  isFinalized?: boolean;
}

export interface DepartmentObjective {
  title: string;
  objectiveText: string;
  hospital: string;
  department: string;
  totalHeadcount: number;
  positionsCount: number;
}
