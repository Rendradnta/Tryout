import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

// --- Ikon SVG ---
const UserIcon = () => (
  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
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
const ButtonSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const ErrorIcon = () => (
  <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);
// Ikon Sukses untuk Modal
const SuccessIcon = () => (
  <svg className="h-12 w-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);
// --- Akhir Ikon ---


// --- Komponen Modal (Pop-up) ---
const Modal = ({ title, message, icon, onClose }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity"
    onClick={onClose} 
  >
    <div 
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="text-center">
        {icon}
        <h3 className="mt-4 text-2xl font-semibold text-gray-900">
          {title}
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


export default function SignupPage() {
  // --- Logika State (Dimodifikasi) ---
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State untuk modal (menggantikan 'error' dan 'message')
  const [modalError, setModalError] = useState(null); 
  const [modalSuccess, setModalSuccess] = useState(null);
  
  const navigate = useNavigate();

  // --- Logika HandleSignup (Dimodifikasi) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nama_lengkap: namaLengkap,
          }
        }
      });

      if (signupError) {
        throw signupError;
      }
      
      if (data.session) {
        // Jika konfirmasi email dimatikan, user langsung login
        navigate('/');
      } else {
        // Jika konfirmasi email diaktifkan, tampilkan modal sukses
        setModalSuccess('Pendaftaran berhasil. Silakan cek inbox email Anda untuk konfirmasi.');
      }

    } catch (err) {
      console.error('Error signup:', err.message);
      // Menerjemahkan error teknis menjadi pesan ramah
      let friendlyMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.message.includes('Password should be at least 6 characters')) {
        friendlyMessage = 'Password Anda terlalu lemah. Harap gunakan minimal 6 karakter.';
      } else if (err.message.includes('User already registered')) {
        friendlyMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.';
      }
      
      setModalError(friendlyMessage); // Tampilkan modal error
    } finally {
      setLoading(false);
    }
  };

  // --- Tampilan JSX (MODERN) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        
        <div className="flex justify-center">
          {/* Taruh logo Anda di folder 'public/logo-rs.jpg' */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 w-20" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            atau{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              masuk ke akun Anda
            </Link>
          </p>
        </div>

        {/* Form Modern */}
        <form onSubmit={handleSignup} className="space-y-6">
          
          {/* Input Nama Lengkap dengan Ikon */}
          <div>
            <label htmlFor="nama_lengkap" className="sr-only">Nama Lengkap</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon />
              </span>
              <input
                id="nama_lengkap"
                type="text"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                required
                placeholder="Nama Lengkap"
                className="block w-full rounded-lg border-gray-300 py-3 pl-10 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          </div>

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
                minLength={6}
                placeholder="Password (minimal 6 karakter)"
                className="block w-full rounded-lg border-gray-300 py-3 pl-10 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* --- BLOK ERROR LAMA DIHAPUS --- */}

          {/* Tombol Submit dengan Spinner Loading */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full h-[48px] items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <ButtonSpinner /> : 'Daftar Akun'}
          </button>
        </form>
      </div>

      {/* Tampilkan Modal Error jika ada */}
      {modalError && (
        <Modal 
          title="Pendaftaran Gagal"
          message={modalError} 
          icon={<ErrorIcon />}
          onClose={() => setModalError(null)} 
        />
      )}
      
      {/* Tampilkan Modal Sukses jika ada */}
      {modalSuccess && (
        <Modal 
          title="Pendaftaran Berhasil"
          message={modalSuccess} 
          icon={<SuccessIcon />}
          onClose={() => setModalSuccess(null)} 
        />
      )}
    </div>
  );
}