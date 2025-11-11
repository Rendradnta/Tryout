// --- PERBAIKAN 1: Impor 'useEffect' ---
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
// --- PERBAIKAN 2: Impor 'useSearchParams' ---
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- (Semua Ikon & Komponen Modal Anda tetap sama) ---
import {
  Package, FileText, List, Key, BookOpen, AlertTriangle, CheckCircle2
} from 'lucide-react';
const Modal = ({ title, message, icon, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      <div className="text-center">
        {icon}
        <h3 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <button onClick={onClose} className="mt-6 w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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
// --- (Semua Contoh JSON Anda tetap sama) ---
const CONTOH_OPSI_PG = JSON.stringify([{ "id": "A", "teks": "Teks Opsi A" }, { "id": "B", "teks": "Teks Opsi B" }], null, 2);
const CONTOH_OPSI_PGK = JSON.stringify([{ "id": "1", "teks": "Centang ini" }, { "id": "2", "teks": "Centang itu" }], null, 2);
const CONTOH_OPSI_TABEL = JSON.stringify([{ "id": "p1", "teks": "Pernyataan 1" }, { "id": "p2", "teks": "Pernyataan 2" }], null, 2);
const CONTOH_KUNCI_PG = JSON.stringify({ "kunci": "A" }, null, 2);
const CONTOH_KUNCI_PGK = JSON.stringify({ "kunci": ["1", "2"] }, null, 2);
const CONTOH_KUNCI_TABEL = JSON.stringify({ "p1": "benar", "p2": "salah" }, null, 2);
const CONTOH_KUNCI_TKP = JSON.stringify({ "A": 5, "B": 4, "C": 3, "D": 2, "E": 1 }, null, 2);

export default function AdminTambahSoal() {
  // --- State Form ---
  const [paketId, setPaketId] = useState('');
  const [subtesId, setSubtesId] = useState('twk'); 
  const [nomorSoal, setNomorSoal] = useState(1);
  const [tipeSoal, setTipeSoal] = useState('pg');
  const [narasiSoal, setNarasiSoal] = useState('');
  const [teksSoal, setTeksSoal] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState(CONTOH_OPSI_PG);
  const [kunciJawaban, setKunciJawaban] = useState(CONTOH_KUNCI_PG);
  const [pembahasan, setPembahasan] = useState('');
  
  // --- State UI ---
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const navigate = useNavigate();
  
  // --- PERBAIKAN 3: Panggil hook 'useSearchParams' ---
  const [searchParams] = useSearchParams();

  // --- PERBAIKAN 4: useEffect BARU untuk membaca URL ---
  useEffect(() => {
    // Cek apakah ada '?paketId=...' di URL
    const idFromUrl = searchParams.get('paketId');
    if (idFromUrl) {
      // Jika ada, langsung isi field Paket ID
      setPaketId(idFromUrl);
    }
  }, []); // [] = Hanya jalan sekali saat halaman dimuat
  // --- AKHIR PERBAIKAN 4 ---

  // --- (useEffect interaktif Anda tetap sama) ---
  useEffect(() => {
    switch (tipeSoal) {
      case 'pg': setOpsiJawaban(CONTOH_OPSI_PG); setKunciJawaban(CONTOH_KUNCI_PG); break;
      case 'pgk': setOpsiJawaban(CONTOH_OPSI_PGK); setKunciJawaban(CONTOH_KUNCI_PGK); break;
      case 'tabel': setOpsiJawaban(CONTOH_OPSI_TABEL); setKunciJawaban(CONTOH_KUNCI_TABEL); break;
      case 'isian': setOpsiJawaban('[]'); setKunciJawaban(CONTOH_KUNCI_PG); break;
      default: setOpsiJawaban(CONTOH_OPSI_PG); setKunciJawaban(CONTOH_KUNCI_PG);
    }
  }, [tipeSoal]);

  useEffect(() => {
    if (subtesId === 'tkp') {
      setTipeSoal('pg');
      setKunciJawaban(CONTOH_KUNCI_TKP);
    } else {
      if (tipeSoal === 'pg') setKunciJawaban(CONTOH_KUNCI_PG);
    }
  }, [subtesId, tipeSoal]);

  // --- (handleSubmit Anda tetap sama) ---
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
    if (!subtesId) {
      setModalError("Subtes ID wajib dipilih.");
      setLoading(false);
      return;
    }
    if (!paketId) {
      setModalError("Paket ID wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      const res = await fetch('/api/admin/soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
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
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan soal.");

      setModalSuccess("Soal berhasil ditambahkan!");
      setNomorSoal(prev => prev + 1);
      setNarasiSoal('');
      setTeksSoal('');
      setPembahasan('');
      
    } catch (err) {
      setModalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- (Seluruh JSX Anda tetap sama) ---
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 shadow-xl rounded-2xl">
        <h2 className="text-3xl font-bold text-gray-900">Tambah Soal Baru</h2>
        
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          <legend className="flex items-center gap-2 px-2 text-lg font-semibold text-gray-700">
            <Package className="h-5 w-5 text-blue-600" />
            Detail Paket & Subtes
          </legend>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="paketId" className="block text-sm font-medium text-gray-700">Paket ID (Wajib)</label>
              {/* --- PERBAIKAN 5: Tambahkan 'readOnly' jika diisi otomatis --- */}
              <input 
                type="text" 
                id="paketId" 
                value={paketId} 
                onChange={(e) => setPaketId(e.target.value)} 
                required 
                className="mt-1 input-field" 
                placeholder="Salin ID dari 'Manajemen Paket'"
                readOnly={searchParams.get('paketId')} // Kunci field jika ID dari URL
              />
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
        
        {/* --- (Sisa form Anda tetap sama) --- */}
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          {/* ... (Isi Soal) ... */}
        </fieldset>
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          {/* ... (Opsi Jawaban) ... */}
        </fieldset>
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          {/* ... (Kunci Jawaban) ... */}
        </fieldset>
        <fieldset className="space-y-6 rounded-lg border p-6 pt-4">
          {/* ... (Pembahasan) ... */}
        </fieldset>
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex h-[48px] w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {loading ? <ButtonSpinner /> : 'Simpan Soal Baru'}
          </button>
        </div>
      </form>

      {/* --- (Modal Anda tetap sama) --- */}
      {modalError && (
        <Modal 
          title="Gagal Menyimpan"
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
      
      <style>{`
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-field:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
        .input-field[readOnly] { background-color: #F3F4F6; cursor: not-allowed; }
      `}</style>
    </>
  );
}