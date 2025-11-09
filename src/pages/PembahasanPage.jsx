import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import SoalDisplay from '../components/test/SoalDisplay.jsx'; 

const LoadingScreen = () => (
  <div className="text-center py-20">
    <p className="text-2xl font-semibold text-gray-700 animate-pulse">
      Memuat pembahasan...
    </p>
  </div>
);

// --- PERBAIKAN DI SINI ---
// Komponen PembahasanBox dibuat lebih pintar
const PembahasanBox = ({ soal, jawabanUser }) => {
  
  let kunciJawabanTeks = "";
  let jawabanUserTeks = "";
  let isBenar = false;

  try {
    const tipe = soal.tipe_soal;
    // Gunakan subtes_id dan ubah ke huruf kecil untuk perbandingan
    const subtes = (soal.subtes_id || '').toLowerCase();
    const kunci = soal.kunci_jawaban;

    // 1. Format Kunci Jawaban
    if (subtes === 'tkp') {
      // Jika TKP, tampilkan semua skor
      kunciJawabanTeks = Object.entries(kunci)
        .map(([opsi, skor]) => `${opsi}: ${skor} poin`)
        .join(', ');
      // Cek 'benar' versi TKP (skor > 0 dan jawaban ada)
      isBenar = jawabanUser && kunci[jawabanUser] > 0;
    } else if (tipe === 'pg' || tipe === 'isian') {
      kunciJawabanTeks = kunci.kunci; // Tampilkan "A"
      // Cek 'benar' (pastikan keduanya ada sebelum .toLowerCase())
      isBenar = jawabanUser?.toLowerCase() === kunci.kunci?.toLowerCase();
    } else if (tipe === 'pgk') {
      kunciJawabanTeks = kunci.kunci.join(', '); // Tampilkan "1, 3"
      // Cek array (perlu helper, tapi kita sederhanakan)
      isBenar = JSON.stringify((jawabanUser || []).sort()) === JSON.stringify(kunci.kunci.sort());
    } else if (tipe === 'tabel') {
      kunciJawabanTeks = "Lihat detail tabel";
      // Cek objek (perlu helper)
      isBenar = JSON.stringify(jawabanUser) === JSON.stringify(kunci);
    } else {
      kunciJawabanTeks = JSON.stringify(kunci);
    }
    
    // 2. Format Jawaban User (Hapus tanda kutip ekstra)
    if (typeof jawabanUser === 'string') {
      jawabanUserTeks = jawabanUser; // Tampilkan "A" (bukan '"A"')
    } else if (Array.isArray(jawabanUser)) {
      jawabanUserTeks = jawabanUser.join(', '); // Tampilkan "1, 3"
    } else if (typeof jawabanUser === 'object' && jawabanUser !== null) {
      jawabanUserTeks = JSON.stringify(jawabanUser); // Untuk tabel
    } else {
      jawabanUserTeks = "Tidak Dijawab";
    }

  } catch (e) {
    kunciJawabanTeks = "Error membaca kunci";
    jawabanUserTeks = "Error membaca jawaban";
  }
  
  return (
    <div className={`mt-6 p-4 rounded-lg border ${
      isBenar 
      ? 'bg-green-50 border-green-300' 
      : 'bg-red-50 border-red-300'
    }`}>
      <h4 className="text-lg font-semibold mb-2">Pembahasan</h4>
      
      <div className="space-y-1 mb-3 text-sm">
        <p>Jawaban Anda: <span className="font-bold">{jawabanUserTeks}</span></p>
        <p>Kunci Jawaban: <span className="font-bold">{kunciJawabanTeks}</span></p>
      </div>

      <div 
        className="text-sm text-gray-800 prose"
        dangerouslySetInnerHTML={{ __html: soal.pembahasan || "Pembahasan tidak tersedia." }}
      />
    </div>
  );
};


export default function PembahasanPage() {
  // ... (sisa file Anda, useEffect, dll, tetap sama persis) ...
  const { historyId } = useParams();
  const navigate = useNavigate(); // (navigate didefinisikan tapi tidak dipakai, tidak masalah)

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soalLengkap, setSoalLengkap] = useState([]); 
  const [jawabanUser, setJawabanUser] = useState({}); 
  const [soalAktifIndex, setSoalAktifIndex] = useState(0);

  useEffect(() => {
    const fetchPembahasan = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");
        
        const res = await fetch(`/api/test/getPembahasan?history_id=${historyId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat pembahasan.");
        }

        const { jawaban_user, soal_lengkap } = await res.json();
        
        setJawabanUser(jawaban_user || {});
        setSoalLengkap(soal_lengkap || []);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPembahasan();
  }, [historyId]);

  if (loading) return <LoadingScreen />;
  if (error) return (
    <div className="text-center py-20 text-red-600">
      <p>Error: {error}</p>
      <Link to="/history" className="mt-4 inline-block text-blue-600 hover:underline">
        Kembali ke Riwayat
      </Link>
    </div>
  );
  if (!soalLengkap.length || soalLengkap.length === 0) {
     return <div className="text-center py-20">Pembahasan tidak ditemukan atau soal kosong.</div>;
  }

  // Cek jika soalAktif ada
  const soalAktif = soalLengkap[soalAktifIndex];
  if (!soalAktif) {
    return <div className="text-center py-20">Soal tidak dapat dimuat.</div>;
  }

  const jawabanSoalIni = jawabanUser[soalAktif.id];

  return (
    <div className="max-w-4xl mx-auto py-8">
      
      <Link to="/history" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Riwayat
      </Link>
      
      <h1 className="text-3xl font-bold mb-6">Pembahasan Soal</h1>

      {/* Kontrol Atas (Next/Prev) */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gray-100 rounded-lg">
        <button
          onClick={() => setSoalAktifIndex(soalAktifIndex - 1)}
          disabled={soalAktifIndex <= 0}
          className="py-2 px-6 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Sebelumnya
        </button>
        
        <span className="text-gray-700 font-semibold">
          Soal {soalAktifIndex + 1} dari {soalLengkap.length}
        </span>
        
        <button
          onClick={() => setSoalAktifIndex(soalAktifIndex + 1)}
          disabled={soalAktifIndex >= soalLengkap.length - 1}
          className="py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Selanjutnya
        </button>
      </div>
      
      {/* Kotak Soal */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <SoalDisplay 
          soal={soalAktif}
          jawaban={jawabanSoalIni}
          onSelectJawaban={() => {}}
        />
        
        <PembahasanBox 
          soal={soalAktif}
          jawabanUser={jawabanSoalIni}
        />
      </div>
    </div>
  );
}
