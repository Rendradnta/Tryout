import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

/**
 * Handler untuk API editSoal.
 * Hanya akan berjalan jika user adalah admin (dicek oleh withAdminAuth).
 */
const handler = async (req, res) => {
  // 1. Hanya izinkan metode PUT (atau PATCH)
  // PUT = Ganti keseluruhan. PATCH = Ganti sebagian. Kita pakai PUT.
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil ID Soal dari query parameter
  // Frontend akan memanggil: /api/admin/editSoal?id=xxxx-xxxx-xxxx
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID Soal tidak ditemukan di parameter query.' });
  }

  // 3. Ambil data soal yang BARU dari body request
  const {
    paket_id,
    subtes_id,
    nomor_soal,
    tipe_soal,
    narasi_soal,
    teks_soal,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan
  } = req.body;

  // 4. Validasi data (sama seperti tambahSoal)
  if (!paket_id || !teks_soal || !opsi_jawaban || !kunci_jawaban) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Field wajib: paket_id, teks_soal, opsi_jawaban, kunci_jawaban.' 
    });
  }

  // 5. Update data di tabel 'soal'
  try {
    const { data, error } = await supabaseAdmin
      .from('soal') // Nama tabel soal Anda
      .update({
        // Data baru untuk di-update
        paket_id,
        subtes_id,
        nomor_soal,
        tipe_soal,
        narasi_soal,
        teks_soal,
        opsi_jawaban,
        kunci_jawaban,
        pembahasan
      })
      .eq('id', id) // 🎯 INTI: Hanya update baris DIMANA id = id dari query
      .select()
      .single();

    // 6. Tangani jika ada error dari Supabase
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: `Gagal mengupdate database: ${error.message}` });
    }

    // 7. Berhasil!
    return res.status(200).json({ message: 'Soal berhasil diperbarui', data: data });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
};

// 8. Bungkus dengan 'withAdminAuth' untuk keamanan
export default withAdminAuth(handler);
