import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { withAdminAuth } from '../lib/authMiddleware.js';

// --- Impor Logika dari 5 File Kita yang Lama ---

// Logika dari getDaftarSoal.js dan getSoalDetail.js
const handleGet = async (req, res) => {
  const { id, paket_id } = req.query;

  // Jika ada ID, ini adalah 'getSoalDetail'
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('soal')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    return res.status(200).json({ data });
  }

  // Jika tidak ada ID, ini adalah 'getDaftarSoal'
  let query = supabaseAdmin
    .from('soal')
    .select('id, nomor_soal, teks_soal, tipe_soal, paket_id, subtes_id')
    .order('nomor_soal', { ascending: true });

  if (paket_id) {
    query = query.eq('paket_id', paket_id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
};

// Logika dari tambahSoal.js
const handlePost = async (req, res) => {
  const { body } = req;
  const { data, error } = await supabaseAdmin
    .from('soal')
    .insert([body])
    .select()
    .single();

  if (error) return res.status(500).json({ error: `Gagal menyimpan: ${error.message}` });
  return res.status(201).json({ message: 'Soal berhasil ditambahkan', data });
};

// Logika dari editSoal.js
const handlePut = async (req, res) => {
  const { id } = req.query;
  const { body } = req;

  if (!id) return res.status(400).json({ error: 'ID Soal wajib ada di query.' });

  const { data, error } = await supabaseAdmin
    .from('soal')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: `Gagal mengupdate: ${error.message}` });
  return res.status(200).json({ message: 'Soal berhasil diperbarui', data });
};

// Logika dari hapusSoal.js
const handleDelete = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID Soal wajib ada di query.' });

  const { error } = await supabaseAdmin
    .from('soal')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: `Gagal menghapus: ${error.message}` });
  return res.status(200).json({ message: 'Soal berhasil dihapus' });
};


// --- Handler Utama (Router) ---
const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }
};

// Bungkus handler utama dengan keamanan admin
export default withAdminAuth(handler);
