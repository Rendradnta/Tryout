import React, { useState, useEffect } from 'react';
// --- PERBAIKAN 1 DI SINI ---
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';

// --- Impor Ikon ---
import {
  Package,
  LayoutList,
  FilePlus,
  Edit3,
  Trash2
} from 'lucide-react';

import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

// --- Impor Halaman Admin ---
import AdminTambahSoal from './AdminTambahSoal.jsx';
import AdminEditSoal from './AdminEditSoal.jsx';
import ManajemenPaket from './ManajemenPaket.jsx';


// --- Komponen Internal: SoalList (TETAP SAMA) ---
const SoalList = () => {
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDaftarSoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      const res = await fetch('/api/admin/soal', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || "Gagal mengambil daftar soal.");
      }
      const { data } = await res.json();
      setSoalList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaftarSoal();
  }, []);

  const handleDelete = async (soalId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      const res = await fetch(`/api/admin/soal?id=${soalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghapus soal.");
      }
      alert("Soal berhasil dihapus!");
      fetchDaftarSoal(); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <p className="text-gray-600">Memuat daftar soal...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      <div className="p-5 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Manajemen Soal</h2>
        <Link 
          to="/admin/soal/tambah"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <FilePlus className="h-4 w-4" />
          Tambah Soal
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">No.</th>
              <th scope="col" className="py-3 px-6">Cuplikan Teks Soal</th>
              <th scope="col" className="py-3 px-6">Tipe</th>
              <th scope="col" className="py-3 px-6">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {soalList.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Belum ada soal. Silakan tambah soal baru.
                </td>
              </tr>
            ) : (
              soalList.map((soal) => (
                <tr key={soal.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium">{soal.nomor_soal || '-'}</td>
                  <td className="py-4 px-6 text-gray-900">
                    {soal.teks_soal.replace(/<[^>]+>/g, '').substring(0, 70)}...
                  </td>
                  <td className="py-4 px-6">{soal.tipe_soal}</td>
                  <td className="py-4 px-6 space-x-3 whitespace-nowrap">
                    <Link 
                      to={`/admin/soal/edit/${soal.id}`} 
                      className="font-medium text-blue-600 hover:underline"
                    >
                      <Edit3 className="inline h-4 w-4" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(soal.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="inline h-4 w-4" /> Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- Komponen Utama AdminDashboard (LAYOUT BARU) ---
export default function AdminDashboard() {
  // --- PERBAIKAN 2 DI SINI ---
  // Panggil hook 'useLocation'
  const location = useLocation();
  
  // Fungsi helper untuk styling NavLink
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors
     ${isActive
       ? 'bg-blue-100 text-blue-700 font-semibold shadow-inner' 
       : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
     }`;

  return (
    <div className="flex flex-col gap-8 md:flex-row md:gap-10">
      
      {/* --- Sidebar Navigasi Admin --- */}
      <aside className="w-full flex-shrink-0 md:w-1/4 lg:w-1/5">
        <div className="sticky top-24 rounded-2xl bg-white p-4 shadow-lg">
          <h2 className="mb-4 text-xs font-semibold uppercase text-gray-400">
            Menu Admin
          </h2>
          <nav className="flex flex-col space-y-2">
            
            <NavLink to="/admin/paket" className={navLinkClass}>
              <Package className="h-5 w-5" />
              Manajemen Paket
            </NavLink>
            
            <NavLink to="/admin/soal" className={navLinkClass}>
              <LayoutList className="h-5 w-5" />
              Manajemen Soal
            </NavLink>
            
          </nav>
        </div>
      </aside>

      {/* --- Area Konten Utama --- */}
      <main className="w-full">
        {/* 'location.pathname' sekarang sudah terdefinisi */}
        <motion.div
          key={location.pathname} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route index element={<Navigate to="paket" replace />} />
            <Route path="paket" element={<ManajemenPaket />} />
            <Route path="soal" element={<SoalList />} /> 
            <Route path="soal/tambah" element={<AdminTambahSoal />} />
            <Route path="soal/edit/:soalId" element={<AdminEditSoal />} />
          </Routes>
        </motion.div>
      </main>
      
    </div>
  );
    }
