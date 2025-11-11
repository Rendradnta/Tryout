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
  Flag, // Ikon Ragu-ragu
  AlertTriangle, 
  CheckCircle, 
  X,
  Check,
  Home
} from 'lucide-react';

// --- Komponen Modal Konfirmasi Selesai ---
const ConfirmSubmitModal = ({ stats, onConfirm, onCancel, onChecklistChange, isChecklistChecked }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
    >
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Konfirmasi Selesai Ujian</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        <p className="text-gray-700">Harap periksa kembali status pengerjaan Anda sebelum mengakhiri ujian ini:</p>
        
        {/* Statistik Pengerjaan */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm font-medium text-gray-500">Total Soal</p>
          </div>
          <div className="rounded-lg bg-blue-100 p-4">
            <p className="text-2xl font-bold text-blue-700">{stats.answered}</p>
            <p className="text-sm font-medium text-blue-600">Dijawab</p>
          </div>
          <div className={`rounded-lg p-4 ${stats.flagged > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            <p className={`text-2xl font-bold ${stats.flagged > 0 ? 'text-yellow-700' : 'text-gray-800'}`}>
              {stats.flagged}
            </p>
            <p className={`text-sm font-medium ${stats.flagged > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
              Ragu-ragu
            </p>
          </div>
        </div>
        
        {stats.unanswered > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
            <AlertTriangle className="h-10 w-10 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-700">
              Anda memiliki **{stats.unanswered} soal** yang belum dikerjakan.
            </p>
          </div>
        )}
        
        {/* Checkbox Persetujuan */}
        <label 
          htmlFor="confirm-submit" 
          className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-100"
        >
          <input
            type="checkbox"
            id="confirm-submit"
            checked={isChecklistChecked}
            onChange={onChecklistChange}
            className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="font-semibold text-gray-800">
              Saya yakin ingin mengakhiri ujian ini.
            </span>
            <p className="text-sm text-gray-600">
              Saya sudah memeriksa semua jawaban saya dan siap untuk mensubmit.
            </p>
          </div>
        </label>
      </div>

      <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Kembali Mengerjakan
        </button>
        <button
          onClick={onConfirm}
          disabled={!isChecklistChecked}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <Check className="h-5 w-5" />
          Ya, Kumpulkan Jawaban
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// --- Komponen Modal Sukses Submit ---
const SuccessSubmitModal = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
    >
      <div className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="mt-5 text-2xl font-bold text-gray-900">
          Ujian Selesai!
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          Jawaban Anda telah berhasil dikumpulkan dan sedang diproses. Skor Anda akan muncul di halaman Riwayat dalam beberapa saat.
        </p>
        <button
          onClick={onClose}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Home className="h-5 w-5" />
          Kembali ke Dashboard
        </button>
      </div>
    </motion.div>
  </motion.div>
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
  const [raguRagu, setRaguRagu] = useState({}); // Menyimpan { "soal-id": true }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmChecklist, setConfirmChecklist] = useState(false);

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

  // --- FUNGSI HANDLER ---

  // (handleSubmitTest DIMODIFIKASI untuk Modal Sukses)
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak ditemukan.");
      const payload = {
        paket_id: paketId,
        tipe_ujian: config.tipe_ujian,
        jawaban_user: jawabanUser,
        waktu_mulai: waktuMulai.toISOString(),
        waktu_selesai: new Date().toISOString()
      };
      localStorage.removeItem(`waktuSelesai_${paketId}_subtes_${subtesAktifIndex}`);
      // (Bersihkan semua timer lain jika ada)

      const res = await fetch('/api/test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.status !== 202) { 
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan jawaban.");
      }
      
      // --- PERUBAHAN ALUR ---
      // LAMA: navigate('/history')
      // BARU: Tampilkan modal sukses
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      
    } catch (err) {
      setError(`Gagal submit: ${err.message}`);
      setIsSubmitting(false); 
    }
  }, [isSubmitting, paketId, config, jawabanUser, waktuMulai, navigate, subtesAktifIndex]);

  // (handleTimeUp tetap sama, memanggil handleSubmitTest)
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

  // (handleSelectJawaban DIMODIFIKASI untuk auto-unflag)
  const handleSelectJawaban = (soalId, jawaban) => {
    setJawabanUser(prev => ({ ...prev, [soalId]: jawaban }));
    // Otomatis hilangkan ragu-ragu saat user menjawab
    if (raguRagu[soalId]) {
      setRaguRagu(prev => ({ ...prev, [soalId]: false }));
    }
  };

  // --- FUNGSI BARU ---
  // Untuk tombol "Ragu-Ragu"
  const handleToggleRagu = (soalId) => {
    setRaguRagu(prev => ({ ...prev, [soalId]: !prev[soalId] }));
  };
  
  // Hitung statistik untuk modal
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
    raguRagu: raguRagu, // <-- Kirim state RaguRagu ke Navigasi
    soalAktifIndex: soalAktifIndex,
    onNavClick: (index) => setSoalAktifIndex(index), 
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
        
        {/* Kolom Kiri (Navigasi & Timer) */}
        <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-white border-r overflow-y-auto shadow-md">
          <Timer 
            key={`timer-${paketId}-${subtesAktifIndex}`} 
            durationInSeconds={sisaDetik}
            onTimeUp={handleTimeUp}
          />
          
          <h3 className="text-lg font-semibold mt-4 mb-2">Navigasi Soal</h3>
          <NavigasiSoal {...navProps} />
          
          {/* Tombol Selesai (Buka Modal) */}
          {(config.tipe_ujian === 'skd' || (config.tipe_ujian === 'utbk' && subtesAktifIndex === subtesRanges.length - 1)) && (
            <button
              onClick={() => {
                setConfirmChecklist(false); // Reset checklist
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
        <main className="w-full md:w-3/4 lg:w-4/5 p-6 md:p-10 overflow-y-auto">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            {config.tipe_ujian === 'utbk' ? subtesAktif?.nama : config.judul}
          </h2>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <SoalDisplay 
              soal={soals[soalAktifIndex]}
              jawaban={soalIdAktif ? jawabanUser[soalIdAktif] : undefined}
              onSelectJawaban={handleSelectJawaban}
            />
          </div>
          
          {/* Kontrol Bawah (Next/Prev/Ragu-ragu) */}
          <hr className="my-8 border-gray-300" />
          <div className="flex justify-between items-center">
            
            {/* Tombol Sebelumnya */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoalAktifIndex(soalAktifIndex - 1)}
              disabled={soalAktifIndex <= batasBawah}
              className="py-3 px-6 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:shadow-none"
            >
              Sebelumnya
            </motion.button>
            
            {/* --- TOMBOL RAGU-RAGU (BARU) --- */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggleRagu(soalIdAktif)}
              className={`py-3 px-6 rounded-lg font-semibold shadow-md transition-all ${
                isSoalAktifRagu
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Flag className={`inline-block h-5 w-5 mr-2 ${isSoalAktifRagu ? 'fill-yellow-900' : ''}`} />
              {isSoalAktifRagu ? 'Batalkan Ragu' : 'Tandai Ragu'}
            </motion.button>
            
            {/* Tombol Selanjutnya */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoalAktifIndex(soalAktifIndex + 1)}
              disabled={soalAktifIndex >= batasAtas}
              className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:shadow-none"
            >
              Selanjutnya
            </motion.button>
          </div>
        </main>
      </div>
      
      {/* --- Bagian Modal (Pop-up) --- */}
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