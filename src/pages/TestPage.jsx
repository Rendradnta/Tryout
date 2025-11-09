import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

import Timer from '../components/test/Timer.jsx';
import SoalDisplay from '../components/test/SoalDisplay.jsx';
import NavigasiSoal from '../components/test/NavigasiSoal.jsx';

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
  
  // --- STATE BARU UNTUK TIMER ---
  const [sisaDetik, setSisaDetik] = useState(null); // Sisa waktu (akan dihitung)

  // --- STATE NAVIGASI ---
  const [soalAktifIndex, setSoalAktifIndex] = useState(0); 
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0); 

  // --- LOGIKA PENGAMBILAN DATA (DIMODIFIKASI) ---
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

        // --- LOGIKA TIMER BARU (Memperbaiki Bug) ---
        // 1. Tentukan kunci penyimpanan timer
        // (Kita buat 1 kunci per subtes untuk UTBK)
        const storageKey = `waktuSelesai_${paketId}_subtes_${subtesAktifIndex}`;
        let endTime = localStorage.getItem(storageKey);

        // 2. Jika timer belum ada (atau refresh ke subtes baru)
        if (!endTime) {
          let totalDurationInSeconds;
          if (configData.tipe_ujian === 'skd') {
            totalDurationInSeconds = configData.waktu_total_menit * 60;
          } else {
            // Cek jika config_subtes ada
            if (!configData.config_subtes || !configData.config_subtes[subtesAktifIndex]) {
              throw new Error("Konfigurasi subtes tidak ditemukan.");
            }
            totalDurationInSeconds = configData.config_subtes[subtesAktifIndex].waktu * 60;
          }
          
          endTime = new Date().getTime() + totalDurationInSeconds * 1000;
          localStorage.setItem(storageKey, endTime);
        }

        // 3. Hitung sisa waktu
        const sisa = Math.round((parseInt(endTime, 10) - new Date().getTime()) / 1000);
        setSisaDetik(sisa > 0 ? sisa : 0); // Set sisa waktu
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [paketId, subtesAktifIndex]); // 4. Jalankan ulang jika paketId ATAU subtesAktifIndex berubah

  // --- LOGIKA KHUSUS UTBK ---
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

  // --- LOGIKA HANDLER (FUNGSI AKSI) ---
  
  // (handleSubmitTest tetap sama seperti File 73)
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
      
      // Hapus semua timer dari localStorage saat submit
      localStorage.removeItem(`waktuSelesai_${paketId}_subtes_0`);
      localStorage.removeItem(`waktuSelesai_${paketId}_subtes_1`);
      // (Tambahkan jika subtes lebih banyak)
      localStorage.removeItem(`waktuSelesai_${paketId}_subtes_${subtesAktifIndex}`);

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
  }, [isSubmitting, paketId, config, jawabanUser, waktuMulai, navigate, subtesAktifIndex]);

  // (handleTimeUp tetap sama seperti File 73)
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
        setSubtesAktifIndex(nextSubtesIndex); // Ini akan memicu useEffect untuk timer baru
        setSoalAktifIndex(subtesRanges[nextSubtesIndex].startIndex);
      }
    }
  }, [config, subtesAktifIndex, subtesRanges, handleSubmitTest]); 

  // (handleSelectJawaban tetap sama)
  const handleSelectJawaban = (soalId, jawaban) => {
    setJawabanUser(prev => ({ ...prev, [soalId]: jawaban }));
  };

  // --- 5. LOGIKA TAMPILAN (RENDER) ---
  
  // (Tampilan Loading & Error tetap sama)
  if (loading || sisaDetik === null) return <LoadingScreen />;
  if (error) return <div className="text-center py-20 text-red-600">Error: {error}</div>;
  if (!config || !soals.length) return <div className="text-center py-20">Paket soal tidak ditemukan.</div>;

  // (Logika Navigasi tetap sama)
  const navProps = {
    soals: soals,
    jawabanUser: jawabanUser,
    soalAktifIndex: soalAktifIndex,
    onNavClick: (index) => setSoalAktifIndex(index), 
    range: (config.tipe_ujian === 'utbk' && subtesAktif)
      ? { start: subtesAktif.startIndex, end: subtesAktif.endIndex }
      : { start: 0, end: soals.length - 1 }
  };
  
  const batasBawah = navProps.range.start;
  const batasAtas = navProps.range.end;

  return (
    <div className="flex flex-col md:flex-row h-screen-minus-navbar">
      {/* Kolom Kiri (Navigasi & Timer) */}
      <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-gray-50 border-r overflow-y-auto">
        
        {/* --- TIMER DIMODIFIKASI --- */}
        {/* 'key' diubah agar unik per subtes */}
        <Timer 
          key={`timer-${paketId}-${subtesAktifIndex}`} 
          durationInSeconds={sisaDetik} // Kita kirim SISA WAKTU
          onTimeUp={handleTimeUp}
        />
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Navigasi Soal</h3>
        <NavigasiSoal {...navProps} />
        
        {/* ... (Tombol Selesai SKD tetap sama) ... */}
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
        {/* ... (Header Soal tetap sama) ... */}
        <h2 className="text-xl font-bold text-blue-700 mb-4">
          {config.tipe_ujian === 'utbk' ? subtesAktif?.nama : config.judul}
        </h2>
        
        {/* ... (SoalDisplay tetap sama) ... */}
        <SoalDisplay 
          soal={soals[soalAktifIndex]}
          jawaban={soals[soalAktifIndex] ? jawabanUser[soals[soalAktifIndex].id] : undefined}
          onSelectJawaban={handleSelectJawaban}
        />
        
        {/* ... (Kontrol Bawah tetap sama) ... */}
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
