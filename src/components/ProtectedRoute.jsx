import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigate } from 'react-router-dom';

// Impor komponen loading Anda
import LoadingSpinner from './shared/LoadingSpinner.jsx'; 

/**
 * Komponen ini melindungi rute.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const [authLoading, setAuthLoading] = useState(true); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    
    // --- INI LOGIKA YANG BARU DAN LENGKAP ---

    // 1. Fungsi untuk mengecek sesi aktif & profil
    const checkUserSession = async () => {
      try {
        // Cek sesi yang ada SAAT INI
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsLoggedIn(true);
          // Ambil role user
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("ProtectedRoute: Gagal ambil profil", error.message);
            setUserRole(null); // Gagal ambil role
          } else {
            setUserRole(profile.role);
          }
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (e) {
        console.error("Error di checkUserSession:", e.message);
        setIsLoggedIn(false);
        setUserRole(null);
      } finally {
        // Apapun yang terjadi, hentikan loading
        setAuthLoading(false);
      }
    };
    
    // 2. Jalankan pengecekan itu saat komponen pertama kali dimuat
    checkUserSession();

    // 3. Tetap pasang listener untuk MENDENGARKAN PERUBAHAN
    // (misal: user login/logout di tab lain)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          // Jika user baru login, jalankan ulang pengecekan
          setAuthLoading(true); // Tampilkan loading lagi
          checkUserSession();
        }
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserRole(null);
          setAuthLoading(false); // Langsung hentikan loading
        }
      }
    );

    return () => {
      // Hentikan listener saat komponen 'unmount'
      authListener.subscription.unsubscribe();
    };
  }, []); // Jalankan sekali

  // --- Logika Pengecekan (Render) ---

  // Tampilkan loading HANYA jika kita masih mengecek
  if (authLoading) {
    return (
      <div className="mt-20">
        <LoadingSpinner text="Memverifikasi sesi..." />
      </div>
    );
  }

  // Jika sudah tidak loading, DAN tidak login, tendang
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Jika butuh admin, TAPI role-nya bukan admin, tendang
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // JIKA LOLOS SEMUA: Tampilkan halaman
  return children;
}
