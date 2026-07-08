import { createClient } from '@supabase/supabase-js';

// Добавляем безопасные текстовые заглушки на время сборки на Vercel. 
// При запуске живого сайта Next.js автоматически заменит их на ваши настоящие переменные окружения.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
