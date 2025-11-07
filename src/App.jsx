import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Komponen Halaman (Akan kita buat nanti) ---
// Autentikasi
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';

// User Biasa
import Dashboard from './pages/Dashboard.jsx';
import KonfirmasiTest from './pages/KonfirmasiTest.jsx';
import TestPage from './pages/TestPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import PeringkatPage from './pages/PeringkatPage.jsx';
import PembahasanPage from './pages/PembahasanPage.jsx';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
// (Kita akan buat halaman admin lain nanti di dalam routing AdminDashboard)

// --- Komponen Pembantu (Akan kita buat nanti) ---
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/shared/Navbar.jsx'; // Navbar akan tampil di semua halaman

function App() {
  return (
    <>
      {/* 1. Navbar akan tampil di atas SEMUA halaman */}
      <Navbar />
      
      {/* 2. Ini adalah area di mana halaman akan berganti-ganti */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <Routes>
          {/* --- Rute Publik (Bisa diakses semua orang) --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* --- Rute User (Hanya bisa diakses setelah login) --- */}
          {/* Kita akan bungkus ini dengan pelindung login nanti */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/peringkat" element={<PeringkatPage />} />
          <Route path="/konfirmasi/:paketId" element={<KonfirmasiTest />} />
          <Route path="/kerjakan/:paketId" element={<TestPage />} />
          <Route path="/pembahasan/:historyId" element={<PembahasanPage />} />

          {/* --- Rute Admin (Hanya bisa diakses oleh admin) --- */}
          <Route 
            path="/admin/*" // Tanda * berarti semua URL yg diawali /admin
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
