import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// 1. Impor Komponen (Timer, SoalDisplay, NavigasiSoal)
import Timer from '../components/test/Timer.jsx';
import SoalDisplay from '../components/test/SoalDisplay.jsx';
import NavigasiSoal from '../components/test/NavigasiSoal.jsx';

// Komponen Loading Awal
const LoadingScreen = () => (
  <div className="text-center py-20">
    <p className="text-2xl font-semibold text-gray-700 animate-pulse">
      Mempersiapkan ruang ujian Anda...
    </p>
  </div>
);

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

  // --- STATE NAVIGASI ---
  const [soalAktifIndex, setSoalAktifIndex] = useState(0); 
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0); 

  // --- 2. LOGIKA PENGAMBILAN DATA ---
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");
        
        const res = await fetch(`/api/test/getSoal?paket_id=${paketId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat soal.");
        }

        const { data: soalsData, config: configData } = await res.json();
        
        setSoals(soalsData);
        setConfig(configData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [paketId]);

  // --- 3. LOGIKA KHUSUS UTBK (MEMOIZED) ---
  const subtesRanges = useMemo(() => {
    if (config?.tipe_ujian !== 'utbk' || !config.config_subtes) return [];
    let startIndex = 0;
    return config.config_subtes.map((sub, index) => {
      const range = {
        index: index,
        nama: sub.nama,
        waktuMenit: sub.waktu,
        startIndex: startIndex,
        endIndex: startIndex + sub.jumlah_soal - 1,
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

  // --- 4. LOGIKA HANDLER (FUNGSI AKSI) ---
  // 
  // --- INI PERBAIKANNYA ---
  // 'handleSubmitTest' sekarang dideklarasikan SEBELUM 'handleTimeUp'
  //
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
      
      navigate('/history', { replace: true, state: { message: "Jawaban berhasil disubmit!" } });
      
    } catch (err) {
      setError(`Gagal submit: ${err.message}`);
      setIsSubmitting(false); 
    }
  }, [isSubmitting, paketId, config, jawabanUser, waktuMulai, navigate]);


  // Dipanggil oleh Timer saat waktu habis
  const handleTimeUp = useCallback(() => {
    if (config?.tipe_ujian === 'skd') {
      handleSubmitTest(); // Waktu total SKD habis
    } 
    else if (config?.tipe_ujian === 'utbk') {
      const isLastSubtest = (subtesAktifIndex === subtesRanges.length - 1);
      if (isLastSubtest) {
        handleSubmitTest(); // Waktu subtes terakhir habis
      } else {
        // Pindah ke subtes berikutnya
        const nextSubtesIndex = subtesAktifIndex + 1;
        setSubtesAktifIndex(nextSubtesIndex);
        setSoalAktifIndex(subtesRanges[nextSubtesIndex].startIndex);
      }
    }
  }, [config, subtesAktifIndex, subtesRanges, handleSubmitTest]); // Sekarang 'handleSubmitTest' sudah aman

  // Menyimpan jawaban user ke state
  const handleSelectJawaban = (soalId, jawaban) => {
    setJawabanUser(prev => ({ ...prev, [soalId]: jawaban }));
  };

  // --- 5. LOGIKA TAMPILAN (RENDER) ---
  if (loading) return <LoadingScreen />;
  if (error) return <div className="text-center py-20 text-red-600">Error: {error}</div>;
  if (!config || !soals.length) return <div className="text-center py-20">Paket soal tidak ditemukan.</div>;

  // Tentukan Timer
  let timerDurationInSeconds;
  let timerKey = 'skd';
  if (config.tipe_ujian === 'skd') {
    timerDurationInSeconds = config.waktu_total_menit * 60;
  } else if (subtesAktif) {
    timerDurationInSeconds = subtesAktif.waktuMenit * 60;
    timerKey = subtesAktif.index; 
  }

  // Tentukan soal mana yang boleh dinavigasi
  const navProps = {
    soals: soals,
    jawabanUser: jawabanUser,
    soalAktifIndex: soalAktifIndex,
    onNavClick: (index) => setSoalAktifIndex(index), 
    range: (config.tipe_ujian === 'utbk' && subtesAktif)
      ? { start: subtesAktif.startIndex, end: subtesAktif.endIndex }
      : { start: 0, end: soals.length - 1 }
  };
  
  // Tentukan batas tombol Next/Prev
  const batasBawah = navProps.range.start;
  const batasAtas = navProps.range.end;

  return (
    <div className="flex flex-col md:flex-row h-screen-minus-navbar">
      {/* Kolom Kiri (Navigasi & Timer) */}
      <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-gray-50 border-r overflow-y-auto">
        <Timer 
          key={timerKey} 
          durationInSeconds={timerDurationInSeconds} 
          onTimeUp={handleTimeUp}
        />
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Navigasi Soal</h3>
        <NavigasiSoal {...navProps} />
        
        {config.tipe_ujian === 'skd' && (
          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="w-full mt-6 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Mensubmit...' : 'Selesaikan Ujian'}
          </button>
        )}
      </aside>

      {/* Kolom Kanan (Soal & Kontrol) */}
      <main className="w-full md:w-3/4 lg:w-4/5 p-6 md:p-10 overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-700 mb-4">
          {config.tipe_ujian === 'utbk' ? subtesAktif?.nama : config.judul}
        </h2>
        
        {/* Komponen Soal */}
        <SoalDisplay 
          soal={soals[soalAktifIndex]}
          jawaban={soals[soalAktifIndex] ? jawabanUser[soals[soalAktifIndex].id] : undefined}
          onSelectJawaban={handleSelectJawaban}
        />
        
        {/* Kontrol Bawah (Next/Prev) */}
        <hr className="my-8" />
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSoalAktifIndex(soalAktifIndex - 1)}
            disabled={soalAktifIndex <= batasBawah}
            className="py-2 px-6 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          
          <span className="text-gray-700 font-semibold">
            Soal {soalAktifIndex + 1} dari {soals.length}
          </span>
          
          <button
            onClick={() => setSoalAktifIndex(soalAktifIndex + 1)}
            disabled={soalAktifIndex >= batasAtas}
            className="py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      </main>
    </div>
  );
    }
