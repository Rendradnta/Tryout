import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Impor Ikon Profesional (Lucide) ---
import {
  LayoutDashboard,
  History,
  BarChart3, // (Ikon Peringkat)
  UserCog,     // (Ikon Admin)
  LogOut,
  LogIn,
  UserPlus,
  LayoutGrid // <-- Ikon 9-Grid (sesuai gambar Anda)
} from 'lucide-react';

// --- Komponen Link untuk Mobile ---
const MobileNavLink = ({ to, icon, text, onClick, isAdmin = false }) => {
  const NavIcon = icon;
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-colors
         ${isActive
           ? (isAdmin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')
           : 'text-gray-700 hover:bg-gray-100'
         }`
      }
    >
      <NavIcon className={`h-6 w-6 ${isAdmin ? 'text-red-700' : ''}`} />
      {text}
    </NavLink>
  );
};

export default function Navbar() {
  // --- State & Hook (TETAP SAMA) ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- Logika useEffect untuk Cek Sesi (TETAP SAMA) ---
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
    setIsMobileMenuOpen(false);
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    navigate('/login');
  };
  
  // --- Tampilan JSX (MODERN & SESUAI DESAIN GAMBAR) ---
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Container Utama dengan Background Gradien Diagonal
        Ini menggunakan Tailwind Arbitrary Values untuk meniru 100% gambar Anda.
      */}
      <div 
        className="w-full text-white p-4 shadow-lg
                   bg-[hsl(207,88%,46%)] 
                   bg-[linear-gradient(110deg,_hsl(207,88%,28%)_45%,_hsl(207,88%,46%)_45%,_hsl(207,88%,46%)_65%,_hsl(207,88%,65%)_65%)]
                   overflow-hidden"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          
          {/* 1. Logo, Judul, dan Subjudul (Sisi Kiri) */}
          <Link to="/" className="flex items-center gap-3 z-10">
            <img 
              src="/logo-rs.jpg" // Pastikan ada di folder 'public/logo-rs.jpg'
              alt="Logo RS" 
              className="h-10 w-10 rounded-full border-2 border-white/50"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-xl font-bold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
                Resa Tryout
              </h1>
              <p className="text-xs text-blue-100 font-light">
                Aplikasi SNBT
              </p>
            </div>
          </Link>
          
          {/* 2. Menu Desktop (Tengah & Kanan - Tersembunyi di Mobile) */}
          <div className="hidden items-center gap-6 md:flex z-10">
            {!loading && (
              user ? (
                // --- Tampilan Jika Sudah Login (Desktop) ---
                <>
                  <NavLink to="/dashboard" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-white border-b-2' : 'text-blue-100 hover:text-white'}`}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/history" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-white border-b-2' : 'text-blue-100 hover:text-white'}`}>
                    Riwayat
                  </NavLink>
                  <NavLink to="/peringkat" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-white border-b-2' : 'text-blue-100 hover:text-white'}`}>
                    Peringkat
                  </NavLink>
                  {user.role === 'admin' && (
                    <NavLink to="/admin" className={({isActive}) => `rounded-md bg-white/20 px-3 py-1 text-sm font-medium ${isActive ? 'text-white ring-2 ring-white' : 'text-yellow-200 hover:bg-white/30'}`}>
                      Admin Panel
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                // --- Tampilan Jika Belum Login (Desktop) ---
                <>
                  <Link to="/login" className="text-sm font-medium text-blue-100 hover:text-white">
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-gray-100"
                  >
                    Daftar
                  </Link>
                </>
              )
            )}
          </div>

          {/* 3. Tombol Menu Burger (Hanya Tampil di Mobile) */}
          <div className="flex items-center md:hidden z-10">
            {!loading && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-md p-2 text-white transition-transform duration-300 ease-out hover:bg-white/20 active:scale-90"
                aria-label="Toggle menu"
              >
                {/* Ikon 9-grid (LayoutGrid) dari Lucide (SESUAI GAMBAR) */}
                <motion.div
                   animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                   transition={{ duration: 0.3 }}
                >
                  <LayoutGrid className="h-6 w-6" />
                </motion.div>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* 4. Menu Dropdown Mobile (Animasi) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            // Animasi Framer Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            // Tampilan
            className="absolute z-40 w-full overflow-hidden border-b border-gray-200 bg-white shadow-lg md:hidden"
          >
            {/* Tampilkan menu berdasarkan status login */}
            {!loading && (
              user ? (
                // --- Tampilan Jika Sudah Login (Mobile) ---
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
                    className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-6 w-6" /> Logout
                  </button>
                </div>
              ) : (
                // --- Tampilan Jika Belum Login (Mobile) ---
                <div className="flex flex-col space-y-2 p-4">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogIn className="h-5 w-5" /> Login
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700"
                  >
                    <UserPlus className="h-5 w-5" /> Daftar
                  </Link>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
  }
