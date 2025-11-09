import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// --- Impor Pustaka & Helper dari /lib ---
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import { kv } from './lib/vercelKV.js';
import { hitungSkorSKD } from './lib/scoring/hitungSkorSKD.js';
import { hitungSkorUTBK } from './lib/scoring/hitungSkorUTBK.js';

// --- Variabel Global & Klien ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

// 1. Inisialisasi Hono
const app = new Hono().basePath('/api');

// 2. Middleware Keamanan (Hono)
const userAuth = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return c.json({ error: 'Akses ditolak. Token tidak ada.' }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return c.json({ error: 'Token tidak valid.' }, 401);
  c.set('user', user);
  await next();
};

const adminAuth = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return c.json({ error: 'Akses ditolak. Tidak ada token.' }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return c.json({ error: 'Token tidak valid.' }, 401);
  const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || !profile) return c.json({ error: 'Gagal mengambil profil user.' }, 500);
  if (profile.role !== 'admin') return c.json({ error: 'Akses terlarang. Hanya untuk admin.' }, 403);
  c.set('user', user);
  await next();
};

// 3. Rute API (Versi Sederhana)

// === Rute Admin (/api/admin/soal) ===
const adminRoutes = new Hono();
adminRoutes.use('*', adminAuth);
adminRoutes.get('/soal', async (c) => { 
  const { id, paket_id } = c.req.query();
  if (id) {
    const { data, error } = await supabaseAdmin.from('soal').select('*').eq('id', id).single();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: 'Soal tidak ditemukan.' }, 404);
    return c.json({ data });
  }
  let query = supabaseAdmin.from('soal').select('id, nomor_soal, teks_soal, tipe_soal, paket_id, subtes_id').order('nomor_soal', { ascending: true });
  if (paket_id) query = query.eq('paket_id', paket_id);
  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});
