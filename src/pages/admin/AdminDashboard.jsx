import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

// Impor Halaman Admin (yang akan kita buat selanjutnya)
import AdminTambahSoal from './AdminTambahSoal.jsx';
import AdminEditSoal from './AdminEditSoal.jsx';

// --- 1. Komponen Internal untuk Daftar Soal ---
// (Kita letakkan di sini agar sesuai file list Anda)
// Komponen ini akan di-render di path default ('/admin')
const SoalList = () => {
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil daftar soal dari API
  const fetchDaftarSoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak. Silakan login ulang.");

      // Panggil API admin yang sudah kita buat
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

  // Ambil data saat komponen dimuat
  useEffect(() => {
    fetchDaftarSoal();
  }, []);

  // Fungsi untuk menghapus soal
  const handleDelete = async (soalId) => {
    // Tampilkan konfirmasi
    if (!window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      // Panggil API hapus soal yang sudah kita buat
      const res = await fetch(`/api/admin/soal?id=${soalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghapus soal.");
      }
      
      // Sukses! Muat ulang daftar soal dari server
      alert("Soal berhasil dihapus!");
      fetchDaftarSoal(); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // --- Tampilan render untuk SoalList ---
  if (loading) return <p className="text-gray-600">Memuat daftar soal...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
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
                  {/* Tampilkan cuplikan soal, hapus tag HTML */}
                  {soal.teks_soal.replace(/<[^>]+>/g, '').substring(0, 70)}...
                </td>
                <td className="py-4 px-6">{soal.tipe_soal}</td>
                <td className="py-4 px-6 space-x-3 whitespace-nowrap">
                  <Link 
                    to={`/admin/edit/${soal.id}`} 
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(soal.id)}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};


// --- 2. Komponen Utama AdminDashboard (Layout) ---
export default function AdminDashboard() {
  // Fungsi helper untuk styling NavLink (Link navigasi)
  const navLinkClass = ({ isActive }) =>
    `block p-3 rounded-md transition-colors ${
      isActive
        ? 'bg-blue-600 text-white font-medium'
        : 'bg-gray-100 hover:bg-gray-200'
    }`;

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-10">
      
      {/* --- Sidebar Navigasi Admin --- */}
      <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          {/* Link ke '/admin' (Menampilkan SoalList) */}
          <NavLink to="/admin" end className={navLinkClass}>
            Manajemen Soal
          </NavLink>
          {/* Link ke '/admin/tambah' (Menampilkan AdminTambahSoal) */}
          <NavLink to="/admin/tambah" className={navLinkClass}>
            + Tambah Soal Baru
          </NavLink>
          {/* Anda bisa tambahkan link lain di sini, misal:
          <NavLink to="/admin/users" className={navLinkClass}>
            Manajemen User
          </NavLink> 
          */}
        </nav>
      </aside>

      {/* --- Area Konten Utama (Tempat Halaman Berubah) --- */}
      <main className="w-full md:w-3/4 lg:w-4/5">
        <Routes>
          {/* Rute 1: '/admin' (root) */}
          <Route path="/" element={<SoalList />} /> 
          
          {/* Rute 2: '/admin/tambah' */}
          <Route path="tambah" element={<AdminTambahSoal />} />
          
          {/* Rute 3: '/admin/edit/:soalId' (dinamis) */}
          <Route path="edit/:soalId" element={<AdminEditSoal />} />
        </Routes>
      </main>
      
    </div>
  );
}
