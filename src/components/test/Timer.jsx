import React, { useState, useEffect } from 'react';

/**
 * Format detik menjadi "MM:SS" (Menit:Detik)
 */
function formatWaktu(totalDetik) {
  const menit = Math.floor(totalDetik / 60);
  const detik = totalDetik % 60;
  // Tambahkan '0' di depan jika angkanya < 10
  return `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
}

/**
 * Komponen Timer Hitung Mundur
 * @param {number} durationInSeconds - Total durasi dalam detik (misal: 30 menit * 60)
 * @param {function} onTimeUp - Fungsi yang dipanggil saat waktu habis (00:00)
 */
export default function Timer({ durationInSeconds, onTimeUp }) {
  // 1. State untuk menyimpan sisa waktu
  const [sisaDetik, setSisaDetik] = useState(durationInSeconds);

  // 2. useEffect untuk menjalankan interval timer
  useEffect(() => {
    // Set sisa waktu awal saat komponen dimuat (atau durasi berubah)
    setSisaDetik(durationInSeconds);

    // 3. Buat interval yang berjalan setiap 1 detik
    const timerInterval = setInterval(() => {
      setSisaDetik((prevDetik) => {
        // Jika sisa 1 detik, ini adalah detik terakhir
        if (prevDetik <= 1) {
          clearInterval(timerInterval); // Hentikan timer
          onTimeUp(); // Panggil fungsi (beri tahu TestPage waktu habis)
          return 0;
        }
        // Kurangi 1 detik
        return prevDetik - 1;
      });
    }, 1000); // 1000ms = 1 detik

    // 4. Fungsi cleanup
    // Ini akan berjalan saat komponen 'unmount' (dihancurkan)
    // (misal: pindah subtes di UTBK, atau user submit)
    return () => {
      clearInterval(timerInterval);
    };
  }, [durationInSeconds, onTimeUp]); // 5. Reset timer jika durasi atau fungsi onTimeUp berubah

  // Tentukan warna timer
  const warnaTeks = sisaDetik <= 300 ? 'text-red-600' : 'text-gray-900'; // Merah jika sisa 5 menit

  return (
    <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md sticky top-4">
      <h3 className="text-sm font-medium text-gray-500 text-center uppercase">
        Sisa Waktu
      </h3>
      <p className={`text-4xl font-bold text-center ${warnaTeks} tabular-nums`}>
        {formatWaktu(sisaDetik)}
      </p>
    </div>
  );
}
