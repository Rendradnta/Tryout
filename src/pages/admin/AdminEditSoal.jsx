import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Impor Ikon ---
import {
  Package,
  FileText,
  List,
  Key,
  BookOpen,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

// --- Impor Komponen Loading ---
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

// --- Komponen Modal (Pop-up) ---
const Modal = ({ title, message, icon, onClose }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
    onClick={onClose} 
  >
    <div 
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="text-center">
        {icon}
        <h3 className="mt-4 text-2xl font-semibold text-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
);
const ErrorIcon = () => ( <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" /> );
const SuccessIcon = () => ( <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" /> );
const ButtonSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
// --- Akhir Komponen Modal ---


export default function AdminEditSoal() {
  const { soalId } = useParams();
  const navigate = useNavigate();

  // --- State Form ---
  const [paketId, setPaketId] = useState('');
  const [subtesId, setSubtesId] = useState('');
  const [nomorSoal, setNomorSoal] = useState(1);
  const [tipeSoal, setTipeSoal] = useState('pg');
  const [narasiSoal, setNarasiSoal] = useState('');
  const [teksSoal, setTeksSoal] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState('');
  const [kunciJawaban, setKunciJawaban] = useState('');
  const [pembahasan, setPembahasan] = useState('');
  
  // --- State UI ---
  const [loading, setLoading] = useState(false); // Untuk submit
  const [loadingData, setLoadingData] = useState(true); // Untuk fetch
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  
  // --- useEffect untuk MENGAMBIL DATA SOAL ---
  useEffect(() => {
    const fetchSoalDetail = async () => {
      if (!soalId) return;
      setLoadingData(true);
      setModalError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Akses ditolak.");

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
        setSubtesId(data.subtes_id || ''); 
        setNomorSoal(data.nomor_soal || 1);
        setTipeSoal(data.tipe_soal || 'pg');
        setNarasiSoal(data.narasi_soal || '');
        setTeksSoal(data.teks_soal || '');
        // Format JSON agar rapi di textarea
        setOpsiJawaban(JSON.stringify(data.opsi_jawaban, null, 2) || '');
        setKunciJawaban(JSON.stringify(data.kunci_jawaban, null, 2) || '');
        setPembahasan(data.pembahasan || '');
        
      } catch (err) {
        setModalError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchSoalDetail();
  }, [soalId]); // Jalankan ulang jika soalId berubah

  // --- useEffect Interaktif DIHAPUS ---
  // Kita tidak ingin placeholder otomatis menimpa data yang sudah ada

  // --- Fungsi saat form disubmit (EDIT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalError(null);
    setModalSuccess(null);

    let parsedOpsi, parsedKunci;
    try {
      parsedOpsi = JSON.parse(opsiJawaban);
      parsedKunci = JSON.parse(kunciJawaban);
    } catch (jsonError) {
      setModalError(`Format JSON tidak valid: ${jsonError.message}`);
      setLoading(false);
      return;
    }
    
    if (!subtesId || subtesId === "") {
      setModalError("Subtes ID wajib dipilih.");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      const res = await fetch(`/api/admin/soal?id=${soalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paket_id: paketId,
          subtes_id: subtesId,
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

      setModalSuccess("Soal berhasil diperbarui!");
      // Kita tidak reset form di halaman edit

    } catch (err) {
      setModalError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Tampilkan loading saat data soal awal diambil
  if (loadingData) {
    return (
      <div className="bg-white p-6 shadow-xl rounded-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Edit Soal</h2>
        <LoadingSpinner text="Memuat data soal..." />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 shadow-xl rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Edit Soal</h2>
          <Link 
            to="/admin/soal" 
            className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
          >
            &larr; Kembali ke Daftar Soal
          </Link>
        </div>
        
        {/* --- Bagian 1: Detail Paket --- */}
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <Package className="h-5 w-5 text-blue-600" />
            Detail Paket & Subtes
          </legend>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="paketId" className="block text-sm font-medium text-gray-700">Paket ID (Wajib)</label>
              <input type="text" id="paketId" value={paketId} onChange={(e) => setPaketId(e.target.value)} required className="mt-1 input-field" placeholder="Salin ID dari 'Manajemen Paket'"/>
            </div>
            <div>
              <label htmlFor="subtesId" className="block text-sm font-medium text-gray-700">Subtes ID (Wajib)</label>
              <select id="subtesId" value={subtesId} onChange={(e) => setSubtesId(e.target.value)} required className="mt-1 input-field">
                <option value="">-- Pilih Subtes --</option>
                <option value="twk">SKD - TWK</option>
                <option value="tiu">SKD - TIU</option>
                <option value="tkp">SKD - TKP</option>
                <option value="pu">UTBK - PU</option>
                <option value="ppu">UTBK - PPU</option>
                <option value="pbm">UTBK - PBM</option>
                <option value="pk">UTBK - PK</option>
              </select>
            </div>
          </div>
        </fieldset>
        
        {/* --- Bagian 2: Isi Soal --- */}
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <FileText className="h-5 w-5 text-blue-600" />
            Isi Soal
          </legend>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="nomorSoal" className="block text-sm font-medium text-gray-700">Nomor Soal</label>
              <input type="number" id="nomorSoal" value={nomorSoal} onChange={(e) => setNomorSoal(e.target.value)} required min="1" className="mt-1 input-field" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tipeSoal" className="block text-sm font-medium text-gray-700">Tipe Soal</label>
              <select id="tipeSoal" value={tipeSoal} onChange={(e) => setTipeSoal(e.target.value)} className="mt-1 input-field" disabled={subtesId === 'tkp'}>
                <option value="pg">Pilihan Ganda (PG)</option>
                <option value="pgk">Pilihan Ganda Kompleks (PGK)</option>
                <option value="tabel">Tabel (Benar/Salah)</option>
                <option value="isian">Isian Singkat</option>
              </select>
              {subtesId === 'tkp' && <p className="text-xs text-gray-500 mt-1">TKP otomatis menggunakan Pilihan Ganda (PG).</p>}
            </div>
          </div>
          <div>
            <label htmlFor="narasiSoal" className="block text-sm font-medium text-gray-700">Narasi Soal (Opsional)</label>
            <textarea id="narasiSoal" value={narasiSoal} onChange={(e) => setNarasiSoal(e.target.value)} rows="3" className="mt-1 input-field" placeholder="Teks bacaan untuk beberapa soal... (Boleh HTML)"></textarea>
          </div>
          <div>
            <label htmlFor="teksSoal" className="block text-sm font-medium text-gray-700">Teks Soal / Pertanyaan (Wajib)</label>
            <textarea id="teksSoal" value={teksSoal} onChange={(e) => setTeksSoal(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Masukkan pertanyaan di sini... (Boleh HTML/MathJax)"></textarea>
          </div>
        </fieldset>

        {/* --- Bagian 3: Opsi & Kunci --- */}
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <List className="h-5 w-5 text-blue-600" />
            Opsi Jawaban (Format JSON)
          </legend>
          <div>
            <textarea id="opsiJawaban" value={opsiJawaban} onChange={(e) => setOpsiJawaban(e.target.value)} rows="8" required className="mt-1 input-field font-mono text-sm"></textarea>
          </div>
        </fieldset>
        
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <Key className="h-5 w-5 text-blue-600" />
            Kunci Jawaban (Format JSON)
          </legend>
          <div>
            <textarea id="kunciJawaban" value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} rows="5" required className="mt-1 input-field font-mono text-sm"></textarea>
          </div>
        </fieldset>

        {/* --- Bagian 4: Pembahasan --- */}
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Pembahasan
          </legend>
          <div>
            <textarea id="pembahasan" value={pembahasan} onChange={(e) => setPembahasan(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Jelaskan jawaban yang benar... (Boleh HTML/MathJax)"></textarea>
          </div>
        </fieldset>
        
        {/* Tombol Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex h-[48px] w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {loading ? <ButtonSpinner /> : 'Update Soal'}
          </button>
        </div>
      </form>

      {/* --- Modal Pop-up --- */}
      {modalError && (
        <Modal 
          title="Gagal Update"
          message={modalError} 
          icon={<ErrorIcon />}
          onClose={() => setModalError(null)} 
        />
      )}
      {modalSuccess && (
        <Modal 
          title="Berhasil!"
          message={modalSuccess} 
          icon={<SuccessIcon />}
          onClose={() => setModalSuccess(null)} 
        />
      )}
      
      {/* CSS untuk .input-field */}
      <style>{`
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-field:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
      `}</style>
    </>
  );
}