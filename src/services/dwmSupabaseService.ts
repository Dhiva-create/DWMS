import { supabase } from '../lib/supabase';
import {
  PositionInfo,
  TeamMember,
  Responsibility,
  KPI,
  ControlDataPoint,
  RoleSheetEntry,
  PositionId,
  FrequencyType,
  TaskStatus,
} from '../types/dwm';

// ==========================================
// MAPPERS: TypeScript <-> PostgreSQL snake_case
// ==========================================

export function mapPositionFromDb(row: any): PositionInfo {
  return {
    id: row.id as PositionId,
    sNo: row.s_no ?? 1,
    displayNumber: row.display_number ?? 1,
    title: row.title ?? '',
    shortTitle: row.short_title ?? '',
    headcount: row.headcount ?? 0,
    level: row.level ?? 1,
    reportsToPositionId: row.reports_to_position_id ?? null,
    themeColor: row.theme_color ?? 'bg-blue-700',
    accentBorder: row.accent_border ?? 'border-blue-800',
    responsibilitiesCount: row.responsibilities_count ?? 0,
    isFinalized: Boolean(row.is_finalized),
  };
}

export function mapPositionToDb(pos: PositionInfo) {
  return {
    id: pos.id,
    s_no: pos.sNo,
    display_number: pos.displayNumber,
    title: pos.title,
    short_title: pos.shortTitle,
    headcount: pos.headcount,
    level: pos.level,
    reports_to_position_id: pos.reportsToPositionId,
    theme_color: pos.themeColor,
    accent_border: pos.accentBorder,
    responsibilities_count: pos.responsibilitiesCount,
    is_finalized: pos.isFinalized ?? false,
    updated_at: new Date().toISOString(),
  };
}

export function mapTeamMemberFromDb(row: any): TeamMember {
  return {
    id: row.id,
    name: row.name ?? '',
    positionId: row.position_id as PositionId,
    roleTitle: row.role_title ?? '',
    shift: row.shift ?? 'General',
    email: row.email ?? '',
    phone: row.phone ?? '',
    employeeCode: row.employee_code ?? '',
    avatarColor: row.avatar_color ?? 'bg-blue-600',
  };
}

export function mapTeamMemberToDb(member: TeamMember) {
  return {
    id: member.id,
    name: member.name,
    position_id: member.positionId,
    role_title: member.roleTitle,
    shift: member.shift,
    email: member.email,
    phone: member.phone,
    employee_code: member.employeeCode,
    avatar_color: member.avatarColor,
    updated_at: new Date().toISOString(),
  };
}

export function mapResponsibilityFromDb(row: any): Responsibility {
  return {
    id: row.id,
    positionId: row.position_id as PositionId,
    sNo: row.s_no ?? 1,
    title: row.title ?? '',
    description: row.description ?? '',
    frequency: row.frequency ?? 'Daily',
    standardOperatingTime: row.standard_operating_time ?? '',
    verificationCheckpoint: row.verification_checkpoint ?? '',
    currentStatus: (row.current_status as TaskStatus) ?? 'compliant',
    notes: row.notes ?? undefined,
    lastCheckedAt: row.last_checked_at ?? undefined,
  };
}

