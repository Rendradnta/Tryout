import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin'; // Impor koneksi admin yg kita buat tadi

// Kita butuh client ANON untuk memvalidasi token JWT user
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

/**
 * Ini adalah 'pembungkus' (wrapper) untuk API admin.
 * Ia akan mengecek token user dan rolenya sebelum menjalankan API admin.
 * @param {function(req, res, user)} handler - Fungsi API yang sebenarnya (misal: tambahSoal).
 */
export const withAdminAuth = (handler) => {
  return async (req, res) => {
    
    // 1. Cek token di header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Akses ditolak. Tidak ada token.' });
    }
    
    const token = authHeader.split(' ')[1];

    // 2. Validasi token user menggunakan Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }

    // 3. Cek role user di tabel 'profiles' menggunakan koneksi ADMIN
    // Kita pakai supabaseAdmin agar bisa bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles') // Asumsi Anda punya tabel 'profiles'
      .select('role')
      .eq('id', user.id) // Mencocokkan ID user dari token
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: 'Gagal mengambil profil user.' });
    }

    // 4. INTI KEAMANAN: Cek apakah rolenya 'admin'
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Akses terlarang. Hanya untuk admin.' });
    }

    // 5. JIKA LOLOS: Jalankan fungsi API yang sebenarnya
    // Kita juga bisa "menyuntikkan" data user ke fungsi handler jika perlu
    return handler(req, res, user);
  };
};
