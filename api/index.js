import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import { kv } from './lib/vercelKV.js';
import { hitungSkorSKD } from './lib/scoring/hitungSkorSKD.js';
import { hitungSkorUTBK } from './lib/scoring/hitungSkorUTBK.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

const app = new Hono().basePath('/api');

// --- (Middleware 'userAuth' dan 'adminAuth' Anda tetap sama persis) ---
const userAuth = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return c.json({ error: 'Akses ditolak. Token tidak ada.' }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return c.json({ error: 'Token tidak valid.' }, 401);
  const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role, premium_expires_at').eq('id', user.id).single();
  if (profileError) return c.json({ error: 'Gagal mengambil profil user.' }, 500);
  let isPremium = false;
  if (profile.premium_expires_at) {
    isPremium = new Date(profile.premium_expires_at) > new Date();
  }
  c.set('user', { ...user, role: profile.role, is_premium: isPremium, premium_expires_at: profile.premium_expires_at });
  await next();
};
const adminAuth = async (c, next) => {
  const user = c.get('user'); 
  if (user.role !== 'admin') {
    return c.json({ error: 'Akses terlarang. Hanya untuk admin.' }, 403);
  }
  await next();
};
const secureAdmin = [userAuth, adminAuth];

// --- Rute Admin ---
const adminRoutes = new Hono();
adminRoutes.use('*', ...secureAdmin); 

// (Rute /soal dan /paket Anda tetap sama)
adminRoutes.get('/soal', async (c) => { /* ... (Logika Get Soal List/Detail) ... */ 
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
adminRoutes.post('/soal', async (c) => { /* ... (Logika Tambah Soal) ... */ 
  const body = await c.req.json();
  const { data, error } = await supabaseAdmin.from('soal').insert([body]).select().single();
  if (error) return c.json({ error: `Gagal menyimpan: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil ditambahkan', data }, 201);
});
adminRoutes.put('/soal', async (c) => { /* ... (Logika Edit Soal) ... */ 
  const { id } = c.req.query();
  const body = await c.req.json();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);
  const { data, error } = await supabaseAdmin.from('soal').update(body).eq('id', id).select().single();
  if (error) return c.json({ error: `Gagal mengupdate: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil diperbarui', data });
});
adminRoutes.delete('/soal', async (c) => { /* ... (Logika Hapus Soal) ... */ 
  const { id } = c.req.query();
  if (!id) return c.json({ error: 'ID Soal wajib ada di query.' }, 400);
  const { error } = await supabaseAdmin.from('soal').delete().eq('id', id);
  if (error) return c.json({ error: `Gagal menghapus: ${error.message}` }, 500);
  return c.json({ message: 'Soal berhasil dihapus' });
});
adminRoutes.get('/paket', async (c) => { /* ... (Logika Get Paket Admin) ... */ 
  const { data, error } = await supabaseAdmin.from('paket_soal').select('*').order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});
adminRoutes.post('/paket', async (c) => { /* ... (Logika Buat Paket) ... */ 
  const body = await c.req.json();
  const dataToInsert = { ...body, is_published: false };
  const { data, error } = await supabaseAdmin.from('paket_soal').insert(dataToInsert).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: 'Paket berhasil dibuat', data }, 201);
});
adminRoutes.put('/paket', async (c) => { /* ... (Logika Update Paket) ... */ 
  const { id } = c.req.query();
  const body = await c.req.json();
  if (!id) return c.json({ error: 'ID Paket wajib ada di query.' }, 400);
  const { data, error } = await supabaseAdmin.from('paket_soal').update(body).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: 'Paket berhasil diperbarui', data });
});
adminRoutes.delete('/paket', async (c) => { /* ... (Logika Hapus Paket) ... */ 
  const { id } = c.req.query();
  if (!id) return c.json({ error: 'ID Paket wajib ada di query.' }, 400);
  const { error } = await supabaseAdmin.from('paket_soal').delete().eq('id', id);
  if (error) return c.json({ error: `Gagal menghapus paket: ${error.message}` }, 500);
  return c.json({ message: 'Paket (dan semua soal di dalamnya) berhasil dihapus' });
});

