import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigate } from 'react-router-dom';

// Kita gunakan komponen Loading kustom Anda
import LoadingSpinner from './shared/LoadingSpinner.jsx'; 

/**
 * Komponen ini melindungi rute.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  // --- PERBAIKAN DI SINI ---
  // Kita tambahkan state 'authLoading'
  const [authLoading, setAuthLoading] = useState(true); 
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Kita gunakan onAuthStateChange karena ini yang paling akurat.
    // Ini akan berjalan saat load DAN saat login/logout.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setIsLoggedIn(true);
          // Ambil role user
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            setUserRole(profile.role);
          } catch (error) {
            console.error("Error fetching user profile:", error.message);
            setUserRole(null);
          }
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
        // Selesai mengecek, matikan loading
        setAuthLoading(false);
      }
    );

    return () => {
      // Hentikan listener saat komponen 'unmount'
      authListener.subscription.unsubscribe();
    };
  }, []); // Jalankan sekali

  // --- Logika Pengecekan ---

  // 1. Tampilkan loading jika kita BELUM SELESAI mengecek auth
  if (authLoading) {
    return (
      <div className="mt-20">
        <LoadingSpinner text="Memverifikasi sesi..." />
      </div>
    );
  }

  // 2. Jika sudah selesai, DAN TIDAK login, tendang ke Login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 3. Jika sudah login, DAN butuh admin, TAPI role-nya BUKAN admin
  if (adminOnly && userRole !== 'admin') {
    // Tendang ke halaman utama (Dashboard)
    return <Navigate to="/" replace />;
  }

  // 4. JIKA LOLOS SEMUA: Tampilkan halaman (Dashboard/Admin)
  return children;
              }
