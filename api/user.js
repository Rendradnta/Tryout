import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/supabaseAdmin.js'; // Kita pakai koneksi ADMIN

// Kita butuh client ANON untuk memvalidasi token user
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// --- Logika dari getHistory.js ---
const handleGetHistory = async (req, res, user) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('history_tes')
      .select(`
        id,
        waktu_selesai,
        skor_total,
        status,
        paket_soal ( id, judul, tipe_ujian )
      `)
      .eq('user_id', user.id)
      .order('waktu_selesai', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: `Gagal mengambil riwayat: ${err.message}` });
  }
};

// --- Logika dari getPeringkat.js ---
const handleGetPeringkat = async (req, res, user) => {
  const { paket_id } = req.query;
  if (!paket_id) {
    return res.status(400).json({ error: 'paket_id wajib ada di query.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('history_tes')
      .select('user_id, skor_total, waktu_selesai, profiles ( nama_lengkap )')
      .eq('paket_id', paket_id)
      .eq('status', 'selesai')
      .order('skor_total', { ascending: false })
      .limit(100);

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: `Gagal mengambil peringkat: ${err.message}` });
  }
};

// --- Handler Utama (Router) ---
export default async function handler(req, res) {
  // 1. Hanya izinkan metode GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil 'action' dari query
  const { action } = req.query;

  // 3. Validasi Keamanan (Semua aksi butuh login)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });
  }
  const token = authHeader.split(' ')[1];
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }

  // 4. Arahkan ke logika yang benar
  switch (action) {
    case 'getHistory':
      return handleGetHistory(req, res, user);
    case 'getPeringkat':
      return handleGetPeringkat(req, res, user);
    default:
      return res.status(400).json({ error: 'Aksi tidak valid. Gunakan action=getHistory atau action=getPeringkat.' });
  }
}
