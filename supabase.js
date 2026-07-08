import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Инициализируем настоящий Supabase только если есть реальные ключи в панели Vercel или локально.
// Если ключей нет, отдаем безопасную заглушку, чтобы сборщик Vercel не падал при анализе импортов.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null })
      })
    };
