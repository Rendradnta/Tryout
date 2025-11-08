import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  // 1. State untuk menyimpan data user (termasuk role)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 2. useEffect untuk mendengarkan status autentikasi
  useEffect(() => {
    setLoading(true);
    
    // Fungsi untuk mengambil profil user (termasuk role)
    const fetchUserProfile = async (authUser) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Ambil 'role' dari tabel 'profiles'
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, nama_lengkap')
          .eq('id', authUser.id)
          .single();
          
        if (error) throw error;
        
        // Gabungkan data auth dengan data profil
        setUser({ ...authUser, ...profile });
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        setUser(authUser); // Setidaknya simpan data auth jika profil gagal
      } finally {
        setLoading(false);
      }
    };

    // 3. Ambil sesi user saat pertama kali load
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user ?? null);
    });

    // 4. Dengarkan perubahan (Login / Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchUserProfile(session?.user ?? null);
      }
    );

    // 5. Cleanup listener saat komponen 'unmount'
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 6. Fungsi untuk logout
  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
    setUser(null);
    setLoading(false);
    navigate('/login'); // Arahkan ke halaman login
  };
  
  // Jangan render apapun selagi loading status awal
  if (loading) {
    return (
      <header className="bg-white shadow-md h-16"></header> // Placeholder
    );
  }

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        {/* Logo / Judul */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Simulasi<span className="text-gray-800">Ujian</span>
        </Link>
        
        {/* Menu Navigasi */}
        <div className="flex items-center space-x-4">
          {user ? (
            // --- Tampilan Jika Sudah Login ---
            <>
              {/* Link untuk Admin */}
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Admin Panel
                </Link>
              )}
              
              <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/history" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Riwayat
              </Link>
              <Link to="/peringkat" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Peringkat
              </Link>
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            // --- Tampilan Jika Belum Login (Guest) ---
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link 
                to="/signup" 
                className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
