import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// 1. Kita akan gunakan ulang komponen SoalDisplay!
import SoalDisplay from '../components/test/SoalDisplay.jsx'; 

// Komponen Loading
const LoadingScreen = () => (
  <div className="text-center py-20">
    <p className="text-2xl font-semibold text-gray-700 animate-pulse">
      Memuat pembahasan...
    </p>
  </div>
);

// 2. Komponen baru untuk menampilkan box Pembahasan
const PembahasanBox = ({ soal, jawabanUser }) => {
  // Cek apakah jawaban user benar (logika sederhana)
  // TODO: Perlu logika lebih kompleks untuk PGK & Tabel
  const isBenar = jawabanUser === soal.kunci_jawaban?.kunci;
  
  return (
    <div className={`mt-6 p-4 rounded-lg border ${
      isBenar 
      ? 'bg-green-50 border-green-300' 
      : 'bg-red-50 border-red-300'
    }`}>
      <h4 className="text-lg font-semibold mb-2">Pembahasan</h4>
      
      {/* Tampilkan Jawaban User vs Kunci Jawaban */}
      <div className="space-y-1 mb-3 text-sm">
        <p>Jawaban Anda: <span className="font-bold">{JSON.stringify(jawabanUser) || "Tidak Dijawab"}</span></p>
        <p>Kunci Jawaban: <span className="font-bold">{JSON.stringify(soal.kunci_jawaban)}</span></p>
      </div>

      {/* Tampilkan Teks Pembahasan */}
      <div 
        className="text-sm text-gray-800 prose"
        dangerouslySetInnerHTML={{ __html: soal.pembahasan || "Pembahasan tidak tersedia." }}
      />
    </div>
  );
};


export default function PembahasanPage() {
  const { historyId } = useParams();
  const navigate = useNavigate();

  // --- STATE UTAMA ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soalLengkap, setSoalLengkap] = useState([]); // Array semua soal
  const [jawabanUser, setJawabanUser] = useState({}); // { "soal-id-1": "A" }
  
  // --- STATE NAVIGASI ---
  const [soalAktifIndex, setSoalAktifIndex] = useState(0);

  // 3. LOGIKA PENGAMBILAN DATA
  useEffect(() => {
    const fetchPembahasan = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");
        
        // 4. Panggil API backend 'getPembahasan' kita
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

  // --- Tampilan Render ---
  if (loading) return <LoadingScreen />;
  if (error) return (
    <div className="text-center py-20 text-red-600">
      <p>Error: {error}</p>
      <Link to="/history" className="mt-4 inline-block text-blue-600 hover:underline">
        Kembali ke Riwayat
      </Link>
    </div>
  );
  if (!soalLengkap.length) return <div className="text-center py-20">Pembahasan tidak ditemukan.</div>;

  const soalAktif = soalLengkap[soalAktifIndex];
  const jawabanSoalIni = jawabanUser[soalAktif.id];

  return (
    <div className="max-w-4xl mx-auto py-8">
      
      {/* Tombol kembali */}
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
        {/* 5. Kita gunakan ulang SoalDisplay! */}
        {/* Kita buat 'dummy' onSelect agar tidak error, tapi tidak melakukan apa-apa */}
        <SoalDisplay 
          soal={soalAktif}
          jawaban={jawabanSoalIni}
          onSelectJawaban={() => {}} // Tidak bisa ganti jawaban di mode pembahasan
        />
        
        {/* 6. Tampilkan Box Pembahasan */}
        <PembahasanBox 
          soal={soalAktif}
          jawabanUser={jawabanSoalIni}
        />
      </div>

    </div>
  );
}
