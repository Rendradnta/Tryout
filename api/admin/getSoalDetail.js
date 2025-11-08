import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

/**
 * Handler untuk API getSoalDetail.
 * Mengambil data lengkap satu soal untuk form 'Edit'.
 * Hanya akan berjalan jika user adalah admin.
 */
const handler = async (req, res) => {
  // 1. Hanya izinkan metode GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil ID Soal dari query parameter
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID Soal tidak ditemukan di parameter query.' });
  }

  try {
    // 3. Ambil data soal dari database menggunakan koneksi ADMIN
    const { data, error } = await supabaseAdmin
      .from('soal')
      .select('*') // Ambil SEMUA kolom (*)
      .eq('id', id)
      .single(); // Kita harapkan hanya 1 hasil

    // 4. Tangani jika ada error atau soal tidak ditemukan
    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') { // Kode Postgres untuk "no rows found"
        return res.status(404).json({ error: 'Soal tidak ditemukan.' });
      }
      return res.status(500).json({ error: `Gagal mengambil data: ${error.message}` });
    }
    
    if (!data) {
        return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    }

    // 5. Berhasil!
    return res.status(200).json({ data: data });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
};

// 6. Bungkus dengan 'withAdminAuth' untuk keamanan
export default withAdminAuth(handler);
