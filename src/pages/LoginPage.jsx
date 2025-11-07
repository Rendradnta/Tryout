import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // 1. Impor koneksi Supabase
import { useNavigate, Link } from 'react-router-dom'; // 2. Impor navigasi

export default function LoginPage() {
  // 3. Siapkan state untuk form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // 4. Hook untuk pindah halaman

  /**
   * Fungsi yang dipanggil saat form disubmit
   */
  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah refresh halaman
    setError(null);
    setLoading(true);

    try {
      // 5. Panggil fungsi login dari Supabase
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        throw loginError; // Lempar error jika gagal
      }

      // 6. Jika berhasil, pindahkan user ke Dashboard
      console.log('Login berhasil:', data);
      navigate('/'); // Arahkan ke halaman utama (Dashboard)

    } catch (err) {
      console.error('Error login:', err.message);
      setError(`Login gagal: ${err.message}`);
    } finally {
      setLoading(false); // Hentikan loading
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>

        {/* Tampilkan Error */}
        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </form>
      
      {/* Link ke Signup */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
        }
