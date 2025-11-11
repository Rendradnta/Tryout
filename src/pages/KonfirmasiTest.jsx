import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx'; // Impor loading kustom Anda

// --- Impor Ikon ---
import {
  UserCheck,      // Untuk Info Peserta
  FileSpreadsheet, // Untuk Info Tes
  CheckCircle,    // Untuk Checkbox
  ArrowRight,     // Untuk Tombol Mulai
  AlertTriangle   // Untuk Error
} from 'lucide-react';

// --- Komponen Error (jika gagal fetch) ---
const ErrorState = ({ error }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
    <div className="w-full max-w-md text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Terjadi Kesalahan</h2>
      <p className="mt-2 text-sm text-gray-600">
        {error || "Tidak dapat memuat detail ujian."}
      </p>
      <Link 
        to="/dashboard" 
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:bg-blue-700"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  </div>
);


export default function KonfirmasiTest() {
  const [user, setUser] = useState(null);
  const [paketInfo, setPaketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false); // State untuk checkbox

  const { paketId } = useParams(); 
  const navigate = useNavigate(); 

  // --- useEffect (Dimodifikasi agar lebih efisien) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Ambil User (wajib pertama)
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

        // 2. Ambil Profil dan Paket secara paralel (lebih cepat)
        const [profileRes, paketRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nama_lengkap, foto_url')
            .eq('id', authUser.id)
            .single(),
          supabase
            .from('paket_soal')
            .select('judul, tipe_ujian, waktu_total_menit, config_subtes') // Ambil info waktu juga
            .eq('id', paketId)
            .single()
        ]);
        
        if (profileRes.error) throw new Error(`Gagal mengambil profil: ${profileRes.error.message}`);
        if (paketRes.error) throw new Error(`Paket soal tidak ditemukan: ${paketRes.error.message}`);
        
        setUser(profileRes.data || authUser);
        setPaketInfo(paketRes.data);

      } catch (err) {
        console.error('Error fetching confirmation data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paketId]); 

  // Fungsi untuk memulai tes (Tetap Sama)
  const handleStartTest = () => {
    if (isReady) {
      navigate(`/kerjakan/${paketId}`); 
    }
  };

  // --- Tampilan Render (MODERN) ---

  if (loading) {
    return <LoadingSpinner text="Mempersiapkan ujian..." />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Menghitung detail waktu untuk ditampilkan
  let detailWaktu = '';
  if (paketInfo?.tipe_ujian === 'skd') {
    detailWaktu = `${paketInfo.waktu_total_menit} Menit`;
  } else if (paketInfo?.config_subtes) {
    detailWaktu = `${paketInfo.config_subtes.length} Subtes`;
  }

  return (
    // Latar belakang abu-abu
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      
      {/* Kartu "Mengambang" dengan animasi */}
      <motion.div 
        className="w-full max-w-2xl space-y-8 rounded-2xl bg-white p-8 sm:p-10 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Konfirmasi Data Peserta
        </h1>
        
        {/* Info Peserta */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src={user?.foto_url || `https://ui-avatars.com/api/?name=${user?.nama_lengkap || user?.email}&background=random&color=fff`}
            alt="Foto Profil"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
          />
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{user?.nama_lengkap || 'Nama Tidak Ditemukan'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Detail Ujian (Desain "Tiket") */}
        <div className="border-t border-b border-dashed border-gray-300 py-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Detail Ujian
          </h2>
          {/* Menggunakan <dl> untuk data yang lebih semantik dan rapi */}
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Nama Ujian</dt>
              <dd className="text-sm font-semibold text-gray-900">{paketInfo?.judul || '...'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Tipe Ujian</dt>
              <dd className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-semibold text-blue-800">
                {paketInfo?.tipe_ujian.toUpperCase() || '...'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Waktu/Subtes</dt>
              <dd className="text-sm font-semibold text-gray-900">{detailWaktu}</dd>
            </div>
          </dl>
        </div>

        {/* Checkbox Konfirmasi (Interaktif) */}
        <label 
          htmlFor="konfirmasiData" 
          className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-100"
        >
          <input
            type="checkbox"
            id="konfirmasiData"
            checked={isReady}
            onChange={(e) => setIsReady(e.target.checked)}
            className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="font-semibold text-gray-800">Data Saya Benar</span>
            <p className="text-sm text-gray-600">
              Saya telah memeriksa data di atas dan siap memulai ujian. Waktu akan dimulai saat saya menekan tombol "Mulai Ujian".
            </p>
          </div>
        </label>

        {/* Tombol Mulai (Premium & Interaktif) */}
        <button
          onClick={handleStartTest}
          disabled={!isReady}
          className="flex w-full h-[52px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300
                     hover:bg-blue-700 hover:shadow-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-md disabled:hover:bg-gray-400"
        >
          Mulai Ujian
          <motion.div
            animate={{ x: isReady ? [0, 5, 0] : 0 }}
            transition={{ repeat: isReady ? Infinity : 0, duration: 1.5 }}
          >
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </button>
      </div>
    </div>
  );
}