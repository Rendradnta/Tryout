import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // 1. Impor koneksi Supabase
import { useNavigate, Link } from 'react-router-dom'; // 2. Impor navigasi

export default function SignupPage() {
  // 3. Siapkan state untuk form
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // Untuk pesan sukses
  const navigate = useNavigate();

  /**
   * Fungsi yang dipanggil saat form disubmit
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // 4. Panggil fungsi signup dari Supabase
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // 5. INTI: Kirim 'nama_lengkap' sebagai data tambahan
          // Ini akan dipakai oleh Database Trigger kita di backend
          data: {
            nama_lengkap: namaLengkap,
          }
        }
      });

      if (signupError) {
        throw signupError; // Lempar error jika gagal
      }
      
      // 6. Cek hasil: Apakah perlu konfirmasi email?
      if (data.session) {
        // Jika konfirmasi email dimatikan, user langsung login
        navigate('/');
      } else {
        // Jika konfirmasi email diaktifkan
        setMessage('Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.');
      }

    } catch (err) {
      console.error('Error signup:', err.message);
      setError(`Pendaftaran gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-3xl font-bold text-center mb-6">Buat Akun Baru</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        
        {/* Nama Lengkap */}
        <div>
          <label 
            htmlFor="nama_lengkap" 
            className="block text-sm font-medium text-gray-700"
          >
            Nama Lengkap
          </label>
          <input
            id="nama_lengkap"
            type="text"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Password */}
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6} // Supabase biasanya mewajibkan minimal 6 karakter
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {loading ? 'Mendaftarkan...' : 'Daftar'}
        </button>

        {/* Tampilkan Error */}
        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
        
        {/* Tampilkan Pesan Sukses */}
        {message && (
          <p className="text-center text-sm text-green-600">{message}</p>
        )}

      </form>
      
      {/* Link ke Login */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Login di sini
        </Link>
      </p>
    </div>
  );
}
