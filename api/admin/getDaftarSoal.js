import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

/**
 * Handler untuk API getDaftarSoal.
 * Hanya akan berjalan jika user adalah admin (dicek oleh withAdminAuth).
 */
const handler = async (req, res) => {
  // 1. Hanya izinkan metode GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil filter (opsional) dari query parameter
  // Frontend bisa memanggil: /api/admin/getDaftarSoal?paket_id=xxxx
  const { paket_id } = req.query;

  try {
    // 3. Buat query ke Supabase
    let query = supabaseAdmin
      .from('soal') // Nama tabel soal Anda
      .select(`
        id,
        nomor_soal,
        teks_soal,
        tipe_soal,
        paket_id,
        subtes_id
      `) // 4. Pilih hanya kolom yang perlu untuk daftar (lebih efisien)
      .order('nomor_soal', { ascending: true }); // Urutkan berdasarkan nomor soal

    // 5. Jika ada filter paket_id, tambahkan ke query
    if (paket_id) {
      query = query.eq('paket_id', paket_id);
    }

    // Eksekusi query
    const { data, error } = await query;

    // 6. Tangani jika ada error dari Supabase
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: `Gagal mengambil data: ${error.message}` });
    }

    // 7. Berhasil!
    return res.status(200).json({ data: data });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
};

// 8. Bungkus dengan 'withAdminAuth' untuk keamanan
export default withAdminAuth(handler);
