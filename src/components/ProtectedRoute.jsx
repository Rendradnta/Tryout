import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigate } from 'react-router-dom';

// Kita bisa gunakan komponen LoadingSpinner yang baru
// (Jika belum ada, ganti dengan <div><p>Loading...</p></div>)
import LoadingSpinner from './shared/LoadingSpinner.jsx'; 

/**
 * Komponen ini melindungi rute.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const [authLoading, setAuthLoading] = useState(true); 
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // onAuthStateChange adalah listener terbaik
    // Ia akan berjalan saat load awal DAN saat login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
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
              throw error; // Lempar error agar ditangkap catch
            }
            setUserRole(profile.role);
          } else {
            setIsLoggedIn(false);
            setUserRole(null);
          }
        } catch (error) {
          // Jika gagal (misal RLS), setidaknya catat
          console.error("Error di dalam listener auth:", error.message);
          setIsLoggedIn(false);
          setUserRole(null);
        } finally {
          // --- INI ADALAH PERBAIKANNYA ---
          // Pastikan loading SELALU berhenti
          setAuthLoading(false);
        }
      }
    );

    return () => {
      // Hentikan listener saat komponen 'unmount'
      authListener.subscription.unsubscribe();
    };
  }, []); // Jalankan sekali

  // --- Logika Pengecekan ---

  if (authLoading) {
    return (
      <div className="mt-20">
        <LoadingSpinner text="Memverifikasi sesi..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // JIKA LOLOS SEMUA: Tampilkan halaman (Dashboard/Admin)
  return children;
}
