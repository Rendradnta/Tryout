import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Komponen Loading
const LoadingSpinner = ({ text = 'Memuat...' }) => (
  <div className="text-center py-10">
    <p className="text-lg text-gray-600">{text}</p>
  </div>
);

export default function PeringkatPage() {
  // 1. State untuk data
  const [paketList, setPaketList] = useState([]); // Daftar paket u/ dropdown
  const [selectedPaketId, setSelectedPaketId] = useState(''); // Paket yg dipilih
  const [peringkat, setPeringkat] = useState([]); // Data peringkat
  
  // 2. State untuk loading & error
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [loadingPeringkat, setLoadingPeringkat] = useState(false);
  const [error, setError] = useState(null);

  // 3. useEffect (pertama): Ambil daftar paket soal untuk dropdown
  useEffect(() => {
    const fetchPaketList = async () => {
      setLoadingPaket(true);
      try {
        // Ambil paket soal (butuh RLS: 'SELECT' untuk 'authenticated')
        const { data, error } = await supabase
          .from('paket_soal')
          .select('id, judul');
        
        if (error) throw error;
        setPaketList(data);
      } catch (err) {
        setError(`Gagal memuat daftar paket: ${err.message}`);
      } finally {
        setLoadingPaket(false);
      }
    };
    fetchPaketList();
  }, []); // [] = jalankan sekali saat halaman dimuat

  // 4. useEffect (kedua): Ambil data peringkat SAAT 'selectedPaketId' berubah
  useEffect(() => {
    // Jangan jalankan jika belum ada paket yang dipilih
    if (!selectedPaketId) {
      setPeringkat([]); // Kosongkan peringkat jika user reset
      return;
    }

    const fetchPeringkat = async () => {
      setLoadingPeringkat(true);
      setError(null);
      
      try {
        // Ambil session/token untuk otentikasi
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Akses ditolak. Silakan login ulang.");

        // 5. Panggil API backend 'getPeringkat'
        const res = await fetch(`/api/user/getPeringkat?paket_id=${selectedPaketId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuat peringkat.");
        }

        const { data } = await res.json();
        setPeringkat(data);
        
      } catch (err) {
        console.error('Error fetching peringkat:', err.message);
        setError(err.message);
      } finally {
        setLoadingPeringkat(false);
      }
    };

    fetchPeringkat();
  }, [selectedPaketId]); // 6. Jalankan ulang HANYA JIKA selectedPaketId berubah

  // Fungsi untuk memberi ikon medali
  const getMedal = (index) => {
    if (index === 0) return '🥇'; // Juara 1
    if (index === 1) return '🥈'; // Juara 2
    if (index === 2) return '🥉'; // Juara 3
    return index + 1; // Peringkat 4 dst.
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Papan Peringkat</h1>
      
      {/* 7. Dropdown Pilihan Paket */}
      <div>
        <label htmlFor="paketSelect" className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Paket Ujian:
        </label>
        {loadingPaket ? (
          <p className="text-gray-500">Memuat paket...</p>
        ) : (
          <select
            id="paketSelect"
            value={selectedPaketId}
            onChange={(e) => setSelectedPaketId(e.target.value)}
            className="w-full max-w-md block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        <p className="text-center py-5 text-red-600">Terjadi kesalahan: {error}</p>
      )}

      {/* 8. Tabel Peringkat */}
      <div className="shadow-md rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="py-3 px-6 w-24 text-center">
                Peringkat
              </th>
              <th scope="col" className="py-3 px-6">
                Nama Peserta
              </th>
              <th scope="col" className="py-3 px-6 text-center">
                Skor Total
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingPeringkat && (
              <tr>
                <td colSpan="3">
                  <LoadingSpinner text="Memuat peringkat..." />
                </td>
              </tr>
            )}
            
            {!loadingPeringkat && !error && peringkat.length > 0 && (
              peringkat.map((item, index) => (
                <tr key={item.user_id} className="bg-white border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-lg text-center">
                    {getMedal(index)}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {/* Ambil nama dari data join 'profiles' */}
                    {item.profiles?.nama_lengkap || 'Nama Disembunyikan'}
                  </td>
                  <td className="py-4 px-6 text-lg font-bold text-blue-600 text-center">
                    {item.skor_total}
                  </td>
                </tr>
              ))
            )}
            
            {!loadingPeringkat && !error && peringkat.length === 0 && selectedPaketId && (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-500">
                  Belum ada data peringkat untuk paket ini.
                </td>
              </tr>
            )}
            
            {!loadingPeringkat && !selectedPaketId && (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-500">
                  Silakan pilih paket ujian untuk melihat peringkat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
