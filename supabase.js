import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getClient = () => {
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const createMockClient = () => {
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      })
    };
  };

  // Если URL и ключ присутствуют в Vercel — создаем реальный клиент, иначе возвращаем заглушку
  if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      return createMockClient();
    }
  }
  return createMockClient();
};

export const supabase = getClient();
