import { createClient } from '@supabase/supabase-js';

// 1. Ambil Kunci Publik (Anon Key) dari Environment Variables
// Awalan 'VITE_' adalah WAJIB agar Vite bisa membacanya di frontend.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Cek apakah variabel sudah diatur
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diatur di file .env.local atau Vercel.");
}

// 3. Buat dan ekspor client Supabase
// Client ini aman digunakan di browser (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Secara default, Supabase client akan menyimpan session di localStorage
    persistSession: true,
    autoRefreshToken: true,
  }
});
