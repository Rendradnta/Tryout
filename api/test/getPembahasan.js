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
  if (!authHeader) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });
  }
  const token = authHeader.split(' ')[1];

  // 3. Validasi token user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }

  // --- Mulai Logika Pengambilan Pembahasan ---

  // 4. Ambil 'history_id' dari query URL
  // Frontend akan memanggil: /api/test/getPembahasan?history_id=xxxx
  const { history_id } = req.query;

  if (!history_id) {
    return res.status(400).json({ error: 'history_id wajib ada di query.' });
  }

  try {
    // 5. KEAMANAN: Ambil data riwayat tes, DAN pastikan itu milik user ini
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('history_tes')
      .select('jawaban_user, paket_id') // Ambil jawaban user & ID paket soalnya
      .eq('id', history_id)       // Cocokkan ID riwayat
      .eq('user_id', user.id)     // 🎯 Pastikan ini MILIK user yang login
      .single();

    if (historyError || !historyData) {
      return res.status(404).json({ error: 'Riwayat tes tidak ditemukan atau Anda tidak punya akses.' });
    }

    // 6. Sekarang kita tahu ini aman, ambil SEMUA data soal (termasuk kunci & pembahasan)
    // dari paket_id yang ada di riwayat tersebut.
    const { data: soalData, error: soalError } = await supabaseAdmin
      .from('soal')
      .select('*') // Ambil semua: soal, opsi, kunci, pembahasan
      .eq('paket_id', historyData.paket_id)
      .order('nomor_soal', { ascending: true });

    if (soalError) {
      throw new Error(`Gagal mengambil data soal: ${soalError.message}`);
    }

    // 7. Berhasil! Kirim kembali jawaban user DAN data soal lengkap
    return res.status(200).json({
      jawaban_user: historyData.jawaban_user,
      soal_lengkap: soalData
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
                                                   }
