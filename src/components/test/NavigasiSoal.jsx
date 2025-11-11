import React from 'react';
import { motion } from 'framer-motion';

/**
 * Komponen untuk menampilkan grid navigasi soal.
 * Props baru: 'raguRagu'
 */
export default function NavigasiSoal({ 
  soals, 
  jawabanUser, 
  raguRagu, // <-- STATE BARU
  soalAktifIndex, 
  onNavClick, 
  range 
}) {
  
  return (
    <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
      {soals.map((soal, index) => {
        
        // --- LOGIKA 3 WARNA BARU ---
        const isAktif = index === soalAktifIndex;
        const isDijawab = jawabanUser[soal.id] !== undefined;
        const isRagu = raguRagu[soal.id] === true;
        const isTerkunci = index < range.start || index > range.end;

        let className = "w-10 h-10 flex items-center justify-center border rounded-md font-medium text-sm transition-all duration-200 transform ";

        if (isTerkunci) {
          className += "bg-gray-200 text-gray-400 cursor-not-allowed";
        } else if (isAktif) {
          // Aktif (Biru Tua, menonjol)
          className += "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 scale-110 shadow-lg";
        } else if (isRagu) {
          // Ragu-ragu (Kuning)
          className += "bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500";
        } else if (isDijawab) {
          // Sudah dikerjakan (Biru Muda)
          className += "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
        } else {
          // Belum dikerjakan (Putih)
          className += "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
        }

        return (
          <motion.button
            key={soal.id}
            onClick={() => onNavClick(index)}
            disabled={isTerkunci}
            className={className}
            whileHover={{ scale: isTerkunci || isAktif ? 1 : 1.1 }}
            whileTap={{ scale: isTerkunci ? 1 : 0.95 }}
          >
            {index + 1}
          </motion.button>
        );
      })}
    </div>
  );
}