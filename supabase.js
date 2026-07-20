import { createClient } from '@supabase/supabase-js';

// Функция для безопасной очистки переменных окружения от кавычек и пробелов
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

  // Эластичная заглушка с поддержкой цепочки методов для предотвращения падений сервера (500)
  const createMockClient = () => {
    const mockQuery = {
      eq: () => mockQuery,
      single: () => Promise.resolve({ data: null, error: new Error('Supabase is in mock mode due to invalid env configuration.') }),
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

  // Если URL и ключ п
