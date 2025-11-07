import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Impor koneksi Supabase
import { Link } from 'react-router-dom'; // Untuk tombol "Mulai"

// Komponen kecil untuk Loading
const LoadingSpinner = () => (
  <div className="text-center py-10">
    <p className="text-lg text-gray-600">Memuat paket ujian...</p>
    {/* Anda bisa ganti ini dengan spinner SVG */}
  </div>
);

// Komponen kecil untuk Kartu Paket
const PaketCard = ({ paket }) => {
  // Memberi warna berbeda berdasarkan tipe
  const borderColor = paket.tipe_ujian === 'utbk' ? 'border-blue-500' : 'border-green-500';
  const tagColor = paket.tipe_ujian === 'utbk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden border-l-4 ${borderColor}`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">{paket.judul}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColor}`}>
            {paket.tipe_ujian.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {paket.deskripsi || 'Tidak ada deskripsi.'}
        </p>
        <Link
          to={`/konfirmasi/${paket.id}`}
          className="w-full text-center inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Mulai Kerjakan
        </Link>
      </div>
    </div>
  );
};

export default function Dashboard() {
  // 1. State untuk user, paket, loading, dan error
  const [user, setUser] = useState(null);
  const [paketSoal, setPaketSoal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect untuk mengambil data saat halaman dimuat
  useEffect(() => {
    // Fungsi untuk mengambil data user dan paket
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ambil data user yang sedang login
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        // Ambil data profil user (untuk nama)
        // INI MEMBUTUHKAN RLS (Row Level Security)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nama_lengkap')
          .eq('id', authUser.id)
          .single();
        
        if (profileError) throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        
        setUser(profile || authUser); // Set user dengan nama lengkap jika ada

        // Ambil daftar paket soal
        // INI MEMBUTUHKAN RLS (Misal: Izinkan 'SELECT' untuk semua user terotentikasi)
        const { data: paketData, error: paketError } = await supabase
          .from('paket_soal')
          .select('id, judul, deskripsi, tipe_ujian') // Hanya ambil yg perlu
          .order('created_at', { ascending: false }); // Tampilkan yg terbaru di atas

        if (paketError) throw paketError;

        setPaketSoal(paketData); // Simpan daftar paket ke state

      } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // [] berarti hanya jalan sekali saat halaman dimuat

  // --- Tampilan Render ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Selamat Datang, {user?.nama_lengkap || user?.email || 'Peserta'}!
      </h1>

      <p className="text-lg text-gray-700">
        Pilih paket ujian yang tersedia di bawah ini untuk memulai simulasi.
      </p>

      <hr />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Daftar Paket Ujian</h2>
        {loading && <LoadingSpinner />}
        
        {error && (
          <p className="text-red-600 text-center">Terjadi kesalahan: {error}</p>
        )}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paketSoal.length > 0 ? (
              paketSoal.map((paket) => (
                <PaketCard key={paket.id} paket={paket} />
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center">
                Belum ada paket ujian yang tersedia.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
