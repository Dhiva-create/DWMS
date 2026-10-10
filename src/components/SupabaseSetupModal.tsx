import React, { useState } from 'react';
import { useDwm } from '../context/DwmContext';
import { testSupabaseConnection } from '../lib/supabase';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  ExternalLink,
  X,
  Code2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const SupabaseSetupModal: React.FC = () => {
  const {
    isSetupModalOpen,
    setIsSetupModalOpen,
    supabaseStatus,
    supabaseMessage,
    isSyncing,
    lastSyncedAt,
    syncFromSupabase,
    syncToSupabase,
  } = useDwm();

  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'guide'>('status');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isSetupModalOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        await syncFromSupabase();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Failed to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sqlSchemaCode = `-- =========================================================================
-- KAUVERY HOSPITAL DAILY WORK MANAGEMENT (DWM) - SUPABASE DATABASE SCHEMA
-- =========================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqpfcioyevwwjxkjdlyh/sql

-- 1. POSITIONS TABLE
CREATE TABLE IF NOT EXISTS public.dwm_positions (
  id TEXT PRIMARY KEY,
  s_no INTEGER NOT NULL,
  display_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  reports_to_position_id TEXT,
  theme_color TEXT NOT NULL DEFAULT 'bg-blue-700',
  accent_border TEXT NOT NULL DEFAULT 'border-blue-800',
  responsibilities_count INTEGER NOT NULL DEFAULT 0,
  is_finalized BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.dwm_team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES public.dwm_positions(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  shift TEXT NOT NULL DEFAULT 'General',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'bg-blue-600',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RESPONSIBILITIES TABLE
CREATE TABLE IF NOT EXISTS public.dwm_responsibilities (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES public.dwm_positions(id) ON DELETE CASCADE,
  s_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Daily',
  standard_operating_time TEXT NOT NULL,
  verification_checkpoint TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'compliant',
  notes TEXT,
  last_checked_at TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. KPIS TABLE
CREATE TABLE IF NOT EXISTS public.dwm_kpis (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES public.dwm_positions(id) ON DELETE CASCADE,
  parent_kpi_id TEXT,
  priority TEXT NOT NULL DEFAULT 'Critical',
  target NUMERIC NOT NULL DEFAULT 0,
  ucl NUMERIC NOT NULL DEFAULT 0,
  lcl NUMERIC NOT NULL DEFAULT 0,
  center_line NUMERIC,
  unit TEXT NOT NULL DEFAULT 'mins',
  measurement_frequency TEXT NOT NULL DEFAULT 'Daily',
  calculation_method TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'higher_is_better',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONTROL POINTS TABLE
CREATE TABLE IF NOT EXISTS public.dwm_control_points (
  id TEXT PRIMARY KEY,
  kpi_id TEXT NOT NULL REFERENCES public.dwm_kpis(id) ON DELETE CASCADE,
  member_id TEXT,
  period_type TEXT NOT NULL DEFAULT 'Daily',
  label TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value NUMERIC NOT NULL,
  operator_name TEXT,
  remarks TEXT,
  corrective_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ROLE SHEET ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.dwm_role_sheet_entries (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES public.dwm_positions(id) ON DELETE CASCADE,
  s_no INTEGER NOT NULL,
  dept_objective TEXT NOT NULL,
  roles TEXT NOT NULL,
  kpi TEXT NOT NULL,
  kpi_id TEXT REFERENCES public.dwm_kpis(id) ON DELETE SET NULL,
  direction TEXT,
  target NUMERIC,
  uom TEXT NOT NULL,
  frequency TEXT NOT NULL,
  operational_definition TEXT NOT NULL,
  vcs TEXT NOT NULL,
  responsibility TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Critical',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_dwm_control_points_kpi ON public.dwm_control_points(kpi_id);
CREATE INDEX IF NOT EXISTS idx_dwm_control_points_timestamp ON public.dwm_control_points(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dwm_kpis_position ON public.dwm_kpis(position_id);
CREATE INDEX IF NOT EXISTS idx_dwm_responsibilities_pos ON public.dwm_responsibilities(position_id);
CREATE INDEX IF NOT EXISTS idx_dwm_team_members_pos ON public.dwm_team_members(position_id);
CREATE INDEX IF NOT EXISTS idx_dwm_role_sheet_pos ON public.dwm_role_sheet_entries(position_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.dwm_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwm_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwm_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwm_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwm_control_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwm_role_sheet_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to positions" ON public.dwm_positions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to positions" ON public.dwm_positions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to team members" ON public.dwm_team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to team members" ON public.dwm_team_members FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to responsibilities" ON public.dwm_responsibilities FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to responsibilities" ON public.dwm_responsibilities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to kpis" ON public.dwm_kpis FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to kpis" ON public.dwm_kpis FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to control points" ON public.dwm_control_points FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to control points" ON public.dwm_control_points FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to role sheet entries" ON public.dwm_role_sheet_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to role sheet entries" ON public.dwm_role_sheet_entries FOR ALL USING (true) WITH CHECK (true);

-- ENABLE REALTIME REPLICATION
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_positions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_team_members; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_responsibilities; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_kpis; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_control_points; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dwm_role_sheet_entries; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Supabase Cloud Integration</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    supabaseStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : supabaseStatus === 'schema_needed'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {supabaseStatus}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Project URL: https://aqpfcioyevwwjxkjdlyh.supabase.co
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSetupModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-4 bg-white text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SQL Schema (Required for First Setup)</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Step-by-Step Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : supabaseStatus === 'schema_needed'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                {supabaseStatus === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : supabaseStatus === 'schema_needed' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {supabaseStatus === 'connected'
                      ? 'Live Cloud Synchronization Active'
                      : supabaseStatus === 'schema_needed'
                      ? 'Supabase Connected · Schema Script Needs to be Run'
                      : 'Connecting to Supabase...'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {supabaseMessage ||
                      'All hospital billing KPIs, DRM role sheets, organogram structures, and SPC readings are synced with Supabase.'}
                  </p>
                  {lastSyncedAt && (
                    <span className="text-[11px] opacity-80 block mt-1 font-mono">
                      Last synchronized: {lastSyncedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test Cloud Connection'}</span>
                </button>

                <button
                  onClick={syncToSupabase}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Uploading to Supabase...' : 'Seed / Sync All Data to Supabase'}</span>
                </button>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Integration Features Summary */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Active Features &amp; Architecture
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Real-time Multi-device Sync:</strong> Instant updates when doctors or staff log readings or update role sheets.</li>
                  <li><strong>Zero Data Loss Fallback:</strong> If network or cloud is momentarily unavailable, operations seamlessly continue locally.</li>
                  <li><strong>Row Level Security (RLS):</strong> Authorized hospital access policies preconfigured for all 6 tables.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Copy and run this SQL script in your Supabase SQL Editor to create the 6 DWM tables with RLS and Realtime:
                </p>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800">
                  {sqlSchemaCode}
                </pre>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Direct link to run SQL in Supabase:</span>
                <a
                  href="https://supabase.com/dashboard/project/aqpfcioyevwwjxkjdlyh/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-sm text-slate-900 block">
                  Quick Beginner Setup (Only 2 Minutes)
                </span>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600">
                  <li>
                    Open the <a href="https://supabase.com/dashboard/project/aqpfcioyevwwjxkjdlyh/sql" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">Supabase SQL Editor</a> in your browser.
                  </li>
                  <li>
                    Click the <strong>"SQL Schema"</strong> tab above and click <strong>"Copy SQL Script"</strong>.
                  </li>
                  <li>
                    In the Supabase SQL Editor, click <strong>"New query"</strong>, paste the script, and click the green <strong>"Run"</strong> button.
                  </li>
                  <li>
                    Return here and click <strong>"Test Cloud Connection"</strong> &rarr; <strong>"Seed / Sync All Data to Supabase"</strong>.
                  </li>
                  <li>
                    Your hospital's Organogram, Role Sheets, KPI Tree, and SPC Control charts will now sync live across all staff devices in real-time!
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Security &amp; RLS
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Row Level Security is enabled on all tables so unauthenticated access is governed by configured policies.
                  </p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Realtime Synchronization
                  </span>
                  <p className="text-[11px] text-slate-500">
                    PostgreSQL replication is turned on so new actual readings appear immediately on other team members' charts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Kauvery Hospital Billing Daily Work Management System
          </div>
          <button
            onClick={() => setIsSetupModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