adminRoutes.post('/soal', async (c) => { 
  const body = await c.req.json();
  const { data, error } = await supabaseAdmin.from('soal').insert([body]).select().single();
  if (error) return c.json({ error: `Gagal menyimpan: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil ditambahkan', data }, 201);
});
adminRoutes.put('/soal', async (c) => { 
  const { id } = c.req.query();
  const body = await c.req.json();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);
  const { data, error } = await supabaseAdmin.from('soal').update(body).eq('id', id).select().single();
  if (error) return c.json({ error: `Gagal mengupdate: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil diperbarui', data });
});
adminRoutes.delete('/soal', async (c) => { 
  const { id } = c.req.query();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);
  const { error } = await supabaseAdmin.from('soal').delete().eq('id', id);
  if (error) return c.json({ error: `Gagal menghapus: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil dihapus' });
});

// === Rute Auth (/api/auth/...) ===
const authRoutes = new Hono();
authRoutes.post('/login', async (c) => { 
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email dan password wajib diisi.' }, 400);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: `Login gagal: ${error.message}` }, 401);
  return c.json({ message: 'Login berhasil', user: data.user, session: data.session });
});
authRoutes.post('/signup', async (c) => { 
  const { email, password, nama_lengkap } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email dan password wajib diisi.' }, 400);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nama_lengkap: nama_lengkap || 'User Baru' } } });
  if (error) return c.json({ error: `Pendaftaran gagal: ${error.message}` }, 400);
  let message = data.session ? 'Pendaftaran berhasil.' : 'Pendaftaran berhasil. Cek email Anda.';
  return c.json({ message, user: data.user, session: data.session }, 201);
});
authRoutes.get('/user', userAuth, async (c) => { 
  const user = c.get('user');
  const { data: profile, error } = await supabaseAdmin.from('profiles').select('nama_lengkap, role').eq('id', user.id).single();
  if (error) return c.json({ error: `Gagal mengambil profil: ${error.message}` }, 500);
  return c.json({ user: { ...user, ...profile } });
});

// === Rute Test (/api/test/...) ===
const testRoutes = new Hono();
testRoutes.use('*', userAuth);
testRoutes.get('/getSoal', async (c) => { 
  const { paket_id } = c.req.query();
  if (!paket_id) return c.json({ error: 'paket_id wajib ada di query.' }, 400);
  const { data, error } = await supabaseAdmin.from('soal').select('id, nomor_soal, tipe_soal, narasi_soal, teks_soal, opsi_jawaban, subtes_id').eq('paket_id', paket_id).order('nomor_soal', { ascending: true });
  const { data: paketData, error: paketError } = await supabaseAdmin.from('paket_soal').select('judul, config_subtes, waktu_total_menit, tipe_ujian').eq('id', paket_id).single();
  if (error || paketError) return c.json({ error: (error || paketError).message }, 500);
  return c.json({ data, config: paketData });
});
testRoutes.post('/submit', async (c) => { 
  const user = c.get('user');
  const body = await c.req.json();
  const dataPekerjaan = { user_id: user.id, ...body };
  await kv.lpush('antrian_jawaban', dataPekerjaan);
  return c.json({ message: 'Jawaban diterima dan sedang diproses.' }, 202);
});
testRoutes.get('/getPembahasan', async (c) => { 
  const user = c.get('user');
  const { history_id } = c.req.query();
  if (!history_id) return c.json({ error: 'history_id wajib ada di query.' }, 400);
  const { data: historyData, error: historyError } = await supabaseAdmin.from('history_tes').select('jawaban_user, paket_id').eq('id', history_id).eq('user_id', user.id).single();
  if (historyError || !historyData) return c.json({ error: 'Riwayat tes tidak ditemukan.' }, 404);
  const { data: soalData, error: soalError } = await supabaseAdmin.from('soal').select('*').eq('paket_id', historyData.paket_id).order('nomor_soal', { ascending: true });
  if (soalError) return c.json({ error: soalError.message }, 500);
  return c.json({ jawaban_user: historyData.jawaban_user, soal_lengkap: soalData });
});

// === Rute User (/api/user) ===
const userRoutes = new Hono();
userRoutes.use('*', userAuth);
userRoutes.get('/', async (c) => { 
  const user = c.get('user');
  const { action, paket_id } = c.req.query();
  if (action === 'getHistory') {
    const { data, error } = await supabaseAdmin.from('history_tes').select('id, waktu_selesai, skor_total, status, paket_soal ( id, judul, tipe_ujian )').eq('user_id', user.id).order('waktu_selesai', { ascending: false });
    if (error) return c.json({ error: `Gagal mengambil riwayat: ${error.message}` }, 500);
    return c.json({ data });
  }
  if (action === 'getPeringkat') {
    if (!paket_id) return c.json({ error: 'paket_id wajib ada di query.' }, 400);
    const { data, error } = await supabaseAdmin.from('history_tes').select('user_id, skor_total, waktu_selesai, profiles ( nama_lengkap )').eq('paket_id', paket_id).eq('status', 'selesai').order('skor_total', { ascending: false }).limit(100);
    if (error) return c.json({ error: `Gagal mengambil peringkat: ${error.message}` }, 500);
    return c.json({ data });
  }
  return c.json({ error: 'Aksi tidak valid.' }, 400);
});

// 4. Hubungkan Rute ke App Utama
app.route('/admin', adminRoutes);
app.route('/auth', authRoutes);
app.route('/test', testRoutes);
app.route('/user', userRoutes); 

// 5. Rute Cron (DENGAN PERBAIKAN)
app.post('/cron/prosesSkor', async (c) => {
  const authHeader = c.req.header('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: 'Akses tidak sah.' }, 401);
  }
  
  const antrian = await kv.lrange('antrian_jawaban', 0, -1);
  if (!antrian || antrian.length === 0) return c.json({ message: 'Antrian kosong.' });
  
  const batchHasilSkor = [];
  for (const dataSubmit of antrian) {
    const data = dataSubmit;
    
    // --- PERBAIKAN DI SINI ---
    // Mengganti 'subtes' dengan 'subtes_id'
    const { data: kunciJawabanPaket, error: kunciError } = await supabaseAdmin
      .from('soal')
      .select('id, subtes_id, tipe_soal, kunci_jawaban')
      .eq('paket_id', data.paket_id);
      
    if(kunciError || !kunciJawabanPaket) {
       console.error(`Gagal ambil kunci untuk paket ${data.paket_id}: ${kunciError?.message}`);
       continue;
    }
    let hasilSkor;
    if (data.tipe_ujian === 'skd') {
      hasilSkor = await hitungSkorSKD(data.jawaban_user, kunciJawabanPaket);
    } else if (data.tipe_ujian === 'utbk') {
      hasilSkor = await hitungSkorUTBK(data.jawaban_user, kunciJawabanPaket);
    } else {
      continue;
    }
    batchHasilSkor.push({
        user_id: data.user_id, paket_id: data.paket_id, waktu_mulai: data.waktu_mulai,
        waktu_selesai: data.waktu_selesai, jawaban_user: data.jawaban_user,
        skor_total: hasilSkor.skor_total, rincian_skor: hasilSkor.rincian_skor,
        status_lulus: hasilSkor.status_lulus || null, status: 'selesai'
      });
  }
  if (batchHasilSkor.length > 0) {
    const { error } = await supabaseAdmin.from('history_tes').insert(batchHasilSkor);
    if (error) return c.json({ error: `Gagal menyimpan batch: ${error.message}` }, 500);
  }
  await kv.del('antrian_jawaban');
  return c.json({ message: `Berhasil memproses ${batchHasilSkor.length} pekerjaan.` });
});

// 6. Ekspor Handler untuk Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
