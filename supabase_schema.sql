-- ====================================================================
-- Kauvery Hospital - Daily Work Management (DWM) Billing System
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ====================================================================

-- Run this entire script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)

-- 1. POSITIONS TABLE (Department Organizational Hierarchy)
CREATE TABLE IF NOT EXISTS public.positions (
  id TEXT PRIMARY KEY,
  s_no INTEGER NOT NULL,
  display_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL,
  reports_to_position_id TEXT REFERENCES public.positions(id) ON DELETE SET NULL,
  theme_color TEXT NOT NULL,
  accent_border TEXT NOT NULL,
  responsibilities_count INTEGER NOT NULL DEFAULT 7,
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TEAM MEMBERS TABLE (Roster and Staff Assignments)
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  shift TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. KPIS TABLE (Key Performance Indicators & Statistical Limits)
CREATE TABLE IF NOT EXISTS public.kpis (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  parent_kpi_id TEXT REFERENCES public.kpis(id) ON DELETE SET NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High-Priority')),
  target NUMERIC NOT NULL,
  ucl NUMERIC NOT NULL,
  lcl NUMERIC NOT NULL,
  center_line NUMERIC,
  unit TEXT NOT NULL,
  measurement_frequency TEXT NOT NULL CHECK (measurement_frequency IN ('Daily', 'Weekly', 'Monthly', 'Instance-based')),
  calculation_method TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('lower_is_better', 'higher_is_better')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. RESPONSIBILITIES TABLE (DRM Shift Routine Checksheet)
CREATE TABLE IF NOT EXISTS public.responsibilities (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  s_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL,
  standard_operating_time TEXT NOT NULL,
  verification_checkpoint TEXT NOT NULL,
  current_status TEXT NOT NULL CHECK (current_status IN ('compliant', 'in_progress', 'pending', 'flagged')),
  notes TEXT,
  last_checked_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ROLE SHEET ENTRIES TABLE (Role Sheet Verification & Operational Standards)
CREATE TABLE IF NOT EXISTS public.role_sheet_entries (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  s_no INTEGER NOT NULL,
  dept_objective TEXT NOT NULL,
  roles TEXT NOT NULL,
  kpi TEXT NOT NULL,
  kpi_id TEXT,
  direction TEXT CHECK (direction IN ('lower_is_better', 'higher_is_better')),
  target NUMERIC,
  uom TEXT NOT NULL,
  frequency TEXT NOT NULL,
  operational_definition TEXT NOT NULL,
  vcs TEXT NOT NULL,
  responsibility TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High-Priority')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CONTROL DATA POINTS TABLE (Statistical Process Control / Readings Log)
CREATE TABLE IF NOT EXISTS public.control_data_points (
  id TEXT PRIMARY KEY,
  kpi_id TEXT NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  member_id TEXT,
  period_type TEXT NOT NULL,
  label TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  value NUMERIC NOT NULL,
  operator_name TEXT,
  remarks TEXT,
  corrective_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_positions_reports_to ON public.positions(reports_to_position_id);
CREATE INDEX IF NOT EXISTS idx_team_members_pos ON public.team_members(position_id);
CREATE INDEX IF NOT EXISTS idx_kpis_pos ON public.kpis(position_id);
CREATE INDEX IF NOT EXISTS idx_kpis_parent ON public.kpis(parent_kpi_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_pos ON public.responsibilities(position_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_status ON public.responsibilities(current_status);
CREATE INDEX IF NOT EXISTS idx_role_sheet_entries_pos ON public.role_sheet_entries(position_id);
CREATE INDEX IF NOT EXISTS idx_control_data_points_kpi ON public.control_data_points(kpi_id);
CREATE INDEX IF NOT EXISTS idx_control_data_points_time ON public.control_data_points(timestamp DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_sheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_data_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Positions read policy" ON public.positions;
DROP POLICY IF EXISTS "Positions write policy" ON public.positions;
DROP POLICY IF EXISTS "Positions update policy" ON public.positions;
DROP POLICY IF EXISTS "Positions delete policy" ON public.positions;

DROP POLICY IF EXISTS "Team members read policy" ON public.team_members;
DROP POLICY IF EXISTS "Team members write policy" ON public.team_members;
DROP POLICY IF EXISTS "Team members update policy" ON public.team_members;
DROP POLICY IF EXISTS "Team members delete policy" ON public.team_members;

DROP POLICY IF EXISTS "KPIs read policy" ON public.kpis;
DROP POLICY IF EXISTS "KPIs write policy" ON public.kpis;
DROP POLICY IF EXISTS "KPIs update policy" ON public.kpis;
DROP POLICY IF EXISTS "KPIs delete policy" ON public.kpis;

DROP POLICY IF EXISTS "Responsibilities read policy" ON public.responsibilities;
DROP POLICY IF EXISTS "Responsibilities write policy" ON public.responsibilities;
DROP POLICY IF EXISTS "Responsibilities update policy" ON public.responsibilities;
DROP POLICY IF EXISTS "Responsibilities delete policy" ON public.responsibilities;

DROP POLICY IF EXISTS "Role sheets read policy" ON public.role_sheet_entries;
DROP POLICY IF EXISTS "Role sheets write policy" ON public.role_sheet_entries;
DROP POLICY IF EXISTS "Role sheets update policy" ON public.role_sheet_entries;
DROP POLICY IF EXISTS "Role sheets delete policy" ON public.role_sheet_entries;

DROP POLICY IF EXISTS "Control data points read policy" ON public.control_data_points;
DROP POLICY IF EXISTS "Control data points write policy" ON public.control_data_points;
DROP POLICY IF EXISTS "Control data points update policy" ON public.control_data_points;
DROP POLICY IF EXISTS "Control data points delete policy" ON public.control_data_points;

-- RLS Policies for POSITIONS
CREATE POLICY "Positions read policy" ON public.positions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Positions write policy" ON public.positions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Positions update policy" ON public.positions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Positions delete policy" ON public.positions FOR DELETE TO anon, authenticated USING (true);

-- RLS Policies for TEAM MEMBERS
CREATE POLICY "Team members read policy" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Team members write policy" ON public.team_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Team members update policy" ON public.team_members FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Team members delete policy" ON public.team_members FOR DELETE TO anon, authenticated USING (true);

-- RLS Policies for KPIS
CREATE POLICY "KPIs read policy" ON public.kpis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "KPIs write policy" ON public.kpis FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "KPIs update policy" ON public.kpis FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "KPIs delete policy" ON public.kpis FOR DELETE TO anon, authenticated USING (true);

-- RLS Policies for RESPONSIBILITIES
CREATE POLICY "Responsibilities read policy" ON public.responsibilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Responsibilities write policy" ON public.responsibilities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Responsibilities update policy" ON public.responsibilities FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Responsibilities delete policy" ON public.responsibilities FOR DELETE TO anon, authenticated USING (true);

-- RLS Policies for ROLE SHEET ENTRIES
CREATE POLICY "Role sheets read policy" ON public.role_sheet_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Role sheets write policy" ON public.role_sheet_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Role sheets update policy" ON public.role_sheet_entries FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Role sheets delete policy" ON public.role_sheet_entries FOR DELETE TO anon, authenticated USING (true);

-- RLS Policies for CONTROL DATA POINTS
CREATE POLICY "Control data points read policy" ON public.control_data_points FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Control data points write policy" ON public.control_data_points FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Control data points update policy" ON public.control_data_points FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Control data points delete policy" ON public.control_data_points FOR DELETE TO anon, authenticated USING (true);

-- ====================================================================
-- REALTIME REPLICATION (For instant live multi-user sync)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'positions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'kpis'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kpis;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'responsibilities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.responsibilities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'role_sheet_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.role_sheet_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'control_data_points'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.control_data_points;
  END IF;
END $$;

-- ====================================================================
-- INITIAL SEED DATA FOR KAUVERY HOSPITAL POSITIONS
-- ====================================================================
INSERT INTO public.positions (id, s_no, display_number, title, short_title, headcount, level, reports_to_position_id, theme_color, accent_border, responsibilities_count)
VALUES
  ('billing_incharge', 1, 1, 'BILLING INCHARGE', 'Billing Incharge', 1, 1, NULL, '#1d4ed8', '#1e40af', 7),
  ('billing_supervisor', 2, 2, 'BILLING SUPERVISOR', 'Billing Supervisor', 1, 2, 'billing_incharge', '#2563eb', '#1d4ed8', 7),
  ('bill_closure_cash', 3, 4, 'BILL CLOSURE – CASH', 'Bill Closure (Cash)', 3, 3, 'billing_supervisor', '#0f766e', '#115e59', 7),
  ('insurance_coordinator', 4, 5, 'INSURANCE COORDINATOR', 'Insurance Coordinator', 2, 3, 'billing_supervisor', '#0f766e', '#115e59', 7),
  ('ward_coordinator', 5, 7, 'WARD COORDINATOR', 'Ward Coordinator', 2, 3, 'billing_supervisor', '#0f766e', '#115e59', 7)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  headcount = EXCLUDED.headcount;

-- ====================================================================
-- INITIAL SEED DATA FOR STAFF / TEAM MEMBERS
-- ====================================================================
INSERT INTO public.team_members (id, name, position_id, role_title, shift, email, phone, employee_code, avatar_color)
VALUES
  ('mem_inc_1', 'R. Natarajan', 'billing_incharge', 'Chief Billing Officer / Incharge', 'General (09:00 - 18:00)', 'natarajan.r@kauveryhospital.com', '+91 98401 22310', 'KH-BIL-101', 'bg-blue-600'),
  ('mem_sup_1', 'Priya Sundaram', 'billing_supervisor', 'Billing Operations Supervisor', 'Morning (07:30 - 16:30)', 'priya.s@kauveryhospital.com', '+91 98402 33421', 'KH-BIL-102', 'bg-indigo-600'),
  ('mem_csh_1', 'Rajesh Kumar', 'bill_closure_cash', 'Senior Cashier (Discharge Desk)', 'Morning Shift A (07:00 - 15:30)', 'rajesh.k@kauveryhospital.com', '+91 98403 44532', 'KH-BIL-103', 'bg-teal-700'),
  ('mem_csh_2', 'Meena Kumari', 'bill_closure_cash', 'Cashier & POS Reconciler', 'Day Shift B (11:00 - 19:30)', 'meena.k@kauveryhospital.com', '+91 98404 55643', 'KH-BIL-104', 'bg-teal-600'),
  ('mem_csh_3', 'Karthik Raja', 'bill_closure_cash', 'Night Cash Closure Officer', 'Night Shift C (15:00 - 23:30)', 'karthik.r@kauveryhospital.com', '+91 98405 66754', 'KH-BIL-105', 'bg-teal-800'),
  ('mem_ins_1', 'Anitha V.', 'insurance_coordinator', 'Senior TPA Liaison Officer', 'Morning Shift (08:00 - 16:30)', 'anitha.v@kauveryhospital.com', '+91 98406 77865', 'KH-BIL-106', 'bg-emerald-700'),
  ('mem_ins_2', 'Suresh M.', 'insurance_coordinator', 'Insurance Desk Coordinator', 'Evening Shift (12:00 - 20:30)', 'suresh.m@kauveryhospital.com', '+91 98407 88976', 'KH-BIL-107', 'bg-emerald-600'),
  ('mem_wrd_1', 'Deepa Lakshmi', 'ward_coordinator', 'Ward Billing Liaison (Floors 1-3)', 'Day Shift (08:30 - 17:30)', 'deepa.l@kauveryhospital.com', '+91 98408 99087', 'KH-BIL-108', 'bg-cyan-700'),
  ('mem_wrd_2', 'Vignesh P.', 'ward_coordinator', 'Ward Billing Liaison (Floors 4-6 & ICU)', 'Day Shift (09:30 - 18:30)', 'vignesh.p@kauveryhospital.com', '+91 98409 00198', 'KH-BIL-109', 'bg-cyan-800')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  shift = EXCLUDED.shift,
  email = EXCLUDED.email;
