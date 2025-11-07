import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js'; // Kita pakai koneksi ADMIN

// Kita butuh client ANON untuk memvalidasi token user
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

  // 2. Lakukan Pengecekan Keamanan (User Wajib Login)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });
  }
  const token = authHeader.split(' ')[1];

  // 3. Validasi token user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }

  // --- Mulai Logika Pengambilan Peringkat ---

  // 4. Ambil 'paket_id' dari query URL (wajib ada untuk filter)
  // Frontend akan memanggil: /api/user/getPeringkat?paket_id=xxxx
  const { paket_id } = req.query;

  if (!paket_id) {
    return res.status(400).json({ error: 'paket_id wajib ada di query.' });
  }

  try {
    // 5. Ambil data peringkat menggunakan koneksi ADMIN
    const { data, error } = await supabaseAdmin
      .from('history_tes') // Mulai dari tabel riwayat
      .select(`
        user_id,
        skor_total,
        waktu_selesai,
        profiles ( nama_lengkap ) 
      `)
      .eq('paket_id', paket_id)        // Hanya untuk paket ini
      .eq('status', 'selesai')        // Hanya yang sudah selesai diproses
      .order('skor_total', { ascending: false }) // 🎯 Urutkan (Peringkat)
      .limit(100); // Batasi 100 teratas (opsional, tapi baik untuk performa)

    if (error) {
      throw new Error(`Gagal mengambil peringkat: ${error.message}`);
    }

    // 6. Berhasil! Kirim kembali data peringkat
    return res.status(200).json({ data: data });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
