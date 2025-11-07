import { createClient } from '@supabase/supabase-js';

// Sama seperti login, kita pakai ANON KEY untuk alur auth publik
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export default async function handler(req, res) {
  // 1. Hanya izinkan metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan` });
  }

  // 2. Ambil data pendaftaran dari body
  // Kita tambahkan 'nama_lengkap' (atau data profil lain)
  const { email, password, nama_lengkap } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  try {
    // 3. Coba daftarkan user baru
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // 4. INTI: Kirim data tambahan (seperti nama)
        // Data ini akan dipakai oleh Trigger Database kita nanti
        data: {
          nama_lengkap: nama_lengkap || 'User Baru' 
        }
      }
    });

    // 5. Tangani jika pendaftaran gagal
    // (Misal: user sudah ada, password terlalu lemah)
    if (error) {
      return res.status(400).json({ error: `Pendaftaran gagal: ${error.message}` });
    }

    // 6. Berhasil!
    // Cek apakah Supabase Anda mewajibkan konfirmasi email
    let message = 'Pendaftaran berhasil.';
    if (data.user && !data.session) {
      message = 'Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.';
    }

    // Kirim kembali data user dan session (jika ada)
    return res.status(201).json({ 
      message: message, 
      user: data.user, 
      session: data.session 
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Terjadi kesalahan server: ${err.message}` });
  }
}
