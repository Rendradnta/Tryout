import { createClient } from '@supabase/supabase-js';

// 1. Ambil URL dan Kunci Rahasia dari Vercel Environment Variables
// PENTING: Kunci ini BUKAN anon key. Ini adalah SERVICE_ROLE_KEY.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 2. Cek apakah variabel ada (untuk debugging di Vercel)
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is missing from environment variables.');
  // Sebaiknya, buat agar fungsi apa pun yang menggunakan ini gagal jika tidak ada kredensial
}

// 3. Buat dan ekspor 'admin client'
// Client ini memiliki hak akses penuh (bisa bypass RLS)
// Itulah mengapa ia HANYA boleh digunakan di backend (folder /api)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false // Penting: Serverless function tidak perlu menyimpan session
  }
});
