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
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada atau format salah.' });
  }
  const token = authHeader.split(' ')[1];

  // 3. Validasi token user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
  }

  // --- Mulai Logika Pengambilan Soal ---
  // (Hanya berjalan jika user sudah terbukti login)

  // 4. Ambil 'paket_id' dari query URL
  // Frontend akan memanggil: /api/test/getSoal?paket_id=xxxx-xxxx
  const { paket_id } = req.query;

  if (!paket_id) {
    return res.status(400).json({ error: 'paket_id wajib ada di query.' });
  }

  try {
    // 5. Ambil data soal dari database menggunakan koneksi ADMIN
    // (Aman, karena user sudah diautentikasi di langkah 3)
    const { data, error } = await supabaseAdmin
      .from('soal')
      .select(`
        id,
        nomor_soal,
        tipe_soal,
        narasi_soal,
        teks_soal,
        opsi_jawaban,
        subtes_id
      `) // 🎯 SANGAT PENTING!
      .eq('paket_id', paket_id)
      .order('nomor_soal', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // 6. Ambil juga data PAKET-nya (untuk config waktu, dll)
    const { data: paketData, error: paketError } = await supabaseAdmin
      .from('paket_soal')
      .select('judul, config_subtes, waktu_total_menit, tipe_ujian')
      .eq('id', paket_id)
      .single();
    
    if (paketError) {
      throw new Error(paketError.message);
    }

    // 7. Berhasil! Kirim soal dan config paketnya
    return res.status(200).json({ data: data, config: paketData });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
