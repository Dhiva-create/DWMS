import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DepartmentObjective,
  PositionInfo,
  TeamMember,
  Responsibility,
  KPI,
  ControlDataPoint,
  PositionId,
  FrequencyType,
  TaskStatus,
  RoleSheetEntry,
} from '../types/dwm';
import {
  departmentInfo as defaultDept,
  initialPositions as defaultPositions,
  initialTeamMembers as defaultMembers,
  initialResponsibilities as defaultResponsibilities,
  initialKPIs as defaultKPIs,
  generateInitialControlPoints,
  generateInitialRoleSheetEntries,
} from '../data/initialData';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import {
  loadAllDwmDataFromSupabase,
  seedInitialDataToSupabase,
  dbUpsertPosition,
  dbUpsertTeamMember,
  dbDeleteTeamMember,
  dbUpsertResponsibility,
  dbDeleteResponsibility,
  dbUpsertKpi,
  dbDeleteKpi,
  dbInsertControlPoint,
  dbDeleteControlPoint,
  dbUpsertRoleSheetEntry,
  dbDeleteRoleSheetEntry,
  mapPositionFromDb,
  mapTeamMemberFromDb,
  mapResponsibilityFromDb,
  mapKpiFromDb,
  mapControlPointFromDb,
  mapRoleSheetEntryFromDb,
} from '../services/dwmSupabaseService';

export type AppView =
  | 'organogram'
  | 'rolesheets'
  | 'kpitree'
  | 'controlgraph'
  | 'stability_matrix'
  | 'checksheet';

export type SupabaseStatus = 'connecting' | 'connected' | 'schema_needed' | 'error' | 'offline';

interface DwmContextType {
  department: DepartmentObjective;
  positions: PositionInfo[];
  teamMembers: TeamMember[];
  responsibilities: Responsibility[];
  kpis: KPI[];
  controlPoints: ControlDataPoint[];
  roleSheetEntries: RoleSheetEntry[];
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedPositionId: PositionId;
  setSelectedPositionId: (posId: PositionId) => void;
  selectedKpiId: string;
  setSelectedKpiId: (kpiId: string) => void;
  selectedMemberId: string | 'all';
  setSelectedMemberId: (memberId: string | 'all') => void;
  controlGraphFrequency: FrequencyType;
  setControlGraphFrequency: (freq: FrequencyType) => void;
  toast: { title: string; message: string; timestamp: number } | null;
  clearToast: () => void;
  
  // Supabase Cloud State
  supabaseStatus: SupabaseStatus;
  supabaseMessage: string;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isSetupModalOpen: boolean;
  setIsSetupModalOpen: (open: boolean) => void;
  syncFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;

  reassignKpiPosition: (
    kpiId: string,
    targetPositionId: PositionId,
    newParentKpiId?: string | null
  ) => void;
  updateResponsibilityStatus: (
    respId: string,
    status: TaskStatus,
    notes?: string
  ) => void;
  addResponsibility: (newResp: Omit<Responsibility, 'id' | 'sNo'>) => void;
  addControlPoint: (point: Omit<ControlDataPoint, 'id'>) => void;
  updateControlPoint: (pointId: string, updates: Partial<ControlDataPoint>) => void;
  deleteControlPoint: (pointId: string) => void;
  updatePosition: (posId: PositionId, updates: Partial<PositionInfo>) => void;
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  addTeamMember: (newMember: Omit<TeamMember, 'id'>) => void;
  deleteTeamMember: (memberId: string) => void;
  updateResponsibility: (respId: string, updates: Partial<Responsibility>) => void;
  deleteResponsibility: (respId: string) => void;
  updateKpi: (kpiId: string, updates: Partial<KPI>) => void;
  addKpi: (newKpi: Omit<KPI, 'id'>) => void;
  deleteKpi: (kpiId: string) => void;
  updateRoleSheetEntry: (id: string, updates: Partial<RoleSheetEntry>) => void;
  addRoleSheetEntry: (entry: Omit<RoleSheetEntry, 'id'>) => void;
  deleteRoleSheetEntry: (id: string) => void;
  resetToDefaults: () => void;
  getKpisForPosition: (posId: PositionId) => KPI[];
  getResponsibilitiesForPosition: (posId: PositionId) => Responsibility[];
  getTeamMembersForPosition: (posId: PositionId) => TeamMember[];
  navigateToPositionRoleSheet: (posId: PositionId) => void;
  navigateToControlGraphForKpi: (kpiId: string, posId?: PositionId, memberId?: string) => void;
}

