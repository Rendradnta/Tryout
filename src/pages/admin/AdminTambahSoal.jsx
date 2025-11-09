import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// ... (semua const CONTOH_JSON Anda tetap sama) ...
const CONTOH_OPSI_PG = JSON.stringify([
  { "id": "A", "teks": "Teks Opsi A" },
  { "id": "B", "teks": "Teks Opsi B" },
  { "id": "C", "teks": "Teks Opsi C" }
], null, 2);
const CONTOH_KUNCI_PG = JSON.stringify({ "kunci": "A" }, null, 2);
const CONTOH_KUNCI_TKP = JSON.stringify({ "A": 5, "B": 4, "C": 3, "D": 2, "E": 1 }, null, 2);

export default function AdminTambahSoal() {
  const [paketId, setPaketId] = useState('');
  
  // --- PERUBAHAN DI SINI ---
  // Kita beri nilai default 'twk' agar tidak kosong
  const [subtesId, setSubtesId] = useState('twk'); 
  // --- AKHIR PERUBAHAN ---

  const [nomorSoal, setNomorSoal] = useState(1);
  const [tipeSoal, setTipeSoal] = useState('pg');
  const [narasiSoal, setNarasiSoal] = useState('');
  const [teksSoal, setTeksSoal] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState(CONTOH_OPSI_PG);
  const [kunciJawaban, setKunciJawaban] = useState(CONTOH_KUNCI_PG);
  const [pembahasan, setPembahasan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSukses(null);

    let parsedOpsi, parsedKunci;

    // Validasi JSON
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

      const res = await fetch('/api/admin/soal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paket_id: paketId,
          subtes_id: subtesId, // subtesId sekarang DIJAMIN benar
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

      setSukses("Soal berhasil ditambahkan!");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Tambah Soal Baru</h2>
      
      {error && <p className="p-3 bg-red-100 text-red-700 rounded-md">{error}</p>}
      {sukses && <p className="p-3 bg-green-100 text-green-700 rounded-md">{sukses}</p>}

      {/* Baris 1: Paket & Subtes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paketId" className="block text-sm font-medium text-gray-700">Paket ID (Wajib)</label>
          <input type="text" id="paketId" value={paketId} onChange={(e) => setPaketId(e.target.value)} required className="mt-1 input-field" />
          <p className="text-xs text-gray-500">Salin ID dari tabel 'paket_soal'.</p>
        </div>
        
        {/* --- PERBAIKAN DI SINI --- */}
        <div>
          <label htmlFor="subtesId" className="block text-sm font-medium text-gray-700">Subtes ID (Wajib)</label>
          <select 
            id="subtesId" 
            value={subtesId} 
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
            {/* Tambahkan subtes UTBK lain jika perlu */}
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
        <textarea id="narasiSoal" value={narasiSoal} onChange={(e) => setNarasiSoal(e.target.value)} rows="3" className="mt-1 input-field" placeholder="Teks bacaan untuk beberapa soal... (Boleh HTML)"></textarea>
      </div>
      <div>
        <label htmlFor="teksSoal" className="block text-sm font-medium text-gray-700">Teks Soal / Pertanyaan (Wajib)</label>
        <textarea id="teksSoal" value={teksSoal} onChange={(e) => setTeksSoal(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Masukkan pertanyaan di sini... (Boleh HTML/MathJax)"></textarea>
      </div>
      <div>
        <label htmlFor="opsiJawaban" className="block text-sm font-medium text-gray-700">Opsi Jawaban (Wajib - Format JSON)</label>
        <textarea id="opsiJawaban" value={opsiJawaban} onChange={(e) => setOpsiJawaban(e.target.value)} rows="8" required className="mt-1 input-field font-mono text-sm"></textarea>
      </div>
      <div>
        <label htmlFor="kunciJawaban" className="block text-sm font-medium text-gray-700">Kunci Jawaban (Wajib - Format JSON)</label>
        <textarea id="kunciJawaban" value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} rows="5" required className="mt-1 input-field font-mono text-sm"></textarea>
        <p className="text-xs text-gray-500">Contoh PG: {CONTOH_KUNCI_PG} | Contoh TKP: {CONTOH_KUNCI_TKP}</p>
      </div>
      <div>
        <label htmlFor="pembahasan" className="block text-sm font-medium text-gray-700">Pembahasan (Wajib)</label>
        <textarea id="pembahasan" value={pembahasan} onChange={(e) => setPembahasan(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Jelaskan jawaban yang benar... (Boleh HTML/MathJax)"></textarea>
      </div>
      
      <div className="text-right">
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Simpan Soal Baru'}
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
