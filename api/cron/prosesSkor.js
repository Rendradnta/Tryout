// File-file ini akan kita buat di langkah BERIKUTNYA
import { kv } from '../lib/vercelKV.js';
import { hitungSkorSKD } from '../lib/scoring/hitungSkorSKD.js';
import { hitungSkorUTBK } from '../lib/scoring/hitungSkorUTBK.js';

// File ini sudah kita buat
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  // 1. Keamanan dasar: Pastikan ini adalah request POST (Vercel Crons)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  try {
    // 2. Ambil SEMUA antrian jawaban dari Vercel KV
    // Kita asumsikan kita menyimpan antrian di sebuah key bernama 'antrian_jawaban'
    // (Ini contoh, kita bisa pakai 'lrange' atau 'smembers' tergantung tipe data KV)
    const antrian = await kv.lrange('antrian_jawaban', 0, -1);

    if (!antrian || antrian.length === 0) {
      return res.status(200).json({ message: 'Tidak ada pekerjaan. Antrian kosong.' });
    }

    // 3. Siapkan batch untuk disimpan ke Supabase
    const batchHasilSkor = [];

    // 4. Proses setiap jawaban di antrian
    for (const dataSubmit of antrian) {
      // (Data dari KV mungkin perlu di-parse jika disimpan sebagai string JSON)
      // const data = JSON.parse(dataSubmit); 
      const data = dataSubmit; // Asumsikan KV menyimpannya sebagai objek

      let hasilSkor;

      // 5. Panggil mesin skor yang sesuai
      if (data.tipe_ujian === 'skd') {
        hasilSkor = await hitungSkorSKD(data.jawaban_user, data.kunci_jawaban_paket);
      } else if (data.tipe_ujian === 'utbk') {
        hasilSkor = await hitungSkorUTBK(data.jawaban_user, data.kunci_jawaban_paket);
      } else {
        console.warn(`Tipe ujian tidak dikenal: ${data.tipe_ujian}`);
        continue; // Lanjut ke antrian berikutnya
      }

      // 6. Siapkan data untuk dimasukkan ke tabel history_tes
      batchHasilSkor.push({
        user_id: data.user_id,
        paket_id: data.paket_id,
        waktu_mulai: data.waktu_mulai,
        waktu_selesai: data.waktu_selesai,
        jawaban_user: data.jawaban_user,
        skor_total: hasilSkor.skor_total,
        rincian_skor: hasilSkor.rincian_skor,
        status_lulus: hasilSkor.status_lulus || null, // (Hanya untuk SKD)
        status: 'selesai' // Ganti status dari 'diproses' menjadi 'selesai'
      });
    }

    // 7. Simpan SEMUA hasil skor ke Supabase dalam satu kali panggilan
    if (batchHasilSkor.length > 0) {
      const { error } = await supabaseAdmin
        .from('history_tes')
        .insert(batchHasilSkor);

      if (error) {
        throw new Error(`Gagal menyimpan batch ke Supabase: ${error.message}`);
      }
    }

    // 8. KOSONGKAN antrian di Vercel KV setelah berhasil diproses
    await kv.del('antrian_jawaban');

    return res.status(200).json({ 
      message: `Berhasil memproses ${batchHasilSkor.length} pekerjaan.` 
    });

  } catch (err) {
    console.error('Cron job error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
      }
