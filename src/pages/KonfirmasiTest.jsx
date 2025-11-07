import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useParams, useNavigate, Link } from 'react-router-dom'; // 1. Impor useParams

// Komponen Loading
const LoadingScreen = () => (
  <div className="text-center py-20">
    <p className="text-xl text-gray-700">Mempersiapkan ujian...</p>
    {/* Anda bisa tambahkan spinner di sini */}
  </div>
);

export default function KonfirmasiTest() {
  // 2. State untuk data, loading, dan checkbox
  const [user, setUser] = useState(null);
  const [paketInfo, setPaketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false); // State untuk checkbox

  const { paketId } = useParams(); // 3. Ambil 'paketId' dari URL
  const navigate = useNavigate(); // 4. Untuk pindah ke halaman tes

  // 5. useEffect untuk mengambil data user DAN data paket
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // --- Ambil Data User (Sama seperti Dashboard) ---
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nama_lengkap, foto_url') // Asumsi Anda punya 'foto_url'
          .eq('id', authUser.id)
          .single();
        
        if (profileError) throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        setUser(profile || authUser);

        // --- Ambil Data Spesifik Paket Ini ---
        // (Membutuhkan RLS: Izinkan user terotentikasi membaca 'paket_soal')
        const { data: paketData, error: paketError } = await supabase
          .from('paket_soal')
          .select('judul, tipe_ujian')
          .eq('id', paketId) // Hanya ambil paket yang ID-nya dari URL
          .single();

        if (paketError) throw new Error(`Paket soal tidak ditemukan: ${paketError.message}`);
        setPaketInfo(paketData);

      } catch (err) {
        console.error('Error fetching confirmation data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paketId]); // 6. Jalankan ulang jika paketId berubah

  // 7. Fungsi untuk memulai tes
  const handleStartTest = () => {
    if (isReady) {
      navigate(`/kerjakan/${paketId}`); // Arahkan ke halaman pengerjaan
    }
  };

  // --- Tampilan Render ---
  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <h2 className="text-2xl font-bold mb-4">Terjadi Kesalahan</h2>
        <p>{error}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white shadow-lg rounded-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Konfirmasi Data Peserta</h1>
      
      <div className="flex flex-col items-center space-y-4 mb-8">
        {/* Foto Profil */}
        <img
          src={user?.foto_url || `https://ui-avatars.com/api/?name=${user?.nama_lengkap || user?.email}&background=random`}
          alt="Foto Profil"
          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
        />
        {/* Data Diri */}
        <div className="text-center">
          <p className="text-xl font-semibold">{user?.nama_lengkap || 'Nama Tidak Ditemukan'}</p>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      {/* Detail Ujian */}
      <div className="border-t border-b border-gray-200 py-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Detail Ujian</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Nama Ujian:</span>
            <span className="font-medium">{paketInfo?.judul || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tipe Ujian:</span>
            <span className="font-medium uppercase">{paketInfo?.tipe_ujian || '...'}</span>
          </div>
          {/* Anda bisa tambahkan info lain seperti jumlah soal/waktu jika perlu */}
        </div>
      </div>

      {/* Checkbox Konfirmasi */}
      <div className="flex items-center space-x-3 mb-6">
        <input
          type="checkbox"
          id="konfirmasiData"
          checked={isReady}
          onChange={(e) => setIsReady(e.target.checked)}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="konfirmasiData" className="text-sm text-gray-700">
          Data saya sudah benar dan saya siap memulai ujian.
        </label>
      </div>

      {/* Tombol Mulai */}
      <button
        onClick={handleStartTest}
        disabled={!isReady || loading}
        className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Mulai Ujian
      </button>
    </div>
  );
    }
