import React from 'react';
import { Routes, Route } from 'react-router-dom';

// ... (impor semua halaman Anda seperti sebelumnya)
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import KonfirmasiTest from './pages/KonfirmasiTest.jsx';
import TestPage from './pages/TestPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import PeringkatPage from './pages/PeringkatPage.jsx';
import PembahasanPage from './pages/PembahasanPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

// --- Komponen Pembantu ---
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/shared/Navbar.jsx';

function App() {
  return (
    <>
      <Navbar />
      
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <Routes>
          {/* --- Rute Publik (Bisa diakses semua orang) --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* --- RUTE USER (SEKARANG DILINDUNGI) --- */}
          {/* User biasa WAJIB login untuk akses ini */}
          <Route 
            path="/" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/history" 
            element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} 
          />
          <Route 
            path="/peringkat" 
            element={<ProtectedRoute><PeringkatPage /></ProtectedRoute>} 
          />
          <Route 
            path="/konfirmasi/:paketId" 
            element={<ProtectedRoute><KonfirmasiTest /></ProtectedRoute>} 
          />
          <Route 
            path="/kerjakan/:paketId" 
            element={<ProtectedRoute><TestPage /></ProtectedRoute>} 
          />
          <Route 
            path="/pembahasan/:historyId" 
            element={<ProtectedRoute><PembahasanPage /></ProtectedRoute>} 
          />

          {/* --- Rute Admin (Hanya bisa diakses oleh admin) --- */}
          <Route 
            path="/admin/*"
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
