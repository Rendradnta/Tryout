import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useLocation } from 'react-router-dom';

// Komponen Loading
const LoadingSpinner = () => (
  <div className="text-center py-10">
    <p className="text-lg text-gray-600">Memuat riwayat pengerjaan...</p>
  </div>
);

// Komponen untuk 1 baris riwayat
const HistoryRow = ({ history }) => {
  // Ambil nama paket dari data yang di-join
  const namaPaket = history.paket_soal?.judul || 'Paket Tidak Ditemukan';
  const tipePaket = history.paket_soal?.tipe_ujian || 'N/A';
  
  // Format tanggal
  const tanggalSelesai = new Date(history.waktu_selesai).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="py-4 px-6 font-medium text-gray-900">
        {namaPaket}
        <span 
          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium 
            ${tipePaket === 'utbk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
        >
          {tipePaket.toUpperCase()}
        </span>
      </td>
      <td className="py-4 px-6 text-gray-700">
        {tanggalSelesai}
      </td>
      <td className="py-4 px-6 text-lg font-bold text-center">
        {history.skor_total}
      </td>
      <td className="py-4 px-6 text-center">
        {/* Tombol Lihat Rincian (Rapor) */}
        {/* <Link to={`/rapor/${history.id}`} className="font-medium text-blue-600 hover:underline mr-4">
          Rapor
        </Link> */}
        
        {/* Tombol Lihat Pembahasan */}
        <Link 
          to={`/pembahasan/${history.id}`} 
          className="font-medium text-blue-600 hover:underline"
        >
          Lihat Pembahasan
        </Link>
      </td>
    </tr>
  );
};


export default function HistoryPage() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 1. Untuk mengambil pesan 'state' dari TestPage.jsx
  const location = useLocation();
  const successMessage = location.state?.message;

  // 2. useEffect untuk mengambil data
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Ambil session/token untuk otentikasi
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");

        // 3. Panggil API backend 'getHistory'
        const res = await fetch('/api/user/getHistory', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat riwayat.");
        }

        const { data } = await res.json();
        setHistoryList(data);
        
      } catch (err) {
        console.error('Error fetching history:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // [] = jalankan sekali saat halaman dimuat

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Riwayat Pengerjaan</h1>

      {/* 4. Tampilkan pesan sukses jika ada (dari redirect submit) */}
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {/* 5. Tampilkan pesan jika skor masih diproses */}
      <div className="p-4 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg">
        <p><span className="font-bold">Info:</span> Jika hasil tes Anda belum muncul, skor Anda mungkin masih diproses. Silakan muat ulang halaman dalam 1-2 menit.</p>
      </div>

      <div className="shadow-md rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="py-3 px-6">
                Nama Paket Ujian
              </th>
              <th scope="col" className="py-3 px-6">
                Tanggal Selesai
              </th>
              <th scope="col" className="py-3 px-6 text-center">
                Skor Total
              </th>
              <th scope="col" className="py-3 px-6 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="4">
                  <LoadingSpinner />
                </td>
              </tr>
            )}
            
            {!loading && error && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-red-600">
                  Terjadi kesalahan: {error}
                </td>
              </tr>
            )}

            {!loading && !error && historyList.length > 0 && (
              historyList.map(history => (
                <HistoryRow key={history.id} history={history} />
              ))
            )}
            
            {!loading && !error && historyList.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Anda belum mengerjakan tes apapun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
