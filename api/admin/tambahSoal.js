import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

/**
 * Ini adalah handler utama untuk API tambahSoal.
 * Fungsi ini HANYA akan berjalan JIKA user sudah lolos
 * pengecekan admin dari 'withAdminAuth'.
 */
const handler = async (req, res) => {
  // 1. Hanya izinkan metode POST
  if (req.method !== 'POST') {
    // Jika ada yang mencoba mengakses dengan GET, tolak.
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil data soal dari body request
  // (Pastikan frontend mengirim data dengan nama properti yang sama
  // dengan nama kolom di tabel 'soal' Anda)
  const {
    paket_id,
    subtes_id,
    nomor_soal,
    tipe_soal,
    narasi_soal,
    teks_soal,
    opsi_jawaban,   // Frontend harus kirim ini sebagai JSON
    kunci_jawaban,  // Frontend harus kirim ini sebagai JSON
    pembahasan
  } = req.body;

  // 3. Validasi data (sederhana)
  // Anda bisa membuat ini lebih kompleks sesuai kebutuhan
  if (!paket_id || !teks_soal || !opsi_jawaban || !kunci_jawaban) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Field wajib: paket_id, teks_soal, opsi_jawaban, kunci_jawaban.' 
    });
  }

  // 4. Masukkan data ke tabel 'soal'
  try {
    const { data, error } = await supabaseAdmin
      .from('soal') // Nama tabel soal Anda
      .insert([
        {
          paket_id,
          subtes_id,
          nomor_soal,
          tipe_soal,
          narasi_soal,
          teks_soal,
          opsi_jawaban,   // Simpan JSON opsi
          kunci_jawaban,  // Simpan JSON kunci
          pembahasan
        }
      ])
      .select() // Ambil kembali data yang baru saja dibuat
      .single(); // Kita tahu kita hanya memasukkan satu

    // 5. Tangani jika ada error dari Supabase
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: `Gagal menyimpan ke database: ${error.message}` });
    }

    // 6. Berhasil!
    return res.status(201).json({ message: 'Soal berhasil ditambahkan', data: data });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
};

// 7. INTI KEAMANAN:
// Kita tidak mengekspor 'handler' secara langsung.
// Kita membungkusnya dengan 'withAdminAuth'.
export default withAdminAuth(handler);
