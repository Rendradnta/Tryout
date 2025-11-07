import { createClient } from '@supabase/supabase-js';

// PENTING: Untuk login, kita HARUS menggunakan ANON KEY,
// bukan SERVICE_ROLE_KEY, karena ini adalah alur autentikasi user.
// Service key (supabaseAdmin) tidak punya metode .auth.signInWithPassword()
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Buat client Supabase 'anon' khusus untuk file ini
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Serverless function tidak perlu simpan session
  }
});

export default async function handler(req, res) {
  // 1. Hanya izinkan metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil email dan password dari body
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  try {
    // 3. Coba loginkan user menggunakan Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // 4. Tangani jika login gagal (misal: password salah)
    if (error) {
      return res.status(401).json({ error: `Login gagal: ${error.message}` });
    }

    // 5. Berhasil! Kirim kembali data user dan session (termasuk token)
    // Frontend akan menyimpan 'access_token' dari 'session'
    return res.status(200).json({ 
      message: 'Login berhasil', 
      user: data.user, 
      session: data.session 
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
