import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Impor Ikon Profesional ---
import {
  LayoutDashboard,
  History,
  BarChart3, // (Ikon Peringkat)
  UserCog,     // (Ikon Admin)
  LogOut,
  LogIn,
  UserPlus,
  Home
} from 'lucide-react';

// --- Komponen Burger Kustom ---
// (Sesuai deskripsi Anda: 2 kiri, 1 kanan)
const CustomBurgerIcon = ({ isOpen }) => {
  return (
    <motion.div
      className="relative h-5 w-6"
      animate={isOpen ? "open" : "closed"}
    >
      {/* 2 Kotak Kiri (menjadi 1 garis diagonal) */}
      <motion.span
        className="absolute left-0 h-2.5 w-2.5 bg-gray-800"
        style={{ top: 0 }}
        variants={{
          closed: { top: 0, rotate: 0 },
          open: { top: '50%', y: '-50%', rotate: 45 }
        }}
      />
      <motion.span
        className="absolute left-0 h-2.5 w-2.5 bg-gray-800"
        style={{ bottom: 0 }}
        variants={{
          closed: { bottom: 0, rotate: 0 },
          open: { top: '50%', y: '-50%', rotate: 45 }
        }}
      />
      
      {/* 1 Persegi Panjang Kanan (menjadi 1 garis diagonal) */}
      <motion.span
        className="absolute right-0 top-0 h-full w-2.5 bg-gray-800"
        variants={{
          closed: { opacity: 1, rotate: 0 },
          open: { top: '50%', y: '-50%', rotate: -45, height: '2.5px' }
        }}
      />
    </motion.div>
  );
};

// --- Komponen Link untuk Mobile (agar menu tertutup saat diklik) ---
const MobileNavLink = ({ to, icon, text, onClick, isAdmin = false }) => {
  const NavIcon = icon;
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors
         ${isActive
           ? (isAdmin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')
           : 'text-gray-700 hover:bg-gray-100'
         }`
      }
    >
      <NavIcon className={`h-5 w-5 ${isAdmin ? 'text-red-700' : ''}`} />
      {text}
    </NavLink>
  );
};


export default function Navbar() {
  // --- Logika State (Dimodifikasi) ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State untuk menu mobile
  const navigate = useNavigate();

  // --- Logika useEffect (TETAP SAMA) ---
  useEffect(() => {
    setLoading(true);
    const fetchUserProfile = async (authUser) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data: profile, error } = await supabase.from('profiles').select('role, nama_lengkap').eq('id', authUser.id).single();
        if (error) throw error;
        setUser({ ...authUser, ...profile });
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        setUser(authUser);
      } finally {
        setLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchUserProfile(session?.user ?? null);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- Logika handleLogout (TETAP SAMA) ---
  const handleLogout = async () => {
    setIsMobileMenuOpen(false); // Tutup menu saat logout
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    navigate('/login');
  };
  
  // --- Tampilan JSX (MODERN) ---
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
        
        {/* 1. Logo, Judul, dan Quote (Sisi Kiri) */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/logo.png" // Pastikan ada di folder 'public/logo-rs.jpg'
            alt="Logo RS" 
            className="h-10 w-10 rounded-full"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <h1 className="text-lg font-bold text-blue-600">Resa Tryout</h1>
            <p className="hidden text-xs text-gray-500 sm:block">
              Belajar cerdas, raih impian.
            </p>
          </div>
        </Link>
        
        {/* 2. Menu Desktop (Tengah & Kanan - Tersembunyi di Mobile) */}
        <div className="hidden items-center gap-6 md:flex">
          {!loading && (
            user ? (
              // --- Tampilan Jika Sudah Login (Desktop) ---
              <>
                <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </NavLink>
                <NavLink to="/history" className={({isActive}) => `flex items-center gap-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                  <History className="h-4 w-4" /> Riwayat
                </NavLink>
                <NavLink to="/peringkat" className={({isActive}) => `flex items-center gap-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                  <BarChart3 className="h-4 w-4" /> Peringkat
                </NavLink>
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={({isActive}) => `flex items-center gap-2 text-sm font-medium ${isActive ? 'text-red-600' : 'text-red-500 hover:text-red-700'}`}>
                    <UserCog className="h-4 w-4" /> Admin Panel
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              // --- Tampilan Jika Belum Login (Desktop) ---
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Daftar
                </Link>
              </>
            )
          )}
        </div>

        {/* 3. Tombol Menu Burger (Hanya Tampil di Mobile) */}
        <div className="flex items-center md:hidden">
          {!loading && user && ( // Hanya tampilkan jika user login di mobile
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-md p-2 text-gray-800 transition-colors hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <CustomBurgerIcon isOpen={isMobileMenuOpen} />
            </button>
          )}
          {!loading && !user && ( // Tampilkan Login/Daftar jika user tamu di mobile
             <>
                <Link to="/login" className="mr-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Daftar
                </Link>
              </>
          )}
        </div>
      </nav>

      {/* 4. Menu Dropdown Mobile (Animasi) */}
      <AnimatePresence>
        {isMobileMenuOpen && user && (
          <motion.div
            // Animasi Framer Motion
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            // Tampilan
            className="overflow-hidden border-t border-gray-200 md:hidden"
          >
            {/* --- Tampilan Jika Sudah Login (Mobile) --- */}
            <div className="flex flex-col space-y-1 p-4">
              <MobileNavLink to="/dashboard" icon={LayoutDashboard} text="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/history" icon={History} text="Riwayat" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/peringkat" icon={BarChart3} text="Peringkat" onClick={() => setIsMobileMenuOpen(false)} />
              {user.role === 'admin' && (
                <MobileNavLink to="/admin" icon={UserCog} text="Admin Panel" onClick={() => setIsMobileMenuOpen(false)} isAdmin={true} />
              )}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
  }
