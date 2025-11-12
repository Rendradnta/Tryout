import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

// --- Impor Ikon ---
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Crown,
  User,
  Shield,
  Star
} from 'lucide-react';

// --- Komponen 1: Modal Edit User ---
const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [role, setRole] = useState(user.role);
  
  // Format tanggal dari Supabase (TIMESTAMPTZ) ke YYYY-MM-DD untuk input date
  const getInitialDate = (isoDate) => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  const [premiumExpiry, setPremiumExpiry] = useState(getInitialDate(user.premium_expires_at));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      // Jika tanggal dikosongkan, kirim NULL, jika tidak, kirim ISO string
      const expiryDateToSend = premiumExpiry ? new Date(premiumExpiry).toISOString() : null;

      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          role: role,
          premium_expires_at: expiryDateToSend
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      onUserUpdated(data.data); // Update data di tabel parent
      onClose(); // Tutup modal
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSave}>
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {error && <p className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</p>}
            
            <p className="text-sm">
              <span className="font-medium text-gray-900">Email:</span> {user.email}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-900">Nama:</span> {user.nama_lengkap || '-'}
            </p>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role Pengguna</label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 input-field"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="premium" className="block text-sm font-medium text-gray-700">Premium Kadaluwarsa Pada</label>
              <input 
                id="premium"
                type="date"
                value={premiumExpiry}
                onChange={(e) => setPremiumExpiry(e.target.value)}
                className="mt-1 input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kosongkan tanggal untuk menghapus status premium (menjadi user gratis).
              </p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- Komponen 2: Modal Konfirmasi Hapus ---
const DeleteUserModal = ({ user, onClose, onUserDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");

      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      onUserDeleted(user.id); // Hapus user dari state parent
      onClose(); // Tutup modal
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h3 className="mt-4 text-2xl font-bold text-gray-900">Hapus Pengguna?</h3>
          <p className="mt-2 text-sm text-gray-600">
            Anda yakin ingin menghapus akun <br />
            <strong className="text-gray-900">{user.email}</strong>?
            <br/><br/>
            Tindakan ini akan **menghapus permanen** akun ini beserta semua riwayat tes (`history_tes`) mereka. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        {error && <p className="p-4 text-center text-sm text-red-700">{error}</p>}
        <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Ya, Hapus Pengguna'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Komponen 3: Badge Status Premium ---
const PremiumBadge = ({ expiryDate }) => {
  if (!expiryDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
        <User className="h-3 w-3" />
        Gratis
      </span>
    );
  }
  
  const isPremium = new Date(expiryDate) > new Date();
  
  if (isPremium) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        <Star className="h-3 w-3 fill-green-500" />
        Premium
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        <AlertTriangle className="h-3 w-3" />
        Kadaluwarsa
      </span>
    );
  }
};

// --- Komponen 4: Halaman Utama (ManajemenUser) ---
export default function ManajemenUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk Modal
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Fungsi untuk memuat semua user
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Akses ditolak.");
      
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Muat data saat halaman dibuka
  useEffect(() => {
    fetchUsers();
  }, []);

  // Callback: Mengupdate list user di UI setelah diedit
  const handleUserUpdated = (updatedUser) => {
    setUsers(currentUsers =>
      currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
    );
  };
  
  // Callback: Menghapus user dari list di UI setelah dihapus
  const handleUserDeleted = (deletedUserId) => {
    setUsers(currentUsers =>
      currentUsers.filter(u => u.id !== deletedUserId)
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Manajemen Pengguna
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Kelola role dan status premium untuk semua pengguna di platform Anda.
            </p>
          </div>
        </div>

        {/* Tampilan Loading / Error / List */}
        {loading && <LoadingSpinner text="Memuat daftar pengguna..." />}
        
        {error && (
          <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
            <AlertTriangle className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-lg font-medium">Gagal Memuat Data</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tabel Pengguna (Premium & Responsif) */}
        {!loading && !error && (
          <div className="shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="py-4 px-6 min-w-[250px]">
                      Email
                    </th>
                    <th scope="col" className="py-4 px-6 min-w-[200px]">
                      Nama Lengkap
                    </th>
                    <th scope="col" className="py-4 px-6 text-center">
                      Role
                    </th>
                    <th scope="col" className="py-4 px-6 text-center">
                      Status Premium
                    </th>
                    <th scope="col" className="py-4 px-6 min-w-[200px]">
                      Premium s/d
                    </th>
                    <th scope="col" className="py-4 px-6 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-base">Belum ada pengguna yang terdaftar.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                          {user.nama_lengkap || '-'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              <User className="h-3 w-3" />
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <PremiumBadge expiryDate={user.premium_expires_at} />
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {user.premium_expires_at ? 
                            new Date(user.premium_expires_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) :
                            '-'}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="font-medium text-blue-600 hover:underline"
                            title="Edit User"
                          >
                            <Edit className="inline h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="font-medium text-red-600 hover:underline"
                            title="Hapus User"
                          >
                            <Trash2 className="inline h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Render Modal (Akan muncul saat 'editingUser' atau 'deletingUser' di-set) --- */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal 
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUserUpdated={handleUserUpdated}
          />
        )}
        {deletingUser && (
          <DeleteUserModal
            user={deletingUser}
            onClose={() => setDeletingUser(null)}
            onUserDeleted={handleUserDeleted}
          />
        )}
      </AnimatePresence>
      
      {/* CSS untuk .input-field */}
      <style>{`
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-field:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
      `}</style>
    </>
  );
}