import * as supabaseJS from '@supabase/supabase-js';

// Тройная защита импорта функции создания клиента для любых компиляторов
const getClientFunction = () => {
  if (supabaseJS && typeof supabaseJS.createClient === 'function') {
    return supabaseJS.createClient;
  }
  if (supabaseJS && supabaseJS.default && typeof supabaseJS.default.createClient === 'function') {
    return supabaseJS.default.createClient;
  }
  try {
    const supabaseCJS = require('@supabase/supabase-js');
    if (supabaseCJS && typeof supabaseCJS.createClient === 'function') {
      return supabaseCJS.createClient;
    }
  } catch (e) {}
  return null;
};

let clientInstance = null;

// Функция ленивого создания клиента (запускается только при первом реальном запросе)
const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  const clientFunc = getClientFunction();

  if (clientFunc && isValidUrl(supabaseUrl) && supabaseAnonKey) {
    clientInstance = clientFunc(supabaseUrl, supabaseAnonKey);
  } else {
    clientInstance = createMockClient();
  }

  return clientInstance;
};

// Экспортируем умный Proxy-объект, чтобы сохранить совместимость со всеми файлами проекта
export const supabase = new Proxy({}, {
  get(target, prop) {
    const activeClient = getSupabaseClient();
    return activeClient[prop];
  }
});
