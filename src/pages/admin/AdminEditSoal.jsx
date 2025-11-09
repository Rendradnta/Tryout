import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';

const LoadingSoal = () => <p className="text-gray-600">Memuat data soal...</p>;

export default function AdminEditSoal() {
  const { soalId } = useParams();
  const navigate = useNavigate();

  // State untuk semua field di form
  const [paketId, setPaketId] = useState('');
  const [subtesId, setSubtesId] = useState(''); // State ini akan diisi oleh useEffect
  const [nomorSoal, setNomorSoal] = useState(1);
  const [tipeSoal, setTipeSoal] = useState('pg');
  const [narasiSoal, setNarasiSoal] = useState('');
  const [teksSoal, setTeksSoal] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState('');
  const [kunciJawaban, setKunciJawaban] = useState('');
  const [pembahasan, setPembahasan] = useState('');
  
  // State untuk UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true); 
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(null);
  
  // useEffect untuk MENGAMBIL DATA SOAL
  useEffect(() => {
    const fetchSoalDetail = async () => {
      if (!soalId) return;
      setLoadingData(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Akses ditolak.");

        // Memanggil API /api/admin/soal?id=... (sudah benar)
        const res = await fetch(`/api/admin/soal?id=${soalId}`, {
           headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengambil detail soal.");
        }
        
        const { data } = await res.json();

        // Isi semua state form dengan data dari database
        setPaketId(data.paket_id || '');
        setSubtesId(data.subtes_id || ''); // Ini akan otomatis memilih dropdown
        setNomorSoal(data.nomor_soal || 1);
        setTipeSoal(data.tipe_soal || 'pg');
        setNarasiSoal(data.narasi_soal || '');
        setTeksSoal(data.teks_soal || '');
        setOpsiJawaban(JSON.stringify(data.opsi_jawaban, null, 2) || '');
        setKunciJawaban(JSON.stringify(data.kunci_jawaban, null, 2) || '');
        setPembahasan(data.pembahasan || '');
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchSoalDetail();
  }, [soalId]); 

  // Fungsi saat form disubmit (EDIT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSukses(null);

    let parsedOpsi, parsedKunci;
    try {
      parsedOpsi = JSON.parse(opsiJawaban);
      parsedKunci = JSON.parse(kunciJawaban);
    } catch (jsonError) {
      setError(`Format JSON tidak valid: ${jsonError.message}`);
      setLoading(false);
      return;
    }
    
    // Validasi Subtes
    if (!subtesId || subtesId === "") {
      setError("Subtes ID wajib dipilih.");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      // Memanggil API /api/admin/soal?id=... (sudah benar)
      const res = await fetch(`/api/admin/soal?id=${soalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paket_id: paketId,
          subtes_id: subtesId, // Mengirim data 'subtes_id' yang sudah pasti benar
          nomor_soal: parseInt(nomorSoal, 10),
          tipe_soal: tipeSoal,
          narasi_soal: narasiSoal || null,
          teks_soal: teksSoal,
          opsi_jawaban: parsedOpsi,
          kunci_jawaban: parsedKunci,
          pembahasan: pembahasan
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupdate soal.");

      setSukses("Soal berhasil diperbarui!");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingData) {
    return (
      <div className="bg-white p-6 shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Edit Soal</h2>
        <LoadingSoal />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Soal</h2>
        <Link to="/admin" className="text-sm text-blue-600 hover:underline">
          &larr; Kembali ke Daftar Soal
        </Link>
      </div>
      
      {error && <p className="p-3 bg-red-100 text-red-700 rounded-md">{error}</p>}
      {sukses && <p className="p-3 bg-green-100 text-green-700 rounded-md">{sukses}</p>}

      {/* Baris 1: Paket & Subtes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paketId" className="block text-sm font-medium text-gray-700">Paket ID (Wajib)</label>
          <input type="text" id="paketId" value={paketId} onChange={(e) => setPaketId(e.target.value)} required className="mt-1 input-field" />
        </div>
        
        {/* --- PERBAIKAN DI SINI --- */}
        <div>
          <label htmlFor="subtesId" className="block text-sm font-medium text-gray-700">Subtes ID (Wajib)</label>
          <select 
            id="subtesId" 
            value={subtesId} // Ini akan diisi oleh useEffect
            onChange={(e) => setSubtesId(e.target.value)} 
            required 
            className="mt-1 input-field"
          >
            <option value="">-- Pilih Subtes --</option>
            <option value="twk">SKD - TWK (Wawasan Kebangsaan)</option>
            <option value="tiu">SKD - TIU (Intelegensia Umum)</option>
            <option value="tkp">SKD - TKP (Karakteristik Pribadi)</option>
            <option value="pu">UTBK - PU (Penalaran Umum)</option>
            <option value="ppu">UTBK - PPU (Pengetahuan & Pemahaman Umum)</option>
            <option value="pbm">UTBK - PBM (Pemahaman Bacaan & Menulis)</option>
            <option value="pk">UTBK - PK (Pengetahuan Kuantitatif)</option>
          </select>
        </div>
        {/* --- AKHIR PERBAIKAN --- */}
      </div>

      {/* ... (Sisa form Anda tetap sama persis) ... */}

      {/* Baris 2: Nomor & Tipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nomorSoal" className="block text-sm font-medium text-gray-700">Nomor Soal</label>
          <input type="number" id="nomorSoal" value={nomorSoal} onChange={(e) => setNomorSoal(e.target.value)} required min="1" className="mt-1 input-field" />
        </div>
        <div>
          <label htmlFor="tipeSoal" className="block text-sm font-medium text-gray-700">Tipe Soal</label>
          <select id="tipeSoal" value={tipeSoal} onChange={(e) => setTipeSoal(e.target.value)} className="mt-1 input-field">
            <option value="pg">Pilihan Ganda (PG)</option>
            <option value="pgk">Pilihan Ganda Kompleks (PGK)</option>
            <option value="tabel">Tabel (Benar/Salah)</option>
            <option value="isian">Isian Singkat</option>
          </select>
        </div>
      </div>

      {/* ... (Sisa form: Narasi, Teks, Opsi, Kunci, Pembahasan) ... */}
      <div>
        <label htmlFor="narasiSoal" className="block text-sm font-medium text-gray-700">Narasi Soal (Opsional)</label>
        <textarea id="narasiSoal" value={narasiSoal} onChange={(e) => setNarasiSoal(e.target.value)} rows="3" className="mt-1 input-field"></textarea>
      </div>
      <div>
        <label htmlFor="teksSoal" className="block text-sm font-medium text-gray-700">Teks Soal / Pertanyaan (Wajib)</label>
        <textarea id="teksSoal" value={teksSoal} onChange={(e) => setTeksSoal(e.target.value)} rows="5" required className="mt-1 input-field"></textarea>
      </div>
      <div>
        <label htmlFor="opsiJawaban" className="block text-sm font-medium text-gray-700">Opsi Jawaban (Wajib - Format JSON)</label>
        <textarea id="opsiJawaban" value={opsiJawaban} onChange={(e) => setOpsiJawaban(e.target.value)} rows="8" required className="mt-1 input-field font-mono text-sm"></textarea>
      </div>
      <div>
        <label htmlFor="kunciJawaban" className="block text-sm font-medium text-gray-700">Kunci Jawaban (Wajib - Format JSON)</label>
        <textarea id="kunciJawaban" value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} rows="5" required className="mt-1 input-field font-mono text-sm"></textarea>
      </div>
      <div>
        <label htmlFor="pembahasan" className="block text-sm font-medium text-gray-700">Pembahasan (Wajib)</label>
        <textarea id="pembahasan" value={pembahasan} onChange={(e) => setPembahasan(e.target.value)} rows="5" required className="mt-1 input-field"></textarea>
      </div>
      
      <div className="text-right">
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Update Soal'}
        </button>
      </div>
      
      {/* ... (Tag <style> Anda tetap sama) ... */}
      <style>{`
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-field:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
      `}</style>
    </form>
  );
         }
