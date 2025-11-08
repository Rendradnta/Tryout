import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// --- Impor Pustaka & Helper dari /lib ---
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import { withAdminAuth }_as_middleware from './lib/authMiddleware.js'; // Ganti nama agar jelas
import { kv } from './lib/vercelKV.js';
import { hitungSkorSKD } from './lib/scoring/hitungSkorSKD.js';
import { hitungSkorUTBK } from './lib/scoring/hitungSkorUTBK.js';

// --- Variabel Global & Klien ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

// -----------------------------------------------------------------
// 1. Inisialisasi Hono
// -----------------------------------------------------------------
const app = new Hono().basePath('/api'); // Set root API ke /api

// -----------------------------------------------------------------
// 2. Middleware (Hono)
// -----------------------------------------------------------------

// Middleware Hono untuk mengecek token user (untuk rute publik yg aman)
const userAuth = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return c.json({ error: 'Akses ditolak. Token tidak ada.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Token tidak valid.' }, 401);
  }

  // Teruskan data user ke handler berikutnya
  c.set('user', user);
  await next();
};

// Middleware Hono untuk mengecek token Admin
// (Adaptasi dari authMiddleware.js kita)
const adminAuth = async (c, next) => {
  // Pertama, jalankan userAuth untuk memvalidasi token
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return c.json({ error: 'Akses ditolak. Tidak ada token.' }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return c.json({ error: 'Token tidak valid.' }, 401);
  
  // Kedua, cek role admin
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return c.json({ error: 'Gagal mengambil profil user.' }, 500);
  }
  if (profile.role !== 'admin') {
    return c.json({ error: 'Akses terlarang. Hanya untuk admin.' }, 403);
  }

  // Lolos, teruskan
  c.set('user', user); // Teruskan data user (opsional)
  await next();
};


// -----------------------------------------------------------------
// 3. Rute API
// -----------------------------------------------------------------

// === Rute Admin (dilindungi 'adminAuth') ===
const adminRoutes = new Hono();
adminRoutes.use('*', adminAuth); // Terapkan 'adminAuth' ke SEMUA rute admin

// Menggabungkan logika CRUD Soal (dari 'api/admin/soal.js')
adminRoutes.get('/soal', async (c) => {
  const { id, paket_id } = c.req.query();
  
  if (id) { // Get Detail
    const { data, error } = await supabaseAdmin.from('soal').select('*').eq('id', id).single();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: 'Soal tidak ditemukan.' }, 404);
    return c.json({ data });
  }

  // Get List
  let query = supabaseAdmin.from('soal').select('id, nomor_soal, teks_soal, tipe_soal, paket_id, subtes_id').order('nomor_soal', { ascending: true });
  if (paket_id) query = query.eq('paket_id', paket_id);
  
  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