export function mapResponsibilityToDb(r: Responsibility) {
  return {
    id: r.id,
    position_id: r.positionId,
    s_no: r.sNo,
    title: r.title,
    description: r.description,
    frequency: r.frequency,
    standard_operating_time: r.standardOperatingTime,
    verification_checkpoint: r.verificationCheckpoint,
    current_status: r.currentStatus,
    notes: r.notes || null,
    last_checked_at: r.lastCheckedAt || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapKpiFromDb(row: any): KPI {
  return {
    id: row.id,
    code: row.code ?? '',
    name: row.name ?? '',
    description: row.description ?? '',
    positionId: row.position_id as PositionId,
    parentKpiId: row.parent_kpi_id ?? null,
    priority: row.priority ?? 'Critical',
    target: Number(row.target) || 0,
    ucl: Number(row.ucl) || 0,
    lcl: Number(row.lcl) || 0,
    centerLine: row.center_line != null ? Number(row.center_line) : undefined,
    unit: row.unit ?? '',
    measurementFrequency: (row.measurement_frequency as FrequencyType) ?? 'Daily',
    calculationMethod: row.calculation_method ?? '',
    direction: row.direction ?? 'higher_is_better',
  };
}

export function mapKpiToDb(kpi: KPI) {
  return {
    id: kpi.id,
    code: kpi.code,
    name: kpi.name,
    description: kpi.description,
    position_id: kpi.positionId,
    parent_kpi_id: kpi.parentKpiId || null,
    priority: kpi.priority,
    target: kpi.target,
    ucl: kpi.ucl,
    lcl: kpi.lcl,
    center_line: kpi.centerLine != null ? kpi.centerLine : null,
    unit: kpi.unit,
    measurement_frequency: kpi.measurementFrequency,
    calculation_method: kpi.calculationMethod,
    direction: kpi.direction,
    updated_at: new Date().toISOString(),
  };
}

export function mapControlPointFromDb(row: any): ControlDataPoint {
  return {
    id: row.id,
    kpiId: row.kpi_id,
    memberId: row.member_id ?? undefined,
    periodType: (row.period_type as FrequencyType) ?? 'Daily',
    label: row.label ?? '',
    timestamp: row.timestamp ?? new Date().toISOString(),
    value: Number(row.value) || 0,
    operatorName: row.operator_name ?? undefined,
    remarks: row.remarks ?? undefined,
    correctiveAction: row.corrective_action ?? undefined,
  };
}

export function mapControlPointToDb(pt: ControlDataPoint) {
  return {
    id: pt.id,
    kpi_id: pt.kpiId,
    member_id: pt.memberId || null,
    period_type: pt.periodType,
    label: pt.label,
    timestamp: pt.timestamp,
    value: pt.value,
    operator_name: pt.operatorName || null,
    remarks: pt.remarks || null,
    corrective_action: pt.correctiveAction || null,
  };
}

export function mapRoleSheetEntryFromDb(row: any): RoleSheetEntry {
  return {
    id: row.id,
    positionId: row.position_id as PositionId,
    sNo: row.s_no ?? 1,
    deptObjective: row.dept_objective ?? '',
    roles: row.roles ?? '',
    kpi: row.kpi ?? '',
    kpiId: row.kpi_id ?? undefined,
    direction: row.direction ?? undefined,
    target: row.target != null ? Number(row.target) : undefined,
    uom: row.uom ?? '',
    frequency: row.frequency ?? 'Daily',
    operationalDefinition: row.operational_definition ?? '',
    vcs: row.vcs ?? '',
    responsibility: row.responsibility ?? '',
    priority: row.priority ?? 'Critical',
  };
}

export function mapRoleSheetEntryToDb(entry: RoleSheetEntry) {
  return {
    id: entry.id,
    position_id: entry.positionId,
    s_no: entry.sNo,
    dept_objective: entry.deptObjective,
    roles: entry.roles,
    kpi: entry.kpi,
    kpi_id: entry.kpiId || null,
    direction: entry.direction || null,
    target: entry.target != null ? entry.target : null,
    uom: entry.uom,
    frequency: entry.frequency,
    operational_definition: entry.operationalDefinition,
    vcs: entry.vcs,
    responsibility: entry.responsibility,
    priority: entry.priority,
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// SUPABASE DATABASE OPERATIONS
// ==========================================

export interface SupabaseFullDataLoad {
  positions: PositionInfo[];
  teamMembers: TeamMember[];
  responsibilities: Responsibility[];
  kpis: KPI[];
  controlPoints: ControlDataPoint[];
  roleSheetEntries: RoleSheetEntry[];
  isEmpty: boolean;
}

/**
 * Loads all DWM tables from Supabase in parallel
 */
export async function loadAllDwmDataFromSupabase(): Promise<SupabaseFullDataLoad | null> {
  if (!supabase) return null;

  try {
    const [
      posRes,
      membersRes,
      respsRes,
      kpisRes,
      pointsRes,
      roleEntriesRes,
    ] = await Promise.all([
      supabase.from('dwm_positions').select('*').order('display_number', { ascending: true }),
      supabase.from('dwm_team_members').select('*').order('name', { ascending: true }),
      supabase.from('dwm_responsibilities').select('*').order('s_no', { ascending: true }),
      supabase.from('dwm_kpis').select('*').order('code', { ascending: true }),
      supabase.from('dwm_control_points').select('*').order('timestamp', { ascending: true }).limit(500),
      supabase.from('dwm_role_sheet_entries').select('*').order('s_no', { ascending: true }),
    ]);

    // If any fundamental table has relation error (not created yet), return null
    if (posRes.error || kpisRes.error) {
      console.warn('Supabase DWM tables query error:', posRes.error || kpisRes.error);
      return null;
    }

    const positions = (posRes.data || []).map(mapPositionFromDb);
    const teamMembers = (membersRes.data || []).map(mapTeamMemberFromDb);
    const responsibilities = (respsRes.data || []).map(mapResponsibilityFromDb);
    const kpis = (kpisRes.data || []).map(mapKpiFromDb);
    const controlPoints = (pointsRes.data || []).map(mapControlPointFromDb);
    const roleSheetEntries = (roleEntriesRes.data || []).map(mapRoleSheetEntryFromDb);

    const isEmpty =
      positions.length === 0 &&
      kpis.length === 0 &&
      responsibilities.length === 0;

    return {
      positions,
      teamMembers,
      responsibilities,
      kpis,
      controlPoints,
      roleSheetEntries,
      isEmpty,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

/**
 * Seeds initial hospital default datasets into Supabase if remote database is empty
 */
export async function seedInitialDataToSupabase(data: {
  positions: PositionInfo[];
  teamMembers: TeamMember[];
  responsibilities: Responsibility[];
  kpis: KPI[];
  controlPoints: ControlDataPoint[];
  roleSheetEntries: RoleSheetEntry[];
}): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Positions
    if (data.positions.length > 0) {
      await supabase.from('dwm_positions').upsert(data.positions.map(mapPositionToDb), { onConflict: 'id' });
    }
    // 2. Team Members
    if (data.teamMembers.length > 0) {
      await supabase.from('dwm_team_members').upsert(data.teamMembers.map(mapTeamMemberToDb), { onConflict: 'id' });
    }
    // 3. Responsibilities
    if (data.responsibilities.length > 0) {
      await supabase.from('dwm_responsibilities').upsert(data.responsibilities.map(mapResponsibilityToDb), { onConflict: 'id' });
    }
    // 4. KPIs
    if (data.kpis.length > 0) {
      await supabase.from('dwm_kpis').upsert(data.kpis.map(mapKpiToDb), { onConflict: 'id' });
    }
    // 5. Control Points (sample readings)
    if (data.controlPoints.length > 0) {
      // Chunk insert to avoid payload limits
      const chunks = [];
      for (let i = 0; i < data.controlPoints.length; i += 100) {
        chunks.push(data.controlPoints.slice(i, i + 100));
      }
      for (const chunk of chunks) {
        await supabase.from('dwm_control_points').upsert(chunk.map(mapControlPointToDb), { onConflict: 'id' });
      }
    }
    // 6. Role Sheet Entries
    if (data.roleSheetEntries.length > 0) {
      await supabase.from('dwm_role_sheet_entries').upsert(data.roleSheetEntries.map(mapRoleSheetEntryToDb), { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.error('Error seeding initial data to Supabase:', err);
    return false;
  }
}

// ==========================================
// INDIVIDUAL CRUD HELPERS FOR REAL-TIME SYNC
// ==========================================

export async function dbUpsertPosition(pos: PositionInfo) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_positions').upsert(mapPositionToDb(pos));
  } catch (e) {
    console.error('dbUpsertPosition error:', e);
  }
}

export async function dbUpsertTeamMember(member: TeamMember) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_team_members').upsert(mapTeamMemberToDb(member));
  } catch (e) {
    console.error('dbUpsertTeamMember error:', e);
  }
}

export async function dbDeleteTeamMember(id: string) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_team_members').delete().eq('id', id);
  } catch (e) {
    console.error('dbDeleteTeamMember error:', e);
  }
}

export async function dbUpsertResponsibility(resp: Responsibility) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_responsibilities').upsert(mapResponsibilityToDb(resp));
  } catch (e) {
    console.error('dbUpsertResponsibility error:', e);
  }
}

