import React from 'react';

/**
 * Komponen untuk menampilkan grid navigasi soal.
 * @param {Array} soals - Array semua objek soal (untuk di-map).
 * @param {Object} jawabanUser - Objek jawaban user (untuk cek 'isAnswered').
 * @param {number} soalAktifIndex - Index soal yang sedang aktif (untuk highlight).
 * @param {function} onNavClick - Fungsi yg dipanggil saat nomor diklik (mengirim index).
 * @param {Object} range - Objek { start, end } (untuk mengunci subtes UTBK).
 */
export default function NavigasiSoal({ 
  soals, 
  jawabanUser, 
  soalAktifIndex, 
  onNavClick, 
  range 
}) {
  
  return (
    <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
      {soals.map((soal, index) => {
        
        // 1. Tentukan status setiap tombol
        const isAktif = index === soalAktifIndex;
        const isDijawab = jawabanUser[soal.id] !== undefined;
        const isTerkunci = index < range.start || index > range.end;

        // 2. Tentukan style tombol berdasarkan status (logika Tailwind)
        let className = "w-10 h-10 flex items-center justify-center border rounded-md font-medium text-sm transition-colors ";

        if (isTerkunci) {
          className += "bg-gray-200 text-gray-400 cursor-not-allowed";
        } else if (isAktif) {
          className += "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300";
        } else if (isDijawab) {
          className += "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
        } else {
          // Default (belum dijawab, tidak aktif)
          className += "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
        }

        return (
          <button
            key={soal.id}
            onClick={() => onNavClick(index)} // 3. Panggil fungsi dengan index
            disabled={isTerkunci}
            className={className}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
