import { createClient } from '@supabase/supabase-js';
import { kv } from '../lib/vercelKV.js'; // Impor koneksi KV

// Kita butuh client ANON untuk memvalidasi token user
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export default async function handler(req, res) {
  // 1. Hanya izinkan metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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

  // --- Mulai Logika Submit Cepat ---
  // (Hanya berjalan jika user sudah terbukti login)

  try {
    // 4. Ambil data jawaban dari body request
    const {
      paket_id,
      tipe_ujian,
      jawaban_user,
      waktu_mulai,
      waktu_selesai
    } = req.body;

    if (!paket_id || !tipe_ujian || !jawaban_user || !waktu_mulai || !waktu_selesai) {
      return res.status(400).json({ error: 'Data submit tidak lengkap.' });
    }

    // 5. Siapkan data untuk dimasukkan ke antrian KV
    const dataPekerjaan = {
      user_id: user.id,
      paket_id,
      tipe_ujian,
      jawaban_user,
      waktu_mulai,
      waktu_selesai,
      // Kita tambahkan juga info kunci (meskipun bisa diambil di cron)
      // agar cron job lebih ringan.
      // (Revisi: Kita putuskan cron job yang ambil kunci. Lihat File 10)
    };

    // 6. 🚀 INTI: Dorong pekerjaan ini ke antrian di Vercel KV
    // Kita gunakan 'lpush' (List Push) untuk menambahkannya ke list
    await kv.lpush('antrian_jawaban', dataPekerjaan);

    // 7. Berhasil! Kirim status '202 Accepted'
    // Ini memberi tahu frontend: "OK, data Anda sudah aman di antrian,
    // tapi belum selesai diproses."
    return res.status(202).json({ 
      message: 'Jawaban diterima dan sedang diproses.' 
    });

  } catch (err) {
    console.error('Submit error (KV failed?):', err);
    return res.status(500).json({ error: `Gagal menyimpan antrian: ${err.message}` });
  }
      }
