import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

// --- Ikon SVG ---
const MailIcon = () => (
  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const LockIcon = () => (
  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
// Ikon Loading Spinner untuk Tombol
const ButtonSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
// Ikon Error untuk Modal
const ErrorIcon = () => (
  <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);
// --- Akhir Ikon ---


// --- Komponen Modal Pop-up Modern ---
const ErrorModal = ({ message, onClose }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity"
    // Klik di luar modal untuk menutup
    onClick={onClose} 
  >
    <div 
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4"
      // Mencegah klik di dalam modal menutup modal
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="text-center">
        <ErrorIcon />
        <h3 className="mt-4 text-2xl font-semibold text-gray-900">
          Login Gagal
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
);
// --- Akhir Modal ---


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- PERUBAHAN STATE ERROR ---
  // Kita ganti 'error' menjadi 'modalError' agar lebih jelas
  const [modalError, setModalError] = useState(null); // 'null' berarti modal tersembunyi
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setModalError(null); // Tutup modal lama (jika ada)
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        throw loginError; 
      }
      
      navigate('/'); 

    } catch (err) {
      console.error('Error login:', err.message);
      
      // --- LOGIKA MODAL BARU ---
      // Menerjemahkan error teknis menjadi pesan ramah
      let friendlyMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Email atau password yang Anda masukkan salah.';
      } else if (err.message.includes('Email not confirmed')) {
        friendlyMessage = 'Email Anda belum dikonfirmasi. Silakan cek inbox Anda.';
      }
      
      setModalError(friendlyMessage); // Tampilkan modal dengan pesan ini
      
    } finally {
      setLoading(false); 
    }
  };

  return (
    // 1. Latar Belakang Halaman
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      
      {/* 2. Kartu Form Login */}
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        
        {/* 3. Logo Anda */}
        <div className="flex justify-center">
          <img 
            src="/logo.png" // Pastikan ini ada di folder 'public/'
            alt="Logo" 
            className="h-20 w-20" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            atau{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              daftar akun baru
            </Link>
          </p>
        </div>

        {/* 4. Form Modern */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Input Email dengan Ikon */}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MailIcon />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Alamat email"
                className="block w-full rounded-lg border-gray-300 py-3 pl-10 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Input Password dengan Ikon */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="block w-full rounded-lg border-gray-300 py-3 pl-10 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* --- BLOK ERROR LAMA DIHAPUS --- */}
          {/* Kita tidak lagi menampilkan error di sini */}

          {/* Tombol Submit dengan Spinner Loading */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full h-[48px] items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <ButtonSpinner /> : 'Login'}
          </button>
        </form>
      </div>

      {/* 5. Tampilkan Modal Pop-up jika ada error */}
      {modalError && (
        <ErrorModal 
          message={modalError} 
          onClose={() => setModalError(null)} 
        />
      )}

    </div>
  );
}