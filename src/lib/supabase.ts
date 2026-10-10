import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables from Vite runtime
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

// Create single reusable Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export interface SupabaseConnectionTestResult {
  success: boolean;
  message: string;
  tablesFound?: string[];
  missingTables?: string[];
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionTestResult> {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase URL or Publishable Key is missing in environment configuration.',
    };
  }

  try {
    // Attempt to query one of our core tables to check connectivity and schema status
    const { data, error } = await supabase.from('dwm_kpis').select('id').limit(1);

    if (error) {
      // 42P01 / PGRST205 means table does not exist yet (schema needs to be run in Supabase SQL editor)
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.includes('schema cache') ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      ) {
        return {
          success: true,
          message: 'Connected to Supabase project! Schema tables need to be created using the provided SQL script.',
          missingTables: ['dwm_positions', 'dwm_team_members', 'dwm_responsibilities', 'dwm_kpis', 'dwm_control_points', 'dwm_role_sheet_entries'],
        };
      }
      return {
        success: false,
        message: `Supabase error (${error.code || 'unknown'}): ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected and verified Supabase database!',
      tablesFound: ['dwm_kpis'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection failed while reaching Supabase.',
    };
  }
}
