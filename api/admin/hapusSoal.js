import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

/**
 * Handler untuk API hapusSoal.
 * Hanya akan berjalan jika user adalah admin (dicek oleh withAdminAuth).
 */
const handler = async (req, res) => {
  // 1. Hanya izinkan metode DELETE
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil ID Soal dari query parameter
  // Frontend akan memanggil: /api/admin/hapusSoal?id=xxxx-xxxx-xxxx
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID Soal tidak ditemukan di parameter query.' });
  }

  // 3. Hapus data dari tabel 'soal'
  try {
    const { error } = await supabaseAdmin
      .from('soal') // Nama tabel soal Anda
      .delete()        // 🎯 Perintah hapus
      .eq('id', id);   // 🎯 INTI: Hanya hapus baris DIMANA id = id dari query

    // 4. Tangani jika ada error dari Supabase
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: `Gagal menghapus dari database: ${error.message}` });
    }

    // 5. Berhasil!
    // Status 200 OK (dengan pesan) atau 204 No Content (tanpa pesan)
    // Keduanya valid untuk operasi DELETE.
    return res.status(200).json({ message: 'Soal berhasil dihapus' });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
};

// 6. Bungkus dengan 'withAdminAuth' untuk keamanan
export default withAdminAuth(handler);
