import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Navigate } } from 'react-router-dom';

// Komponen loading sederhana
const LoadingScreen = () => (
  <div className="text-center py-20">
    <p className="text-xl text-gray-700">Memverifikasi akses...</p>
  </div>
);

/**
 * Komponen ini melindungi rute.
 * @param {boolean} adminOnly - Jika true, hanya admin yang boleh akses.
 * @param {React.ReactNode} children - Halaman yang akan ditampilkan jika lolos.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      
      // 1. Cek sesi login
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getSession:", sessionError.message);
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      if (!session) {
        // 2. Jika tidak ada sesi (tidak login)
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      // 3. Jika login, catat status dan cek role
      setIsLoggedIn(true);

      // Ambil 'role' dari tabel 'profiles'
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;

        setUserRole(profile.role); // Simpan rolenya (misal: 'admin' atau 'user')
      } catch (error) {
        console.error("Error fetching user profile for role:", error.message);
        setUserRole(null); // Gagal mengambil role
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Dengarkan juga perubahan auth, jika user logout di tab lain
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) = > {
        if (_event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, []);

  // --- Logika Pengecekan ---

  // 4. Selama masih loading, tampilkan layar loading
  if (loading) {
    return <LoadingScreen />;
  }

  // 5. Jika TIDAK login, tendang ke halaman Login
  if (!isLoggedIn) {
    // Navigate adalah komponen, cara terbaik untuk redirect di dalam render
    return <Navigate to="/login" replace />;
  }

  // 6. Jika butuh ADMIN, tapi role user BUKAN admin
  if (adminOnly && userRole !== 'admin') {
    // Tendang ke halaman utama (Dashboard)
    return <Navigate to="/" replace />;
  }

  // 7. JIKA LOLOS SEMUA: Tampilkan halaman yang dilindungi
  return children;
}
