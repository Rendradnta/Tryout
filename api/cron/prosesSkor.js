// Impor file-file pembantu (tetap sama)
import { kv } from '../lib/vercelKV.js';
import { hitungSkorSKD } from '../lib/scoring/hitungSkorSKD.js';
import { hitungSkorUTBK } from '../lib/scoring/hitungSkorUTBK.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  
  // --- BLOK KEAMANAN BARU ---
  // 1. Ambil header 'Authorization' yang dikirim oleh GitHub Actions
  const authHeader = req.headers.authorization;
  // 2. Ambil Kunci Rahasia Anda dari Vercel Environment
  const cronSecret = process.env.CRON_SECRET;

  // 3. Cek apakah Kunci Rahasia ada dan cocok
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Akses tidak sah.' });
  }
  // --- AKHIR BLOK KEAMANAN ---

  // 4. Cek metode (pertahanan tambahan)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 5. Sisa kode Anda (logika pemrosesan skor) tetap sama persis
  try {
    const antrian = await kv.lrange('antrian_jawaban', 0, -1);

    if (!antrian || antrian.length === 0) {
      return res.status(200).json({ message: 'Tidak ada pekerjaan. Antrian kosong.' });
    }

    const batchHasilSkor = [];

    for (const dataSubmit of antrian) {
      const data = dataSubmit;
      let hasilSkor;

      if (data.tipe_ujian === 'skd') {
        hasilSkor = await hitungSkorSKD(data.jawaban_user, data.kunci_jawaban_paket);
      } else if (data.tipe_ujian === 'utbk') {
        hasilSkor = await hitungSkorUTBK(data.jawaban_user, data.kunci_jawaban_paket);
      } else {
        console.warn(`Tipe ujian tidak dikenal: ${data.tipe_ujian}`);
        continue;
      }

      batchHasilSkor.push({
        user_id: data.user_id,
        paket_id: data.paket_id,
        waktu_mulai: data.waktu_mulai,
        waktu_selesai: data.waktu_selesai,
        jawaban_user: data.jawaban_user,
        skor_total: hasilSkor.skor_total,
        rincian_skor: hasilSkor.rincian_skor,
        status_lulus: hasilSkor.status_lulus || null,
        status: 'selesai'
      });
    }

    if (batchHasilSkor.length > 0) {
      const { error } = await supabaseAdmin
        .from('history_tes')
        .insert(batchHasilSkor);

      if (error) {
        throw new Error(`Gagal menyimpan batch ke Supabase: ${error.message}`);
      }
    }

    await kv.del('antrian_jawaban');

    return res.status(200).json({ 
      message: `Berhasil memproses ${batchHasilSkor.length} pekerjaan.` 
    });

  } catch (err) {
    console.error('Cron job error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
