import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx'; // Impor loading Anda

// Impor Ikon
import { AlertTriangle, CheckCircle, Award } from 'lucide-react';

// --- Komponen Status (Lulus/Tidak) ---
const StatusBadge = ({ status }) => {
  if (status === null || status === undefined) {
    return <span className="text-gray-500">-</span>;
  }
  
  const isLulus = status === true;
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
      ${isLulus 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isLulus ? 'bg-green-600' : 'bg-red-600'}`}></span>
      {isLulus ? 'Lulus' : 'Tidak Lulus'}
    </span>
  );
};


export default function PeringkatPage() {
  // 1. State untuk data
  const [paketList, setPaketList] = useState([]); // Daftar paket u/ dropdown
  const [selectedPaketId, setSelectedPaketId] = useState(''); // Paket yg dipilih
  const [peringkat, setPeringkat] = useState([]); // Data peringkat
  
  // 2. State untuk loading & errorr
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [loadingPeringkat, setLoadingPeringkat] = useState(false);
  const [error, setError] = useState(null);

  // 3. useEffect (pertama): Ambil daftar paket soal untuk dropdown
  useEffect(() => {
    const fetchPaketList = async () => {
      setLoadingPaket(true);
      try {
        // --- PERBAIKAN DI BARIS BERIKUTNYA (HAPUS '_') ---
        const { data, error } = await supabase
          .from('paket_soal')
          .select('id, judul')
          .eq('is_published', true); // Hanya tampilkan paket yang sudah publish
        
        if (error) throw error;
        setPaketList(data);
      } catch (err) {
        setError(`Gagal memuat daftar paket: ${err.message}`);
      } finally {
        setLoadingPaket(false);
      }
    };
    fetchPaketList();
  }, []); // [] = jalankan sekali

  // 4. useEffect (kedua): Ambil data peringkat SAAT 'selectedPaketId' berubah
  useEffect(() => {
    if (!selectedPaketId) {
      setPeringkat([]);
      setError(null);
      return;
    }

    const fetchPeringkat = async () => {
      setLoadingPeringkat(true);
      setError(null);
      
      try {
        // --- PERBAIKAN DI BARIS BERIKUTNYA (HAPUS '_') ---
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak.");

        // Panggil API backend 'getPeringkat'
        const res = await fetch(`/api/user?action=getPeringkat&paket_id=${selectedPaketId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat peringkat.");
        }

        const { data } = await res.json();
        setPeringkat(data || []); // Pastikan 'data' tidak null
        
      } catch (err) {
        console.error('Error fetching peringkat:', err.message);
        setError(err.message);
      } finally {
        setLoadingPeringkat(false);
      }
    };

    fetchPeringkat();
  }, [selectedPaketId]); // Jalankan ulang HANYA JIKA selectedPaketId berubah

  // --- 5. LOGIKA "PINTAR" (DINAMIS) ---
  const { headerKeys, showStatusColumn } = useMemo(() => {
    if (peringkat.length === 0) {
      return { headerKeys: [], showStatusColumn: false };
    }
    const firstRow = peringkat[0];
    const statusExists = firstRow.status_lulus !== null;
    const keys = firstRow.rincian_skor ? Object.keys(firstRow.rincian_skor) : [];
    return { headerKeys: keys, showStatusColumn: statusExists };
  }, [peringkat]);
  
  // Fungsi untuk memberi ikon medali
  const getMedal = (index) => {
    if (index === 0) return <span title="Peringkat 1">🥇</span>;
    if (index === 1) return <span title="Peringkat 2">🥈</span>;
    if (index === 2) return <span title="Peringkat 3">🥉</span>;
    return index + 1;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Papan Peringkat</h1>
      
      {/* Dropdown Pilihan Paket */}
      <div>
        <label htmlFor="paketSelect" className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Paket Ujian:
        </label>
        {loadingPaket ? (
          <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-gray-200"></div>
        ) : (
          <select
            id="paketSelect"
            value={selectedPaketId}
            onChange={(e) => setSelectedPaketId(e.target.value)}
            className="w-full max-w-md block py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Pilih Peringkat --</option>
            {paketList.map(paket => (
              <option key={paket.id} value={paket.id}>
                {paket.judul}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tampilkan Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Terjadi kesalahan: {error}</p>
        </div>
      )}

      {/* 6. TABEL BARU (PREMIUM & RESPONSIVE) */}
      <div className="shadow-xl rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="py-4 px-6 text-center">
                  Peringkat
                </th>
                <th scope="col" className="py-4 px-6 min-w-[200px]">
                  Nama Peserta
                </th>
                <th scope="col" className="py-4 px-6 min-w-[150px]">
                  Tgl. Selesai
                </th>
                
                {/* Kolom Dinamis: Status (Hanya muncul jika ada) */}
                {showStatusColumn && (
                  <th scope="col" className="py-4 px-6 text-center">
                    Status
                  </th>
                )}
                
                {/* Kolom Dinamis: Rincian Skor */}
                {headerKeys.map(key => (
                  <th key={key} scope="col" className="py-4 px-6 text-center uppercase">
                    {key}
                  </th>
                ))}
                
                <th scope="col" className="py-4 px-6 text-center text-blue-700 bg-blue-50 sticky right-0 shadow-sm">
                  Total Nilai
                </th>
              </tr>
            </thead>
            
            <tbody>
              {loadingPeringkat && (
                <tr>
                  <td colSpan={6 + headerKeys.length} className="text-center">
                    <LoadingSpinner text="Memuat peringkat..." />
                  </td>
                </tr>
              )}
              
              {!loadingPeringkat && !error && peringkat.length > 0 && (
                peringkat.map((item, index) => (
                  <tr key={item.user_id} className="bg-white border-b hover:bg-gray-50">
                    {/* Peringkat */}
                    <td className="py-4 px-6 font-bold text-lg text-center text-gray-900">
                      {getMedal(index)}
                    </td>
                    {/* Nama Peserta */}
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                      {item.nama_lengkap || 'Nama Disembunyikan'}
                    </td>
                    {/* Tgl. Selesai */}
                    <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                      {new Date(item.waktu_selesai).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    
                    {/* Kolom Dinamis: Status */}
                    {showStatusColumn && (
                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={item.status_lulus} />
                      </td>
                    )}
                    
                    {/* Kolom Dinamis: Rincian Skor */}
                    {headerKeys.map(key => (
                      <td key={key} className="py-4 px-6 text-center text-gray-700 font-medium">
                        {item.rincian_skor[key] || 0}
                      </td>
                    ))}
                    
                    {/* Total Nilai (Sticky) */}
                    <td className="py-4 px-6 text-lg font-bold text-blue-700 text-center bg-blue-50 sticky right-0 shadow-sm">
                      {item.skor_total}
                    </td>
                  </tr>
                ))
              )}
              
              {/* --- Tampilan Kosong --- */}
              {!loadingPeringkat && !error && peringkat.length === 0 && selectedPaketId && (
                <tr>
                  <td colSpan={6 + headerKeys.length} className="text-center py-10 text-gray-500">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-base">Belum ada data peringkat untuk paket ini.</p>
                  </td>
                </tr>
              )}
              {!loadingPeringkat && !selectedPaketId && (
                <tr>
                  <td colSpan={6 + headerKeys.length} className="text-center py-10 text-gray-500">
                    <p className="text-base">Silakan pilih paket ujian untuk melihat peringkat.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
