import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Impor Ikon (Tambahkan 'Gem' untuk premium) ---
import { 
  Award,
  Target,
  CheckSquare,
  BookOpen,
  ArrowRight,
  FileText,
  Gem, // <-- IKON BARU
  Lock // <-- IKON BARU
} from 'lucide-react';

// Impor komponen Loading Anda
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

// --- Komponen Internal: Kartu Statistik (Tetap Sama) ---
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

// --- Komponen Internal: Kartu Paket Ujian (DIMODIFIKASI TOTAL) ---
const PaketCard = ({ paket, index, isUserPremium }) => {
  const isUTBK = paket.tipe_ujian === 'utbk';
  const tagColor = isUTBK ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  
  // --- LOGIKA BARU (LANGKAH 5) ---
  const isPaketPremium = paket.is_premium;
  const isOneTimeTry = paket.max_attempts === 1;
  const hasAttempted = paket.attempts_taken >= 1;

  // Tentukan status terkunci
  const isLockedByAttempts = isOneTimeTry && hasAttempted;
  const isLockedByPremium = isPaketPremium && !isUserPremium; // <-- KUNCI BARU
  const isLocked = isLockedByAttempts || isLockedByPremium;
  
  // Tentukan teks tombol
  let buttonText = "Mulai Kerjakan";
  let ButtonIcon = ArrowRight;
  if (isLockedByAttempts) {
    buttonText = "Sudah Dikerjakan";
    ButtonIcon = CheckSquare;
  }
  if (isLockedByPremium) {
    buttonText = "Perlu Premium";
    ButtonIcon = Lock;
  }
  
  const hoverColor = isLocked ? 'hover:border-gray-300' : (isUTBK ? 'hover:border-blue-500' : 'hover:border-green-500');

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 ${hoverColor} border-2 ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-transparent'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Badge Premium (BARU) */}
      {isPaketPremium && (
        <div className="absolute top-0 right-0 z-10 -mr-1 -mt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-md">
            <Gem className="h-5 w-5 text-yellow-900" />
          </div>
        </div>
      )}
      
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
            className={`mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold cursor-not-allowed
              ${isLockedByPremium ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-300 text-gray-600'}
            `}
          >
            {buttonText}
            <ButtonIcon className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to={`/konfirmasi/${paket.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Mulai Kerjakan
            <ButtonIcon className="h-4 w-4" />
          </Link>
        )}
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

// --- [BARU] Komponen Status Premium di Sidebar ---
const PremiumStatusCard = ({ profile }) => {
  if (profile?.is_premium) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <Gem className="h-8 w-8 text-white" />
          <div>
            <h3 className="text-lg font-bold text-yellow-900">Akun Premium</h3>
            <p className="text-xs text-yellow-800">
              Aktif s/d {new Date(profile.premium_expires_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <Lock className="h-8 w-8 text-gray-400" />
        <div>
          <h3 className="text-lg font-bold text-gray-800">Akun Gratis</h3>
          <p className="text-xs text-gray-500">
            Upgrade ke Premium untuk akses semua tryout.
          </p>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Utama: Dashboard ---
export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalTes: 0, skorTerbaik: 0, rataRata: 0 });
  const [paketSoal, setPaketSoal] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- useEffect (Tetap Sama, sudah mengambil data premium) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");

        const res = await fetch('/api/user?action=getDashboardData', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat data dashboard.");
        }
        const data = await res.json();
        
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
  }, []); 

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

      {/* 2. Kartu Statistik Cepat */}
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
                <PaketCard 
                  key={paket.id} 
                  paket={paket} 
                  index={i} 
                  // --- KIRIM STATUS PREMIUM USER KE KARTU ---
                  isUserPremium={profile?.is_premium || false}
                />
              ))}
            </div>
          ) : (
            !error && <p className="text-gray-500">Saat ini tidak ada paket ujian yang tersedia.</p>
          )}
        </div>

        {/* Kolom Kanan (Sempit) - Aktivitas & Status Premium */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* --- KARTU STATUS PREMIUM (BARU) --- */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Status Akun
            </h2>
            <PremiumStatusCard profile={profile} />
          </div>

          {/* --- Aktivitas Terakhir --- */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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

      </div>
    </motion.div>
  );
}