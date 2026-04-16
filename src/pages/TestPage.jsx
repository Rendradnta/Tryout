import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// --- Impor Komponen & Ikon ---
import Timer from '../components/test/Timer.jsx';
import SoalDisplay from '../components/test/SoalDisplay.jsx';
import NavigasiSoal from '../components/test/NavigasiSoal.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { 
  Flag,           // Ikon Ragu-ragu
  AlertTriangle, 
  CheckCircle, 
  X,              // Ikon Tutup
  Check,
  Home,
  LayoutGrid      // Ikon Navigasi (sesuai permintaan Anda)
} from 'lucide-react';

// --- (Modal Konfirmasi & Sukses tetap sama seperti File 113) ---
const ConfirmSubmitModal = ({ stats, onConfirm, onCancel, onChecklistChange, isChecklistChecked }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
    >
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Konfirmasi Selesai Ujian</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-gray-700">Harap periksa kembali status pengerjaan Anda:</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-gray-100 p-4"><p className="text-2xl font-bold text-gray-800">{stats.total}</p><p className="text-sm font-medium text-gray-500">Total Soal</p></div>
          <div className="rounded-lg bg-blue-100 p-4"><p className="text-2xl font-bold text-blue-700">{stats.answered}</p><p className="text-sm font-medium text-blue-600">Dijawab</p></div>
          <div className={`rounded-lg p-4 ${stats.flagged > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}><p className={`text-2xl font-bold ${stats.flagged > 0 ? 'text-yellow-700' : 'text-gray-800'}`}>{stats.flagged}</p><p className={`text-sm font-medium ${stats.flagged > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>Ragu-ragu</p></div>
        </div>
        {stats.unanswered > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
            <AlertTriangle className="h-10 w-10 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-700">Anda memiliki **{stats.unanswered} soal** yang belum dikerjakan.</p>
          </div>
        )}
        <label htmlFor="confirm-submit" className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-100">
          <input type="checkbox" id="confirm-submit" checked={isChecklistChecked} onChange={onChecklistChange} className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <div>
            <span className="font-semibold text-gray-800">Saya yakin ingin mengakhiri ujian ini.</span>
            <p className="text-sm text-gray-600">Saya sudah memeriksa semua jawaban saya dan siap untuk mensubmit.</p>
          </div>
        </label>
      </div>
      <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          Kembali Mengerjakan
        </button>
        <button onClick={onConfirm} disabled={!isChecklistChecked} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
          <Check className="h-5 w-5" />
          Ya, Kumpulkan Jawaban
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const SuccessSubmitModal = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
    >
      <div className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="mt-5 text-2xl font-bold text-gray-900">Ujian Selesai!</h3>
        <p className="mt-3 text-sm text-gray-600">Jawaban Anda telah berhasil dikumpulkan dan sedang diproses. Skor akan muncul di halaman Riwayat.</p>
        <button onClick={onClose} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Home className="h-5 w-5" />
          Kembali ke Dashboard
        </button>
      </div>
    </motion.div>
  </motion.div>
);


// --- [BARU] Komponen Modal Navigasi ---
const NavigasiModal = ({ isOpen, onClose, navProps }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full bg-gray-100 rounded-t-2xl shadow-2xl mt-auto"
          style={{ maxHeight: '80vh' }}
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h3 className="text-lg font-bold text-gray-900">Navigasi Soal</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Keterangan Warna */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 p-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-gray-300 bg-white"></div> Belum Dijawab</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-blue-300 bg-blue-100"></div> Sudah Dijawab</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-yellow-500 bg-yellow-400"></div> Ragu-ragu</div>
          </div>
          
          {/* Grid Navigasi (Bisa di-scroll) */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 180px)' }}>
            <NavigasiSoal {...navProps} />
          </div>
          
          {/* Tombol Tutup Bawah */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={onClose}
              className="w-full flex justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


// --- Komponen Halaman Utama: TestPage ---
export default function TestPage() {
  const { paketId } = useParams();
  const navigate = useNavigate();

  // --- STATE UTAMA ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null); 
  const [soals, setSoals] = useState([]); 
  const [jawabanUser, setJawabanUser] = useState({}); 
  const [waktuMulai] = useState(new Date()); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sisaDetik, setSisaDetik] = useState(null);
  
  // --- STATE BARU ---
  const [raguRagu, setRaguRagu] = useState({}); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmChecklist, setConfirmChecklist] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false); // <-- [BARU] State Modal Navigasi

  // --- STATE NAVIGASI ---
  const [soalAktifIndex, setSoalAktifIndex] = useState(0); 
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0); 

  // --- (Logika useEffect fetchTest & Timer tetap sama seperti File 89) ---
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");
        
        const res = await fetch(`/api/test/getSoal?paket_id=${paketId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat soal.");
        }
        const { data: soalsData, config: configData } = await res.json();
        
        setSoals(soalsData);
        setConfig(configData);

        const storageKey = `waktuSelesai_${paketId}_subtes_${subtesAktifIndex}`;
        let endTime = localStorage.getItem(storageKey);
        if (!endTime) {
          let totalDurationInSeconds;
          if (configData.tipe_ujian === 'skd') {
            totalDurationInSeconds = configData.waktu_total_menit * 60;
          } else {
            if (!configData.config_subtes || !configData.config_subtes[subtesAktifIndex]) {
              throw new Error("Konfigurasi subtes tidak ditemukan.");
            }
            totalDurationInSeconds = configData.config_subtes[subtesAktifIndex].waktu * 60;
          }
          endTime = new Date().getTime() + totalDurationInSeconds * 1000;
          localStorage.setItem(storageKey, endTime);
        }
        const sisa = Math.round((parseInt(endTime, 10) - new Date().getTime()) / 1000);
        setSisaDetik(sisa > 0 ? sisa : 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [paketId, subtesAktifIndex]);

  // --- (Logika subtesRanges & subtesAktif tetap sama) ---
  const subtesRanges = useMemo(() => {
    if (config?.tipe_ujian !== 'utbk' || !config.config_subtes) return [];
    let startIndex = 0;
    return config.config_subtes.map((sub, index) => {
      const range = {
        index: index, nama: sub.nama, waktuMenit: sub.waktu,
        startIndex: startIndex, endIndex: startIndex + sub.jumlah_soal - 1,
      };
      startIndex += sub.jumlah_soal;
      return range;
    });
  }, [config]);
  const subtesAktif = useMemo(() => {
    if (config?.tipe_ujian === 'utbk') {
      return subtesRanges[subtesAktifIndex];
    }
    return null;
  }, [config, subtesAktifIndex, subtesRanges]);

  // --- (FUNGSI HANDLER TETAP SAMA) ---
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak ditemukan.");
      const payload = {
        paket_id: paketId, tipe_ujian: config.tipe_ujian,
        jawaban_user: jawabanUser, waktu_mulai: waktuMulai.toISOString(),
        waktu_selesai: new Date().toISOString()
      };
      localStorage.removeItem(`waktuSelesai_${paketId}_subtes_${subtesAktifIndex}`);
      // (Bersihkan semua timer lain jika ada)
      const res = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) { 
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan jawaban.");
        }
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      setError(`Gagal submit: ${err.message}`);
      setIsSubmitting(false); 
    }
  }, [isSubmitting, paketId, config, jawabanUser, waktuMulai, navigate, subtesAktifIndex]);

  const handleTimeUp = useCallback(() => {
    if (config?.tipe_ujian === 'skd') {
      handleSubmitTest();
    } 
    else if (config?.tipe_ujian === 'utbk') {
      const isLastSubtest = (subtesAktifIndex === subtesRanges.length - 1);
      if (isLastSubtest) {
        handleSubmitTest();
      } else {
        const nextSubtesIndex = subtesAktifIndex + 1;
        setSubtesAktifIndex(nextSubtesIndex);
        setSoalAktifIndex(subtesRanges[nextSubtesIndex].startIndex);
      }
    }
  }, [config, subtesAktifIndex, subtesRanges, handleSubmitTest]); 

  const handleSelectJawaban = (soalId, jawaban) => {
    setJawabanUser(prev => ({ ...prev, [soalId]: jawaban }));
    if (raguRagu[soalId]) {
      setRaguRagu(prev => ({ ...prev, [soalId]: false }));
    }
  };
  const handleToggleRagu = (soalId) => {
    setRaguRagu(prev => ({ ...prev, [soalId]: !prev[soalId] }));
  };
  const submissionStats = useMemo(() => {
    const total = soals.length;
    const answered = Object.keys(jawabanUser).length;
    const flagged = Object.values(raguRagu).filter(v => v === true).length;
    const unanswered = total - answered;
    return { total, answered, flagged, unanswered };
  }, [soals, jawabanUser, raguRagu]);


  // --- TAMPILAN RENDER ---
  if (loading || sisaDetik === null) return <LoadingSpinner text="Mempersiapkan ruang ujian..." />;
  if (error) return <div className="text-center py-20 text-red-600">Error: {error}</div>;
  if (!config || !soals.length) return <div className="text-center py-20">Paket soal tidak ditemukan.</div>;

  const navProps = {
    soals: soals,
    jawabanUser: jawabanUser,
    raguRagu: raguRagu,
    soalAktifIndex: soalAktifIndex,
    onNavClick: (index) => {
      setSoalAktifIndex(index);
      setIsNavModalOpen(false); // <-- [BARU] Tutup modal saat nomor diklik
    }, 
    range: (config.tipe_ujian === 'utbk' && subtesAktif)
      ? { start: subtesAktif.startIndex, end: subtesAktif.endIndex }
      : { start: 0, end: soals.length - 1 }
  };
  
  const batasBawah = navProps.range.start;
  const batasAtas = navProps.range.end;
  const soalIdAktif = soals[soalAktifIndex]?.id;
  const isSoalAktifRagu = raguRagu[soalIdAktif] === true;

  return (
    <>
      <div className="flex flex-col md:flex-row h-screen-minus-navbar bg-gray-50">
        
        {/* --- [PERBAIKAN] Kolom Kiri (Sidebar Desktop) --- */}
        <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-white border-r overflow-y-auto shadow-md">
          <Timer 
            key={`timer-${paketId}-${subtesAktifIndex}`} 
            durationInSeconds={sisaDetik}
            onTimeUp={handleTimeUp}
          />
          
          {/* --- [PERBAIKAN] Navigasi Soal diganti Tombol --- */}
          <button
            onClick={() => setIsNavModalOpen(true)}
            className="w-full mt-4 py-3 px-4 flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            <LayoutGrid className="h-5 w-5" />
            Buka Navigasi Soal
          </button>
          
          {/* Tombol Selesai (HANYA tampil jika SKD atau subtes terakhir) */}
          {(config.tipe_ujian === 'skd' || (config.tipe_ujian === 'utbk' && subtesAktifIndex === subtesRanges.length - 1)) && (
            <button
              onClick={() => {
                setConfirmChecklist(false);
                setShowConfirmModal(true);
              }}
              disabled={isSubmitting}
              className="w-full mt-6 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'Mensubmit...' : 'Selesaikan Ujian'}
            </button>
          )}
        </aside>

        {/* Kolom Kanan (Soal & Kontrol) */}
        <main className="w-full md:w-3/4 lg:w-4/5 p-4 md:p-10 overflow-y-auto">
          <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">
            {config.tipe_ujian === 'utbk' ? subtesAktif?.nama : config.judul}
          </h2>
          
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
            <SoalDisplay 
              soal={soals[soalAktifIndex]}
              jawaban={soalIdAktif ? jawabanUser[soalIdAktif] : undefined}
              onSelectJawaban={handleSelectJawaban}
            />
          </div>
          
          {/* --- [PERBAIKAN] Kontrol Bawah (Responsif) --- */}
          <hr className="my-6 md:my-8 border-gray-300" />
          <div className="flex justify-between items-center gap-2">
            
            {/* Tombol Sebelumnya */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoalAktifIndex(soalAktifIndex - 1)}
              disabled={soalAktifIndex <= batasBawah}
              className="py-3 px-4 sm:px-6 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:shadow-none text-sm sm:text-base"
            >
              Sebelumnya
            </motion.button>
            
            {/* Tombol Ragu-ragu (Icon di mobile, Teks di desktop) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggleRagu(soalIdAktif)}
              className={`py-3 px-4 rounded-lg font-semibold shadow-md transition-all ${
                isSoalAktifRagu
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Flag className={`inline-block h-5 w-5 sm:mr-2 ${isSoalAktifRagu ? 'fill-yellow-900' : ''}`} />
              <span className="hidden sm:inline">
                {isSoalAktifRagu ? 'Batalkan Ragu' : 'Tandai Ragu'}
              </span>
            </motion.button>
            
            {/* Tombol Selanjutnya */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoalAktifIndex(soalAktifIndex + 1)}
              disabled={soalAktifIndex >= batasAtas}
              className="py-3 px-4 sm:px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:shadow-none text-sm sm:text-base"
            >
              Selanjutnya
            </motion.button>
          </div>
        </main>
      </div>
      
      {/* --- [BARU] Render Modal Navigasi --- */}
      <NavigasiModal 
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        navProps={navProps}
      />

      {/* --- Render Modal Konfirmasi & Sukses --- */}
      <AnimatePresence>
        {showConfirmModal && (
          <ConfirmSubmitModal
            stats={submissionStats}
            isChecklistChecked={confirmChecklist}
            onChecklistChange={(e) => setConfirmChecklist(e.target.checked)}
            onCancel={() => setShowConfirmModal(false)}
            onConfirm={handleSubmitTest}
          />
        )}
        
        {showSuccessModal && (
          <SuccessSubmitModal 
            onClose={() => {
              setShowSuccessModal(false);
              navigate('/'); // Kembali ke dashboard
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
