import { createClient } from '@supabase/supabase-js';

const cleanEnvVar = (val) => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').trim();
};

const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const getClient = () => {
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const createMockClient = () => {
    const mockQuery = {
      eq: () => mockQuery,
      single: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      select: () => mockQuery,
      then: (resolve) => resolve({ data: [], error: null }),
    };

    return {
      from: () => ({
        select: () => mockQuery,
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      })
    };
  };

  if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error("Supabase init error:", e);
      return createMockClient();
    }
  }

  return createMockClient();
};

export const supabase = getClient();