// --- PERBAIKAN DI RUTE INI ---
adminRoutes.get('/users', async (c) => {
  // Mengambil SEMUA user untuk ditampilkan di dashboard admin
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nama_lengkap, email, role, premium_expires_at');
    // --- BARIS .order() DIHAPUS ---
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});
// --- AKHIR PERBAIKAN ---

adminRoutes.put('/users', async (c) => { /* ... (Logika Update User) ... */ 
  const { id } = c.req.query();
  const body = await c.req.json();
  if (!id) return c.json({ error: 'ID User wajib ada di query.' }, 400);
  const dataToUpdate = { role: body.role, premium_expires_at: body.premium_expires_at };
  const { data, error } = await supabaseAdmin.from('profiles').update(dataToUpdate).eq('id', id).select().single();
  if (error) return c.json({ error: `Gagal mengupdate user: ${error.message}` }, 500);
  return c.json({ message: 'User berhasil diperbarui', data });
});
adminRoutes.delete('/users', async (c) => { /* ... (Logika Hapus User) ... */ 
  const { id } = c.req.query();
  if (!id) return c.json({ error: 'ID User wajib ada di query.' }, 400);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return c.json({ error: `Gagal menghapus user: ${error.message}` }, 500);
  return c.json({ message: 'User (dan semua datanya) berhasil dihapus' });
});


// === Rute Auth (/api/auth/...) (Tetap Sama) ===
const authRoutes = new Hono();
authRoutes.post('/login', async (c) => { /* ... (Logika Login) ... */ 
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email dan password wajib diisi.' }, 400);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: `Login gagal: ${error.message}` }, 401);
  return c.json({ message: 'Login berhasil', user: data.user, session: data.session });
});
authRoutes.post('/signup', async (c) => { /* ... (Logika Signup) ... */ 
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
  const { data: profile, error }_ = await supabaseAdmin.from('profiles').select('nama_lengkap').eq('id', user.id).single();
  if (error) return c.json({ error: `Gagal mengambil profil: ${error.message}` }, 500);
  return c.json({ user: { ...user, ...profile } });
});

// === Rute Test (/api/test/...) (Tetap Sama) ===
const testRoutes = new Hono();
testRoutes.use('*', userAuth);
testRoutes.get('/getSoal', async (c) => { 
  const user = c.get('user'); 
  const { paket_id } = c.req.query();
  if (!paket_id) return c.json({ error: 'paket_id wajib ada di query.' }, 400);
  const { data: paketData, error: paketError } = await supabaseAdmin.from('paket_soal').select('judul, config_subtes, waktu_total_menit, tipe_ujian, is_premium').eq('id', paket_id).single();
  if (paketError) return c.json({ error: (paketError).message }, 500);
  if (paketData.is_premium && !user.is_premium) {
    return c.json({ error: 'Anda memerlukan akun premium untuk mengakses tryout ini.' }, 403); 
  }
  const { data, error } = await supabaseAdmin.from('soal').select('id, nomor_soal, tipe_soal, narasi_soal, teks_soal, opsi_jawaban, subtes_id').eq('paket_id', paket_id).order('nomor_soal', { ascending: true });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data, config: paketData });
});
testRoutes.post('/submit', async (c) => { /* ... (Logika Submit) ... */ 
  const user = c.get('user');
  const body = await c.req.json();
  const dataPekerjaan = { user_id: user.id, ...body };
  await kv.lpush('antrian_jawaban', dataPekerjaan);
  return c.json({ message: 'Jawaban diterima dan sedang diproses.' }, 202);
});
testRoutes.get('/getPembahasan', async (c) => { /* ... (Logika Get Pembahasan) ... */ 
  const user = c.get('user');
  const { history_id } = c.req.query();
  if (!history_id) return c.json({ error: 'history_id wajib ada di query.' }, 400);
  const { data: historyData, error: historyError } = await supabaseAdmin.from('history_tes').select('jawaban_user, paket_id').eq('id', history_id).eq('user_id', user.id).single();
  if (historyError || !historyData) return c.json({ error: 'Riwayat tes tidak ditemukan.' }, 404);
  const { data: soalData, error: soalError } = await supabaseAdmin.from('soal').select('*').eq('paket_id', historyData.paket_id).order('nomor_soal', { ascending: true });
  if (soalError) return c.json({ error: soalError.message }, 500);
  return c.json({ jawaban_user: historyData.jawaban_user, soal_lengkap: soalData });
});