export async function dbDeleteResponsibility(id: string) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_responsibilities').delete().eq('id', id);
  } catch (e) {
    console.error('dbDeleteResponsibility error:', e);
  }
}

export async function dbUpsertKpi(kpi: KPI) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_kpis').upsert(mapKpiToDb(kpi));
  } catch (e) {
    console.error('dbUpsertKpi error:', e);
  }
}

export async function dbDeleteKpi(id: string) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_kpis').delete().eq('id', id);
  } catch (e) {
    console.error('dbDeleteKpi error:', e);
  }
}

export async function dbInsertControlPoint(point: ControlDataPoint) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_control_points').upsert(mapControlPointToDb(point));
  } catch (e) {
    console.error('dbInsertControlPoint error:', e);
  }
}

export async function dbDeleteControlPoint(id: string) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_control_points').delete().eq('id', id);
  } catch (e) {
    console.error('dbDeleteControlPoint error:', e);
  }
}

export async function dbUpsertRoleSheetEntry(entry: RoleSheetEntry) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_role_sheet_entries').upsert(mapRoleSheetEntryToDb(entry));
  } catch (e) {
    console.error('dbUpsertRoleSheetEntry error:', e);
  }
}

export async function dbDeleteRoleSheetEntry(id: string) {
  if (!supabase) return;
  try {
    await supabase.from('dwm_role_sheet_entries').delete().eq('id', id);
  } catch (e) {
    console.error('dbDeleteRoleSheetEntry error:', e);
  }
}