adminRoutes.post('/soal', async (c) => { // Tambah Soal
  const body = await c.req.json();
  const { data, error } = await supabaseAdmin.from('soal').insert([body]).select().single();
  if (error) return c.json({ error: `Gagal menyimpan: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil ditambahkan', data }, 201);
});

adminRoutes.put('/soal', async (c) => { // Edit Soal
  const { id } = c.req.query();
  const body = await c.req.json();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);

  const { data, error } = await supabaseAdmin.from('soal').update(body).eq('id', id).select().single();
  if (error) return c.json({ error: `Gagal mengupdate: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil diperbarui', data });
});

adminRoutes.delete('/soal', async (c) => { // Hapus Soal
  const { id } = c.req.query();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);

  const { error } = await supabaseAdmin.from('soal').delete().eq('id', id);
  if (error) return c.json({ error: `Gagal menghapus: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil dihapus' });
});


// === Rute Auth (Publik) ===
const authRoutes = new Hono();

authRoutes.post('/login', async (c) => { // dari 'api/auth/login.js'
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email dan password wajib diisi.' }, 400);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return c.json({ error: `Login gagal: ${error.message}` }, 401);
  return c.json({ message: 'Login berhasil', user: data.user, session: data.session });
});

authRoutes.post('/signup', async (c) => { // dari 'api/auth/signup.js'
  const { email, password, nama_lengkap } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email dan password wajib diisi.' }, 400);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { nama_lengkap: nama_lengkap || 'User Baru' } }
  });

  if (error) return c.json({ error: `Pendaftaran gagal: ${error.message}` }, 400);
  let message = data.session ? 'Pendaftaran berhasil.' : 'Pendaftaran berhasil. Cek email Anda.';
  return c.json({ message, user: data.user, session: data.session }, 201);
});

authRoutes.get('/user', userAuth, async (c) => { // dari 'api/auth/getUser.js'
  const user = c.get('user'); // Ambil user dari middleware 'userAuth'
  
  const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('nama_lengkap, role')
      .eq('id', user.id)
      .single();

  if (error) return c.json({ error: `Gagal mengambil profil: ${error.message}` }, 500);
  
  const userData = { ...user, ...profile };
  return c.json({ user: userData });
});


// === Rute Test (dilindungi 'userAuth') ===
const testRoutes = new Hono();
testRoutes.use('*', userAuth); // Terapkan 'userAuth' ke SEMUA rute tes

testRoutes.get('/getSoal', async (c) => { // dari 'api/test/getSoal.js'
  const { paket_id } = c.req.query();
  if (!paket_id) return c.json({ error: 'paket_id wajib ada di query.' }, 400);

  const { data, error } = await supabaseAdmin.from('soal').select('id, nomor_soal, tipe_soal, narasi_soal, teks_soal, opsi_jawaban, subtes_id').eq('paket_id', paket_id).order('nomor_soal', { ascending: true });
  if (error) return c.json({ error: error.message }, 500);

  const { data: paketData, error: paketError } = await supabaseAdmin.from('paket_soal').select('judul, config_subtes, waktu_total_menit, tipe_ujian').eq('id', paket_id).single();
  if (paketError) return c.json({ error: paketError.message }, 500);

  return c.json({ data, config: paketData });
});

testRoutes.post('/submit', async (c) => { // dari 'api/test/submit.js'
  const user = c.get('user');
  const body = await c.req.json();
  const { paket_id, tipe_ujian, jawaban_user, waktu_mulai, waktu_selesai } = body;

  const dataPekerjaan = { user_id: user.id, paket_id, tipe_ujian, jawaban_user, waktu_mulai, waktu_selesai };

  await kv.lpush('antrian_jawaban', dataPekerjaan);
  return c.json({ message: 'Jawaban diterima dan sedang diproses.' }, 202);
});

testRoutes.get('/getPembahasan', async (c) => { // dari 'api/test/getPembahasan.js'
  const user = c.get('user');
  const { history_id } = c.req.query();
  if (!history_id) return c.json({ error: 'history_id wajib ada di query.' }, 400);

  const { data: historyData, error: historyError } = await supabaseAdmin.from('history_tes').select('jawaban_user, paket_id').eq('id', history_id).eq('user_id', user.id).single();
  if (historyError || !historyData) return c.json({ error: 'Riwayat tes tidak ditemukan atau Anda tidak punya akses.' }, 404);

  const { data: soalData, error: soalError } = await supabaseAdmin.from('soal').select('*').eq('paket_id', historyData.paket_id).order('nomor_soal', { ascending: true });
  if (soalError) return c.json({ error: soalError.message }, 500);

  return c.json({ jawaban_user: historyData.jawaban_user, soal_lengkap: soalData });
});


// === Rute User (dilindungi 'userAuth') ===
const userRoutes = new Hono();
userRoutes.use('*', userAuth); // Terapkan 'userAuth' ke SEMUA rute user

userRoutes.get('/', async (c) => { // dari 'api/user.js'
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


// === Rute Cron (dilindungi 'cronSecret') ===
const cronRoutes = new Hono();

cronRoutes.post('/prosesSkor', async (c) => { // dari 'api/cron/prosesSkor.js'
  const authHeader = c.req.header('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: 'Akses tidak sah.' }, 401);
  }

  const antrian = await kv.lrange('antrian_jawaban', 0, -1);
  if (!antrian || antrian.length === 0) {
    return c.json({ message: 'Tidak ada pekerjaan. Antrian kosong.' });
  }
  
  // ... (Sisa logika cron job Anda - saya salin dari file 10)
  const batchHasilSkor = [];
  for (const dataSubmit of antrian) {
    const data = dataSubmit;
    let hasilSkor;
    if (data.tipe_ujian === 'skd') {
      hasilSkor = await hitungSkorSKD(data.jawaban_user, data.kunci_jawaban_paket); // Asumsi kunci diambil di sini
    } else if (data.tipe_ujian === 'utbk') {
      hasilSkor = await hitungSkorUTBK(data.jawaban_user, data.kunci_jawaban_paket); // Asumsi kunci diambil di sini
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

// -----------------------------------------------------------------
// 4. Hubungkan Semua Rute ke App Utama
// -----------------------------------------------------------------
app.route('/admin', adminRoutes);
app.route('/auth', authRoutes);
app.route('/test', testRoutes);
app.route('/user', userRoutes);
app.route('/cron', cronRoutes);

// -----------------------------------------------------------------
// 5. Ekspor Handler untuk Vercel
// -----------------------------------------------------------------
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
