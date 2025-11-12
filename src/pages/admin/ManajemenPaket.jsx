import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Impor Ikon ---
import {
  Plus, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, RefreshCw, 
  Settings, X, Repeat, Repeat1, Copy, Check,
  Gem // <-- IKON BARU
} from 'lucide-react';

// --- Impor Komponen Loading ---
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

// --- Komponen 1: Form Pembuatan Paket ---
const PaketCreateForm = ({ onPaketCreated }) => {
  // ... (Logika state & handleSubmit di sini tetap sama persis seperti File 111) ...
  // ... (Tambahkan is_premium ke state form) ...
  const [judul, setJudul] = useState('');
  const [tipeUjian, setTipeUjian] = useState('skd');
  const [deskripsi, setDeskripsi] = useState('');
  const [waktuMenit, setWaktuMenit] = useState('');
  const [configSubtes, setConfigSubtes] = useState('');
  const [passingGrade, setPassingGrade] = useState('');
  const [isPremium, setIsPremium] = useState(false); // <-- STATE BARU
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let parsedConfig = null;
    let parsedPG = null;
    try {
      if (configSubtes) parsedConfig = JSON.parse(configSubtes);
      if (passingGrade) parsedPG = JSON.parse(passingGrade);
    } catch (jsonError) {
      setError(`Format JSON tidak valid: ${jsonError.message}`);
      setLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      const { data, error } = await fetch('/api/admin/paket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          judul,
          tipe_ujian: tipeUjian,
          deskripsi,
          waktu_total_menit: waktuMenit ? parseInt(waktuMenit, 10) : null,
          config_subtes: parsedConfig,
          passing_grade: parsedPG,
          is_premium: isPremium // <-- KIRIM DATA BARU
        })
      }).then(res => res.json());
      if (error) throw new Error(error.message || "Gagal membuat paket.");
      setLoading(false);
      setIsOpen(false);
      onPaketCreated();
      // Reset form
      setJudul(''); setTipeUjian('skd'); setDeskripsi('');
      setWaktuMenit(''); setConfigSubtes(''); setPassingGrade('');
      setIsPremium(false); // <-- RESET STATE BARU
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          {isOpen ? 'Tutup Form' : '+ Buat Paket Soal Baru'}
        </h2>
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          <Plus className="h-6 w-6 text-blue-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-6 border-t border-gray-200 p-6"
          >
            {error && <p className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</p>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Judul Paket (Wajib)</label>
                <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required className="mt-1 input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipe Ujian (Wajib)</label>
                <select value={tipeUjian} onChange={(e) => setTipeUjian(e.target.value)} required className="mt-1 input-field">
                  <option value="skd">SKD</option>
                  <option value="utbk">UTBK</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
              <input type="text" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="mt-1 input-field" />
            </div>

            {/* --- CHECKBOX PREMIUM BARU --- */}
            <div className="flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="is_premium"
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_premium" className="font-medium text-gray-900">
                  Paket Premium
                </label>
                <p className="text-gray-500">Centang jika ini adalah paket soal berbayar.</p>
              </div>
            </div>
            {/* --- AKHIR CHECKBOX --- */}

            <hr />
            <h3 className="text-md font-semibold text-gray-600">Pengaturan Lanjutan (Spesifik Tipe)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Waktu Total Menit (Hanya untuk SKD)</label>
              <input type="number" value={waktuMenit} onChange={(e) => setWaktuMenit(e.target.value)} className="mt-1 input-field" placeholder="Contoh: 100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passing Grade (Hanya untuk SKD - Format JSON)</label>
              <textarea value={passingGrade} onChange={(e) => setPassingGrade(e.target.value)} rows="3" className="mt-1 input-field font-mono text-sm" placeholder='Contoh: {"twk": 65, "tiu": 80, "tkp": 156}'></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Config Subtes (Hanya untuk UTBK - Format JSON)</label>
              <textarea value={configSubtes} onChange={(e) => setConfigSubtes(e.target.value)} rows="5" className="mt-1 input-field font-mono text-sm" placeholder='Contoh: [{"nama": "Penalaran Umum", "waktu": 30, "jumlah_soal": 20}, ...]'></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Paket Baru'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- Komponen 2: Kartu Paket (DENGAN PERBAIKAN) ---
const PaketCardAdmin = ({ paket, onPaketUpdated, onPaketDeleted }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const updatePaket = async (updatedData) => {
    setIsToggling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      const res = await fetch(`/api/admin/paket?id=${paket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      onPaketUpdated(data.data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  const handlePublishToggle = () => updatePaket({ is_published: !paket.is_published });
  const handleMaxAttemptsChange = (e) => updatePaket({ max_attempts: e.target.value === '1' ? 1 : null });
  // --- HANDLER BARU ---
  const handlePremiumToggle = () => updatePaket({ is_premium: !paket.is_premium });
  
  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus paket "${paket.judul}"? SEMUA soal dan riwayat tes di dalamnya akan HILANG PERMANEN.`)) {
      setIsDeleting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Akses ditolak.");
        const res = await fetch(`/api/admin/paket?id=${paket.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        alert('Paket berhasil dihapus.');
        onPaketDeleted(paket.id);
      } catch (err) {
        alert(`Error: ${err.message}`);
        setIsDeleting(false);
      }
    }
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(paket.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isPublished = paket.is_published;
  const isPremium = paket.is_premium; // <-- AMBIL STATUS PREMIUM

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative overflow-hidden rounded-2xl bg-white shadow-lg border-l-8 
        ${isPublished ? (isPremium ? 'border-yellow-500' : 'border-green-500') : 'border-gray-400'}
      `}
    >
      <div className="p-5">
        <span 
          className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold
            ${isPublished ? (isPremium ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') : 'bg-gray-100 text-gray-700'}
          `}
        >
          {isPublished ? (isPremium ? '💎 Premium' : 'Published') : 'Draft'}
        </span>
        
        <h3 className="text-lg font-bold text-gray-900 pr-20">{paket.judul}</h3>
        <p className="text-sm text-gray-500 mb-4">{paket.tipe_ujian.toUpperCase()}</p>
        
        {/* Tombol Salin ID (Tetap Sama) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500">PAKET ID</label>
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={paket.id} className="w-full truncate rounded-md border-gray-300 bg-gray-100 p-2 font-mono text-xs text-gray-600" />
            <button onClick={handleCopyId} className={`flex-shrink-0 rounded-md p-2 transition-colors ${isCopied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Salin ID Paket">
              {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <hr className="my-4" />
        
        {/* --- Area Interaktif --- */}
        <div className="space-y-4">
          
          {/* 1. Toggle Publish/Hide */}
          <div className="flex items-center justify-between">
            <label htmlFor={`publish-${paket.id}`} className="text-sm font-medium text-gray-700">
              {isPublished ? <Eye className="inline h-4 w-4 mr-1" /> : <EyeOff className="inline h-4 w-4 mr-1" />}
              Tampilkan ke User
            </label>
            <button
              id={`publish-${paket.id}`}
              onClick={handlePublishToggle}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isPublished ? 'bg-green-600' : 'bg-gray-300'} ${isToggling ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* --- PERBAIKAN: TOGGLE PREMIUM --- */}
          <div className="flex items-center justify-between">
            <label htmlFor={`premium-${paket.id}`} className="text-sm font-medium text-gray-700">
              <Gem className={`inline h-4 w-4 mr-1 ${isPremium ? 'text-yellow-600' : ''}`} />
              Paket Premium
            </label>
            <button
              id={`premium-${paket.id}`}
              onClick={handlePremiumToggle}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${isPremium ? 'bg-yellow-500' : 'bg-gray-300'} ${isToggling ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPremium ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {/* --- AKHIR PERBAIKAN --- */}
          
          {/* 2. Toggle 1x Coba */}
          <div className="flex items-center justify-between">
            <label htmlFor={`attempts-${paket.id}`} className="text-sm font-medium text-gray-700">
              Batas Pengerjaan
            </label>
            <select 
              id={`attempts-${paket.id}`} 
              value={paket.max_attempts === 1 ? '1' : 'null'}
              onChange={handleMaxAttemptsChange}
              disabled={isToggling}
              className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="null">Tak Terbatas</option>
              <option value="1">Hanya 1x Coba</option>
            </select>
          </div>
        </div>
        
        <hr className="my-4" />
        
        {/* 3. Tombol Aksi */}
        <div className="flex items-center justify-between">
          <Link
            to={`/admin/soal/${paket.id}`} 
            className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Edit Soal ({paket.soal_count || 0})
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md bg-red-100 p-2 text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            {isDeleting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
          </button>
        </div>

      </div>
    </motion.div>
  );
};


// --- Komponen 3: Halaman Utama (ManajemenPaket) (TETAP SAMA) ---
export default function ManajemenPaket() {
  const [paketList, setPaketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ... (Semua logika fetchPaket, useEffect, dan callback tetap sama persis) ...
  const fetchPaket = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      const res = await fetch('/api/admin/paket', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setPaketList(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPaket(); }, []);
  const handlePaketCreated = () => fetchPaket();
  const handlePaketUpdated = (updatedPaket) => {
    setPaketList(currentList =>
      currentList.map(p => (p.id === updatedPaket.id ? updatedPaket : p))
    );
  };
  const handlePaketDeleted = (deletedPaketId) => {
    setPaketList(currentList =>
      currentList.filter(p => p.id !== deletedPaketId)
    );
  };

  return (
    <div className="space-y-8">
      {/* ... (JSX untuk Form, Loading, Error, dan List tetap sama) ... */}
      <PaketCreateForm onPaketCreated={handlePaketCreated} />
      <h2 className="text-2xl font-semibold text-gray-900">
        Daftar Paket Soal yang Ada
      </h2>
      {loading && <LoadingSpinner text="Memuat daftar paket..." />}
      {error && (
        <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
          <AlertTriangle className="mx-auto h-12 w-12" />
          <h3 className="mt-2 text-lg font-medium">Gagal Memuat Data</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && (
        <AnimatePresence>
          {paketList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paketList.map(paket => (
                <PaketCardAdmin 
                  key={paket.id} 
                  paket={paket} 
                  onPaketUpdated={handlePaketUpdated}
                  onPaketDeleted={handlePaketDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Semua Bersih</h3>
              <p className="text-sm">Belum ada paket soal yang dibuat.</p>
            </div>
          )}
        </AnimatePresence>
      )}
      <style>{`
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-field:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
      `}</style>
    </div>
  );
}