// === Rute User (/api/user) (Tetap Sama) ===
const userRoutes = new Hono();
userRoutes.use('*', userAuth); 
userRoutes.get('/', async (c) => { 
  const user = c.get('user');
  const { action, paket_id }_ = c.req.query();
  if (action === 'getHistory') {
    const { data, error } = await supabaseAdmin.from('history_tes').select('id, waktu_selesai, skor_total, status, paket_soal ( id, judul, tipe_ujian )').eq('user_id', user.id).order('waktu_selesai', { ascending: false });
    if (error) return c.json({ error: `Gagal mengambil riwayat: ${error.message}` }, 500);
    return c.json({ data });
  }
  if (action === 'getDashboardData') {
    try {
      const [paketRes, historyRes]_ = await Promise.all([
        supabaseAdmin.from('paket_soal').select('id, judul, deskripsi, tipe_ujian, max_attempts, is_premium').eq('is_published', true).order('created_at', { ascending: false }),
        supabaseAdmin.from('history_tes').select('id, skor_total, waktu_selesai, paket_id, paket_soal(judul)').eq('user_id', user.id).eq('status', 'selesai').order('waktu_selesai', { ascending: false })
      ]);
      if (paketRes.error) throw paketRes.error;
      if (historyRes.error) throw historyRes.error;
      const historyData = historyRes.data || [];
      const paketData = paketRes.data || [];
      const totalTes = historyData.length;
      let skorTerbaik = 0;
      let rataRata = 0;
      if (totalTes > 0) {
        const semuaSkor = historyData.map(h => h.skor_total);
        skorTerbaik = Math.max(...semuaSkor);
        rataRata = (semuaSkor.reduce((acc, skor) => acc + skor, 0) / totalTes).toFixed(1);
      }
      const attemptsCount = {};
      for (const h of historyData) {
        attemptsCount[h.paket_id] = (attemptsCount[h.paket_id] || 0) + 1;
      }
      const paketSoalWithAttempts = paketData.map(paket => ({
        ...paket,
        attempts_taken: attemptsCount[paket.id] || 0
      }));
      return c.json({
        profile: { 
            nama_lengkap: user.nama_lengkap,
            is_premium: user.is_premium,
            premium_expires_at: user.premium_expires_at
        },
        stats: { totalTes, skorTerbaik, rataRata },
        paketSoal: paketSoalWithAttempts,
        recentHistory: historyData.slice(0, 5) 
      });
    } catch (err) {
      return c.json({ error: `Gagal mengambil data dashboard: ${err.message}` }, 500);
    }
  }
  if (action === 'getPeringkat') {
    if (!paket_id) return c.json({ error: 'paket_id wajib ada di query.' }, 400);
    const { data, error } = await supabaseAdmin.rpc('get_peringkat', { paket_uuid: paket_id });
    if (error) {
        console.error('Error RPC get_peringkat:', error);
        return c.json({ error: `Gagal mengambil peringkat: ${error.message}` }, 500);
    }
    return c.json({ data: data });
  }
  return c.json({ error: 'Aksi tidak valid.' }, 400);
});

// === Rute Cron (Tetap Sama) ===
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
    const { data: kunciJawabanPaket, error: kunciError } = await supabaseAdmin.from('soal').select('id, subtes_id, tipe_soal, kunci_jawaban').eq('paket_id', data.paket_id);
    if(kunciError || !kunciJawabanPaket) { console.error(`Gagal ambil kunci untuk paket ${data.paket_id}: ${kunciError?.message}`); continue; }
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

// 4. Hubungkan Rute ke App Utama
app.route('/admin', adminRoutes);
app.route('/auth', authRoutes);
app.route('/test', testRoutes);
app.route('/user', userRoutes); 

// 5. Ekspor Handler untuk Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);