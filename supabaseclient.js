import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://aqpfcioyevwwjxkjdlyh.supabase.co/rest/v1/";
export const SUPABASE_PUBLIC_KEY = "sb_publishable_IF6ckdTwqMl4e4buTX9-1g_XEIHz6PJ";

// Normalizes the URL in case the REST endpoint path (/rest/v1/) is included
const normalizedUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(normalizedUrl || SUPABASE_URL, SUPABASE_PUBLIC_KEY);

export default supabase;
