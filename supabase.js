import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const createMockClient = () => {
  const dummyPromise = Promise.resolve({ data: [], error: null });
  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (onFulfilled) => dummyPromise.then(onFulfilled);
      }
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();
