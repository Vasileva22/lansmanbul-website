import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Безопасная проверка на корректность URL-адреса
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

// Создаем универсальную цепочечную Proxy-заглушку. 
// Она имитирует любой метод (select, eq, order, limit) и возвращает пустой массив при await,
// предотвращая любые падения сборщика при отсутствии переменных окружения.
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
