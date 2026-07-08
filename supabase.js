import { createClient } from '@supabase/supabase-js';

// Добавляем безопасные заглушки, чтобы сборщик Vercel не падал, если переменные окружения проверяются до запуска
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