const DwmContext = createContext<DwmContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'kauvery_dwm_v1_';

export const DwmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [department] = useState<DepartmentObjective>(defaultDept);

  // Local state initialized with cached values or defaults
  const [positions, setPositions] = useState<PositionInfo[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}positions`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultPositions;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}members`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultMembers;
  });

  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}responsibilities`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultResponsibilities;
  });

  const [kpis, setKpis] = useState<KPI[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}kpis`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultKPIs;
  });

  const [controlPoints, setControlPoints] = useState<ControlDataPoint[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}points`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return generateInitialControlPoints();
  });

  const [roleSheetEntries, setRoleSheetEntries] = useState<RoleSheetEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}role_entries`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return generateInitialRoleSheetEntries();
  });

  const [activeView, setActiveView] = useState<AppView>('organogram');
  const [selectedPositionId, setSelectedPositionId] = useState<PositionId>('billing_incharge');
  const [selectedKpiId, setSelectedKpiId] = useState<string>('kpi_inc_1');
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [controlGraphFrequency, setControlGraphFrequency] = useState<FrequencyType>('Daily');
  const [toast, setToast] = useState<{ title: string; message: string; timestamp: number } | null>(null);

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>(
    isSupabaseConfigured ? 'connecting' : 'offline'
  );
  const [supabaseMessage, setSupabaseMessage] = useState<string>(
    isSupabaseConfigured ? 'Connecting to Supabase...' : 'Supabase environment credentials not configured'
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}positions`, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}members`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}kpis`, JSON.stringify(kpis));
  }, [kpis]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}responsibilities`, JSON.stringify(responsibilities));
  }, [responsibilities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}points`, JSON.stringify(controlPoints));
  }, [controlPoints]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}role_entries`, JSON.stringify(roleSheetEntries));
  }, [roleSheetEntries]);

  // ==========================================
  // SUPABASE SYNCHRONIZATION LOGIC
  // ==========================================

  const syncFromSupabase = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setSupabaseStatus('offline');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await loadAllDwmDataFromSupabase();

      if (!result) {
        // Tables might not exist yet
        const testRes = await testSupabaseConnection();
        if (testRes.missingTables && testRes.missingTables.length > 0) {
          setSupabaseStatus('schema_needed');
          setSupabaseMessage('Connected to Supabase! Please execute the SQL setup script to initialize database tables.');
        } else {
          setSupabaseStatus('error');
          setSupabaseMessage(testRes.message || 'Error querying Supabase tables');
        }
        return;
      }

      if (result.isEmpty) {
        // Database exists but has no records yet -> seed initial data!
        setSupabaseStatus('connected');
        setSupabaseMessage('Connected! Uploading initial hospital DWM dataset to cloud...');
        await seedInitialDataToSupabase({
          positions,
          teamMembers,
          responsibilities,
          kpis,
          controlPoints,
          roleSheetEntries,
        });
        setLastSyncedAt(new Date());
        setSupabaseMessage('Connected to Supabase. Database initialized and synchronized.');
      } else {
        // Hydrate from Supabase
        if (result.positions.length > 0) setPositions(result.positions);
        if (result.teamMembers.length > 0) setTeamMembers(result.teamMembers);
        if (result.responsibilities.length > 0) setResponsibilities(result.responsibilities);
        if (result.kpis.length > 0) setKpis(result.kpis);
        if (result.controlPoints.length > 0) setControlPoints(result.controlPoints);
        if (result.roleSheetEntries.length > 0) setRoleSheetEntries(result.roleSheetEntries);

        setSupabaseStatus('connected');
        setSupabaseMessage('Synchronized with live Supabase database');
        setLastSyncedAt(new Date());
      }
    } catch (err: any) {
      console.error('syncFromSupabase error:', err);
      setSupabaseStatus('error');
      setSupabaseMessage(err?.message || 'Failed to sync with Supabase');
    } finally {
      setIsSyncing(false);
    }
  }, [positions, teamMembers, responsibilities, kpis, controlPoints, roleSheetEntries]);

  // Upload all local data to Supabase
  const syncToSupabase = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setToast({
        title: 'Supabase Not Configured',
        message: 'Please check your Supabase environment variables in .env.local',
        timestamp: Date.now(),
      });
      return;
    }

    setIsSyncing(true);
    try {
      const ok = await seedInitialDataToSupabase({
        positions,
        teamMembers,
        responsibilities,
        kpis,
        controlPoints,
        roleSheetEntries,
      });

      if (ok) {
        setSupabaseStatus('connected');
        setSupabaseMessage('All local daily work data successfully seeded to Supabase!');
        setLastSyncedAt(new Date());
        setToast({
          title: 'Cloud Sync Successful',
          message: 'All department roles, KPIs, readings, and DRM sheets synced to Supabase.',
          timestamp: Date.now(),
        });
      } else {
        setSupabaseStatus('schema_needed');
        setSupabaseMessage('Tables not found. Please run the SQL schema in your Supabase dashboard.');
        setIsSetupModalOpen(true);
      }
    } catch (e: any) {
      setSupabaseStatus('error');
      setSupabaseMessage(e?.message || 'Error syncing data');
    } finally {
      setIsSyncing(false);
    }
  }, [positions, teamMembers, responsibilities, kpis, controlPoints, roleSheetEntries]);

  // Initial load on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      syncFromSupabase();
    }
  }, []);

  // Supabase Real-time Subscriptions
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || supabaseStatus !== 'connected') return;

    const channel = supabase
      .channel('dwm-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dwm_control_points' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPt = mapControlPointFromDb(payload.new);
            setControlPoints((prev) => {
              if (prev.some((p) => p.id === newPt.id)) return prev;
              return [newPt, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setControlPoints((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dwm_responsibilities' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = mapResponsibilityFromDb(payload.new);
            setResponsibilities((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dwm_kpis' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = mapKpiFromDb(payload.new);
            setKpis((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dwm_role_sheet_entries' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = mapRoleSheetEntryFromDb(payload.new);
            setRoleSheetEntries((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [supabaseStatus]);

  const clearToast = () => setToast(null);

  const getKpisForPosition = (posId: PositionId) => {
    return kpis.filter((k) => k.positionId === posId);
  };

  const getResponsibilitiesForPosition = (posId: PositionId) => {
    return responsibilities.filter((r) => r.positionId === posId);
  };

  const getTeamMembersForPosition = (posId: PositionId) => {
    return teamMembers.filter((m) => m.positionId === posId);
  };

  // Position updates
  const updatePosition = (posId: PositionId, updates: Partial<PositionInfo>) => {
    setPositions((prev) => {
      const next = prev.map((p) => {
        if (p.id === posId) {
          const updated = { ...p, ...updates };
          dbUpsertPosition(updated);
          return updated;
        }
        return p;
      });
      return next;
    });
    setToast({
      title: updates.isFinalized ? 'Organogram Finalised' : 'Position Updated',
      message: `${updates.title || posId} details successfully updated.`,
      timestamp: Date.now(),
    });
  };

  // Staff / Team Member updates
  const updateTeamMember = (memberId: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) => {
      const next = prev.map((m) => {
        if (m.id === memberId) {
          const updated = { ...m, ...updates };
          dbUpsertTeamMember(updated);
          return updated;
        }
        return m;
      });
      return next;
    });
    setToast({
      title: 'Staff Record Updated',
      message: `Staff member ${updates.name || memberId} details updated.`,
      timestamp: Date.now(),
    });
  };

  const addTeamMember = (newMember: Omit<TeamMember, 'id'>) => {
    const id = `mem_${Date.now()}`;
    const member: TeamMember = { ...newMember, id };
    setTeamMembers((prev) => [...prev, member]);
    dbUpsertTeamMember(member);

    // Also update position headcount
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === newMember.positionId) {
          const updated = { ...p, headcount: p.headcount + 1 };
          dbUpsertPosition(updated);
          return updated;
        }
        return p;
      })
    );
    setToast({
      title: 'Staff Member Assigned',
      message: `${newMember.name} (Emp No: ${newMember.employeeCode}) assigned to team.`,
      timestamp: Date.now(),
    });
  };

  const deleteTeamMember = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    dbDeleteTeamMember(memberId);

    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === member.positionId) {
          const updated = { ...p, headcount: Math.max(0, p.headcount - 1) };
          dbUpsertPosition(updated);
          return updated;
        }
        return p;
      })
    );
    setToast({
      title: 'Staff Member Removed',
      message: `${member.name} removed from roster.`,
      timestamp: Date.now(),
    });
  };

  // Responsibility updates
  const updateResponsibility = (respId: string, updates: Partial<Responsibility>) => {
    setResponsibilities((prev) =>
      prev.map((r) => {
        if (r.id === respId) {
          const updated = { ...r, ...updates };
          dbUpsertResponsibility(updated);
          return updated;
        }
        return r;
      })
    );
    setToast({
      title: 'Role Sheet Updated',
      message: `Responsibility updated in role sheet.`,
      timestamp: Date.now(),
    });
  };

  const deleteResponsibility = (respId: string) => {
    setResponsibilities((prev) => prev.filter((r) => r.id !== respId));
    dbDeleteResponsibility(respId);
    setToast({
      title: 'Responsibility Removed',
      message: 'Item deleted from role sheet.',
      timestamp: Date.now(),
    });
  };

  // KPI updates
  const updateKpi = (kpiId: string, updates: Partial<KPI>) => {
    setKpis((prev) =>
      prev.map((k) => {
        if (k.id === kpiId) {
          const updated = { ...k, ...updates };
          dbUpsertKpi(updated);
          return updated;
        }
        return k;
      })
    );
    setToast({
      title: 'KPI & Role Sheet Updated',
      message: `KPI "${updates.name || kpiId}" specifications and limits updated.`,
      timestamp: Date.now(),
    });
  };

  const addKpi = (newKpi: Omit<KPI, 'id'>) => {
    const id = `kpi_${Date.now()}`;
    const kpi: KPI = { ...newKpi, id };
    setKpis((prev) => [...prev, kpi]);
    dbUpsertKpi(kpi);
    setToast({
      title: 'New KPI Created',
      message: `"${newKpi.name}" created and added to Role Sheet & KPI Tree.`,
      timestamp: Date.now(),
    });
  };

  const deleteKpi = (kpiId: string) => {
    const target = kpis.find((k) => k.id === kpiId);
    setKpis((prev) => prev.filter((k) => k.id !== kpiId));
    dbDeleteKpi(kpiId);
    setToast({
      title: 'KPI Removed',
      message: target ? `"${target.name}" removed from Role Sheet.` : 'KPI deleted.',
      timestamp: Date.now(),
    });
  };

  // Control points editing
  const updateControlPoint = (pointId: string, updates: Partial<ControlDataPoint>) => {
    setControlPoints((prev) =>
      prev.map((pt) => {
        if (pt.id === pointId) {
          const updated = { ...pt, ...updates };
          dbInsertControlPoint(updated);
          return updated;
        }
        return pt;
      })
    );
    setToast({
      title: 'Actual Value Updated',
      message: 'Control graph updated in real time.',
      timestamp: Date.now(),
    });
  };

  const deleteControlPoint = (pointId: string) => {
    setControlPoints((prev) => prev.filter((pt) => pt.id !== pointId));
    dbDeleteControlPoint(pointId);
    setToast({
      title: 'Reading Deleted',
      message: 'Control graph updated in real time.',
      timestamp: Date.now(),
    });
  };

  // Role Sheet Entries CRUD
  const updateRoleSheetEntry = (id: string, updates: Partial<RoleSheetEntry>) => {
    setRoleSheetEntries((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          dbUpsertRoleSheetEntry(updated);

          // If kpiId or matching kpi exists and target or direction was updated, sync kpi
          if (updates.target !== undefined || updates.direction !== undefined) {
            const targetKpiId = updated.kpiId;
            if (targetKpiId) {
              setKpis((prevKpis) =>
                prevKpis.map((k) => {
                  if (k.id === targetKpiId) {
                    const updatedKpi = {
                      ...k,
                      ...(updates.target !== undefined ? { target: updates.target } : {}),
                      ...(updates.direction !== undefined ? { direction: updates.direction } : {}),
                    };
                    dbUpsertKpi(updatedKpi);
                    return updatedKpi;
                  }
                  return k;
                })
              );
            }
          }
          return updated;
        }
        return r;
      })
    );
    setToast({
      title: 'Role Sheet Updated',
      message: `Role sheet entry #${updates.sNo || ''} modified successfully.`,
      timestamp: Date.now(),
    });
  };

  const addRoleSheetEntry = (entry: Omit<RoleSheetEntry, 'id'>) => {
    const id = `rse_${Date.now()}`;
    const newEntry: RoleSheetEntry = { ...entry, id };
    setRoleSheetEntries((prev) => [...prev, newEntry]);
    dbUpsertRoleSheetEntry(newEntry);
    setToast({
      title: 'Role Sheet Entry Added',
      message: `Added row for ${entry.roles} (${entry.kpi}).`,
      timestamp: Date.now(),
    });
  };

  const deleteRoleSheetEntry = (id: string) => {
    setRoleSheetEntries((prev) => prev.filter((r) => r.id !== id));
    dbDeleteRoleSheetEntry(id);
    setToast({
      title: 'Role Sheet Entry Removed',
      message: 'Row deleted from role sheet.',
      timestamp: Date.now(),
    });
  };

  // Reassign KPI Position
  const reassignKpiPosition = (
    kpiId: string,
    targetPositionId: PositionId,
    newParentKpiId?: string | null
  ) => {
    const targetKpi = kpis.find((k) => k.id === kpiId);
    if (!targetKpi) return;

    const oldPos = positions.find((p) => p.id === targetKpi.positionId);
    const newPos = positions.find((p) => p.id === targetPositionId);

    if (targetKpi.positionId === targetPositionId && targetKpi.parentKpiId === newParentKpiId) {
      return;
    }

    setKpis((prev) =>
      prev.map((k) => {
        if (k.id === kpiId) {
          const updated = {
            ...k,
            positionId: targetPositionId,
            ...(newParentKpiId !== undefined ? { parentKpiId: newParentKpiId } : {}),
          };
          dbUpsertKpi(updated);
          return updated;
        }
        return k;
      })
    );

    const oldTitle = oldPos ? oldPos.shortTitle : 'Previous Position';
    const newTitle = newPos ? newPos.shortTitle : 'Target Position';

    setToast({
      title: 'KPI Hierarchy & Role Sheet Synchronized',
      message: `"${targetKpi.name}" transferred from [${oldTitle}] to [${newTitle}].`,
      timestamp: Date.now(),
    });
  };

  const updateResponsibilityStatus = (
    respId: string,
    status: TaskStatus,
    notes?: string
  ) => {
    const nowStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setResponsibilities((prev) =>
      prev.map((r) => {
        if (r.id === respId) {
          const updated = {
            ...r,
            currentStatus: status,
            lastCheckedAt: `Today, ${nowStr}`,
            ...(notes ? { notes } : {}),
          };
          dbUpsertResponsibility(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const addResponsibility = (newResp: Omit<Responsibility, 'id' | 'sNo'>) => {
    const currentForPos = getResponsibilitiesForPosition(newResp.positionId);
    const sNo = currentForPos.length + 1;
    const item: Responsibility = {
      ...newResp,
      id: `resp_custom_${Date.now()}`,
      sNo,
    };
    setResponsibilities((prev) => [...prev, item]);
    dbUpsertResponsibility(item);
    setToast({
      title: 'Responsibility Added',
      message: `Added new responsibility to ${newResp.positionId} Role Sheet.`,
      timestamp: Date.now(),
    });
  };

  const addControlPoint = (point: Omit<ControlDataPoint, 'id'>) => {
    const newPt: ControlDataPoint = {
      ...point,
      id: `pt_${Date.now()}`,
    };
    setControlPoints((prev) => [newPt, ...prev]);
    dbInsertControlPoint(newPt);
    setToast({
      title: 'Control Graph Updated',
      message: `Logged new data point: ${point.value} for ${point.periodType} tracking.`,
      timestamp: Date.now(),
    });
  };

  const resetToDefaults = () => {
    setPositions(defaultPositions);
    setTeamMembers(defaultMembers);
    setResponsibilities(defaultResponsibilities);
    setKpis(defaultKPIs);
    setRoleSheetEntries(generateInitialRoleSheetEntries());
    setControlPoints(generateInitialControlPoints());
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}kpis`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}responsibilities`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}role_entries`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}points`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}positions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}members`);

    // Sync to Supabase as well
    syncToSupabase();

    setToast({
      title: 'Reset to Hospital Default Structure',
      message: 'All Role Sheets, Organogram, and KPI Tree restored to default standard.',
      timestamp: Date.now(),
    });
  };

  const navigateToPositionRoleSheet = (posId: PositionId) => {
    setSelectedPositionId(posId);
    setActiveView('rolesheets');
  };

  const navigateToControlGraphForKpi = (
    kpiId: string,
    posId?: PositionId,
    memberId?: string
  ) => {
    const kpi = kpis.find((k) => k.id === kpiId);
    if (kpi) {
      setSelectedKpiId(kpiId);
      if (posId) setSelectedPositionId(posId);
      else setSelectedPositionId(kpi.positionId);
    }
    if (memberId) {
      setSelectedMemberId(memberId);
    }
    setActiveView('controlgraph');
  };

  return (
    <DwmContext.Provider
      value={{
        department,
        positions,
        teamMembers,
        responsibilities,
        kpis,
        controlPoints,
        roleSheetEntries,
        activeView,
        setActiveView,
        selectedPositionId,
        setSelectedPositionId,
        selectedKpiId,
        setSelectedKpiId,
        selectedMemberId,
        setSelectedMemberId,
        controlGraphFrequency,
        setControlGraphFrequency,
        toast,
        clearToast,
        supabaseStatus,
        supabaseMessage,
        isSyncing,
        lastSyncedAt,
        isSetupModalOpen,
        setIsSetupModalOpen,
        syncFromSupabase,
        syncToSupabase,
        reassignKpiPosition,
        updateResponsibilityStatus,
        addResponsibility,
        updateResponsibility,
        deleteResponsibility,
        addKpi,
        updateKpi,
        deleteKpi,
        addRoleSheetEntry,
        updateRoleSheetEntry,
        deleteRoleSheetEntry,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        updatePosition,
        addControlPoint,
        updateControlPoint,
        deleteControlPoint,
        resetToDefaults,
        getKpisForPosition,
        getResponsibilitiesForPosition,
        getTeamMembersForPosition,
        navigateToPositionRoleSheet,
        navigateToControlGraphForKpi,
      }}
    >
      {children}
    </DwmContext.Provider>
  );
};

export const useDwm = () => {
  const context = useContext(DwmContext);
  if (!context) {
    throw new Error('useDwm must be used within a DwmProvider');
  }
  return context;
};
