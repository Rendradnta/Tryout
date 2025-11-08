import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Contoh data JSON untuk mempermudah admin
const CONTOH_OPSI_PG = JSON.stringify([
  { "id": "A", "teks": "Teks Opsi A" },
  { "id": "B", "teks": "Teks Opsi B" },
  { "id": "C", "teks": "Teks Opsi C" }
], null, 2);

const CONTOH_KUNCI_PG = JSON.stringify({ "kunci": "A" }, null, 2);
const CONTOH_KUNCI_TKP = JSON.stringify({ "A": 5, "B": 4, "C": 3, "D": 2, "E": 1 }, null, 2);
const CONTOH_KUNCI_PGK = JSON.stringify({ "kunci": ["1", "3"] }, null, 2);

export default function AdminTambahSoal() {
  // 1. State untuk semua field di form
  const [paketId, setPaketId] = useState('');
  const [subtesId, setSubtesId] = useState('');
  const [nomorSoal, setNomorSoal] = useState(1);
  const [tipeSoal, setTipeSoal] = useState('pg'); // Default 'pg'
  const [narasiSoal, setNarasiSoal] = useState('');
  const [teksSoal, setTeksSoal] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState(CONTOH_OPSI_PG);
  const [kunciJawaban, setKunciJawaban] = useState(CONTOH_KUNCI_PG);
  const [pembahasan, setPembahasan] = useState('');
  
  // State untuk UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(null);
  const navigate = useNavigate();

  // 2. Fungsi saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSukses(null);

    let parsedOpsi, parsedKunci;

    // 3. Validasi dan Parse JSON
    try {
      parsedOpsi = JSON.parse(opsiJawaban);
      parsedKunci = JSON.parse(kunciJawaban);
    } catch (jsonError) {
      setError(`Format JSON tidak valid: ${jsonError.message}`);
      setLoading(false);
      return;
    }

    try {
      // 4. Ambil token otentikasi admin
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak. Silakan login ulang.");

      // 5. Kirim data ke API backend 'tambahSoal'
      const res = await fetch('/api/admin/tambahSoal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paket_id: paketId,
          subtes_id: subtesId || null, // Izinkan subtes_id kosong
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

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan soal.");
      }

      // 6. Berhasil!
      setSukses("Soal berhasil ditambahkan!");
      // Kosongkan form (opsional) atau redirect
      // navigate('/admin'); // Uncomment ini untuk redirect
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Tambah Soal Baru</h2>
      
      {/* Pesan Status */}
      {error && <p className="p-3 bg-red-100 text-red-700 rounded-md">{error}</p>}
      {sukses && <p className="p-3 bg-green-100 text-green-700 rounded-md">{sukses}</p>}

      {/* Baris 1: Paket & Subtes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paketId" className="block text-sm font-medium text-gray-700">Paket ID (Wajib)</label>
          <input type="text" id="paketId" value={paketId} onChange={(e) => setPaketId(e.target.value)} required className="mt-1 input-field" />
          <p className="text-xs text-gray-500">Salin ID dari tabel 'paket_soal' di Supabase.</p>
        </div>
        <div>
          <label htmlFor="subtesId" className="block text-sm font-medium text-gray-700">Subtes ID (Opsional)</label>
          <input type="text" id="subtesId" value={subtesId} onChange={(e) => setSubtesId(e.target.value)} className="mt-1 input-field" />
        </div>
      </div>

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

      {/* Narasi Soal */}
      <div>
        <label htmlFor="narasiSoal" className="block text-sm font-medium text-gray-700">Narasi Soal (Opsional)</label>
        <textarea id="narasiSoal" value={narasiSoal} onChange={(e) => setNarasiSoal(e.target.value)} rows="3" className="mt-1 input-field" placeholder="Teks bacaan untuk beberapa soal... (Boleh HTML)"></textarea>
      </div>

      {/* Teks Soal */}
      <div>
        <label htmlFor="teksSoal" className="block text-sm font-medium text-gray-700">Teks Soal / Pertanyaan (Wajib)</label>
        <textarea id="teksSoal" value={teksSoal} onChange={(e) => setTeksSoal(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Masukkan pertanyaan di sini... (Boleh HTML/MathJax)"></textarea>
      </div>

      {/* Opsi Jawaban (JSON) */}
      <div>
        <label htmlFor="opsiJawaban" className="block text-sm font-medium text-gray-700">Opsi Jawaban (Wajib - Format JSON)</label>
        <textarea id="opsiJawaban" value={opsiJawaban} onChange={(e) => setOpsiJawaban(e.target.value)} rows="8" required className="mt-1 input-field font-mono text-sm"></textarea>
      </div>

      {/* Kunci Jawaban (JSON) */}
      <div>
        <label htmlFor="kunciJawaban" className="block text-sm font-medium text-gray-700">Kunci Jawaban (Wajib - Format JSON)</label>
        <textarea id="kunciJawaban" value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} rows="5" required className="mt-1 input-field font-mono text-sm"></textarea>
        <p className="text-xs text-gray-500">Contoh PG: {CONTOH_KUNCI_PG} | Contoh TKP: {CONTOH_KUNCI_TKP}</p>
      </div>

      {/* Pembahasan */}
      <div>
        <label htmlFor="pembahasan" className="block text-sm font-medium text-gray-700">Pembahasan (Wajib)</label>
        <textarea id="pembahasan" value={pembahasan} onChange={(e) => setPembahasan(e.target.value)} rows="5" required className="mt-1 input-field" placeholder="Jelaskan jawaban yang benar... (Boleh HTML/MathJax)"></textarea>
      </div>

      {/* Tombol Submit */}
      <div className="text-right">
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Simpan Soal Baru'}
        </button>
      </div>
      
      {/* Styling untuk .input-field (tambahkan di index.css jika perlu) */}
      <style>{`
        .input-field {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D1D5DB; /* border-gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .input-field:focus {
          outline: none;
          border-color: #3B82F6; /* focus:border-blue-500 */
          box-shadow: 0 0 0 2px #BFDBFE; /* focus:ring-blue-200 */
        }
      `}</style>
    </form>
  );
}
