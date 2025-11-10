import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Impor Ikon (menambahkan CheckSquare untuk tombol 'disabled')
import { 
  Award,
  Target,
  CheckSquare, // <-- IKON BARU
  BookOpen,
  ArrowRight,
  FileText 
} from 'lucide-react';

// Impor komponen Loading Anda
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

// --- Komponen Internal: Kartu Statistik ---
const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  return (
    <motion.div
      className={`rounded-2xl bg-white p-6 shadow-lg border-l-4 ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${color.replace('border', 'bg').replace('-500', '-100')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border', 'text').replace('-500', '-600')}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Komponen Internal: Kartu Paket Ujian (DIMODIFIKASI) ---
const PaketCard = ({ paket, index }) => {
  const isUTBK = paket.tipe_ujian === 'utbk';
  const tagColor = isUTBK ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  
  // --- LOGIKA BARU (LANGKAH 5) ---
  // Cek apakah paket ini punya batas pengerjaan
  const isOneTimeTry = paket.max_attempts === 1;
  // Cek apakah user sudah mengerjakannya
  const hasAttempted = paket.attempts_taken >= 1;
  // Kunci tombol jika ini 1x Coba DAN user sudah mengerjakan
  const isLocked = isOneTimeTry && hasAttempted;
  
  const hoverColor = isLocked ? 'hover:border-gray-300' : (isUTBK ? 'hover:border-blue-500' : 'hover:border-green-500');

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 ${hoverColor} border-2 ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-transparent'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <BookOpen className={`h-10 w-10 transition-all ${isLocked ? 'text-gray-300' : 'text-gray-300 group-hover:text-blue-500'}`} />
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isLocked ? 'bg-gray-200 text-gray-700' : tagColor}`}>
            {paket.tipe_ujian.toUpperCase()}
          </span>
        </div>
        <h3 className={`mt-4 text-xl font-bold ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
          {paket.judul}
        </h3>
        <p className={`mt-1 text-sm ${isLocked ? 'text-gray-500' : 'text-gray-600'}`}>
          {paket.deskripsi || 'Tidak ada deskripsi.'}
        </p>
        
        {/* --- TOMBOL DINAMIS (LANGKAH 5) --- */}
        {isLocked ? (
          <button
            disabled
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 cursor-not-allowed"
          >
            Sudah Dikerjakan
            <CheckSquare className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to={`/konfirmasi/${paket.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Mulai Kerjakan
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {/* --- AKHIR TOMBOL DINAMIS --- */}

      </div>
    </motion.div>
  );
};

// --- Komponen Internal: Item Riwayat Terakhir (Tetap Sama) ---
const HistoryItem = ({ item }) => (
  <Link 
    to={`/pembahasan/${item.id}`} 
    className="block rounded-lg p-4 transition-colors hover:bg-gray-100"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {item.paket_soal?.judul || 'Tes Dihapus'}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(item.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
      <p className="text-lg font-bold text-blue-600">{item.skor_total}</p>
    </div>
  </Link>
);


// --- Komponen Utama: Dashboard ---
export default function Dashboard() {
  // --- STATE BARU (LANGKAH 5) ---
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalTes: 0, skorTerbaik: 0, rataRata: 0 });
  const [paketSoal, setPaketSoal] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- useEffect DIMODIFIKASI (LANGKAH 5) ---
  // Hanya memanggil 1 API 'getDashboardData'
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");

        // Panggil API 'pintar' yang baru kita buat
        const res = await fetch('/api/user?action=getDashboardData', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat data dashboard.");
        }

        const data = await res.json();
        
        // Set semua state dari satu panggilan
        setProfile(data.profile);
        setStats(data.stats);
        setPaketSoal(data.paketSoal);
        setRecentHistory(data.recentHistory);

      } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // [] = jalankan sekali

  // --- useMemo DIBUANG (LANGKAH 5) ---
  // (Kalkulasi statistik sekarang dilakukan di backend)

  // --- Tampilan Render (MODERN) ---
  if (loading) {
    return <LoadingSpinner text="Memuat dashboard Anda..." />;
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 1. Header Sapaan */}
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Selamat Datang, {profile?.nama_lengkap || 'Peserta'}!
      </h1>

      {/* 2. Kartu Statistik Cepat (Data dari state 'stats') */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Tes Dikerjakan" 
          value={stats.totalTes} 
          icon={CheckSquare}
          color="border-blue-500"
        />
        <StatCard 
          title="Skor Terbaik" 
          value={stats.skorTerbaik} 
          icon={Award}
          color="border-green-500"
        />
        <StatCard 
          title="Rata-rata Skor" 
          value={stats.rataRata} 
          icon={Target}
          color="border-yellow-500"
        />
      </div>
      
      {/* 3. Layout 2 Kolom (Aksi vs Info) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Kolom Kiri (Lebar) - Daftar Paket */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Daftar Paket Ujian
          </h2>
          {error && (
            <p className="text-red-600">Terjadi kesalahan: {error}</p>
          )}
          {!error && paketSoal.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {paketSoal.map((paket, i) => (
                <PaketCard key={paket.id} paket={paket} index={i} />
              ))}
            </div>
          ) : (
            !error && <p className="text-gray-500">Saat ini tidak ada paket ujian yang tersedia.</p>
          )}
        </div>

        {/* Kolom Kanan (Sempit) - Aktivitas Terakhir (Data dari state 'recentHistory') */}
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Aktivitas Terakhir
          </h2>
          {recentHistory.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-white p-4 shadow-lg">
              {recentHistory.map(item => (
                <HistoryItem key={item.id} item={item} />
              ))}
              <Link 
                to="/history" 
                className="block pt-3 text-center text-sm font-medium text-blue-600 hover:underline"
              >
                Lihat semua riwayat
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">Anda belum mengerjakan tes apapun.</p>
          )}
        </div>

      </div>
    </motion.div>
  );
                                                           }
