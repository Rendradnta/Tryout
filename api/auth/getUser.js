import { createClient } from '@supabase/supabase-js';

// Kita pakai ANON KEY, karena kita akan memvalidasi token
// yang dikirim oleh user, BUKAN bertindak sebagai admin.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export default async function handler(req, res) {
  // 1. Hanya izinkan metode GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil token dari header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada atau format salah.' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    // 3. Validasi token untuk mendapatkan data user (dari auth.users)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      // Ini terjadi jika token palsu, salah, atau kedaluwarsa
      return res.status(401).json({ error: 'Token tidak valid.' });
    }

    // 4. Ambil data profil (termasuk 'role') dari tabel 'profiles'
    // Kita asumsikan Anda sudah mengatur RLS (Row Level Security)
    // yang mengizinkan user membaca data 'profiles' mereka sendiri.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nama_lengkap, role') // Ambil kolom yang dibutuhkan frontend
      .eq('id', user.id) // Cocokkan dengan ID user yang terotentikasi
      .single(); // Kita tahu hanya ada 1 profil per user

    if (profileError) {
      return res.status(500).json({ error: `Gagal mengambil profil: ${profileError.message}` });
    }

    // 5. Gabungkan data auth dan data profil
    const userData = {
      ...user,        // Berisi id, email, created_at, dll.
      ...profile    // Menambahkan nama_lengkap, role
    };

    // 6. Berhasil! Kirim kembali data user yang lengkap
    return res.status(200).json({ user: userData });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
