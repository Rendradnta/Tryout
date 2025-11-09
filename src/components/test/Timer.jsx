import React, { useState, useEffect, useRef } from 'react';

/**
 * Format detik menjadi "MM:SS" (Menit:Detik)
 */
function formatWaktu(totalDetik) {
  const menit = Math.floor(totalDetik / 60);
  const detik = totalDetik % 60;
  return `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
}

/**
 * Komponen Timer Hitung Mundur
 * @param {number} durationInSeconds - Total durasi dalam detik
 * @param {function} onTimeUp - Fungsi yang dipanggil saat waktu habis (00:00)
 */
export default function Timer({ durationInSeconds, onTimeUp }) {
  const [sisaDetik, setSisaDetik] = useState(durationInSeconds);
  
  // --- PERBAIKAN DI SINI (Menggunakan useRef) ---
  // 1. Kita simpan fungsi onTimeUp di dalam 'ref'
  // Ini adalah "kotak" yang bisa diubah tanpa memicu re-render
  const onTimeUpRef = useRef(onTimeUp);

  // 2. Setiap kali 'onTimeUp' (prop) berubah, kita update 'kotak' (ref) kita
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);
  // --- AKHIR PERBAIKAN 1 ---


  // 3. useEffect untuk menjalankan interval timer
  useEffect(() => {
    // Set sisa waktu awal saat durasi berubah
    setSisaDetik(durationInSeconds);

    const timerInterval = setInterval(() => {
      setSisaDetik((prevDetik) => {
        if (prevDetik <= 1) {
          clearInterval(timerInterval); 
          // 4. Panggil fungsi onTimeUp dari 'ref' (kotak)
          // Ini menjamin kita selalu memanggil versi TERBARU
          // dari 'handleTimeUp' di TestPage
          if (onTimeUpRef.current) {
            onTimeUpRef.current(); 
          }
          return 0;
        }
        return prevDetik - 1;
      });
    }, 1000); 

    // 5. Fungsi cleanup
    return () => {
      clearInterval(timerInterval);
    };
  
  // --- PERBAIKAN 3 DI SINI ---
  // 6. Kita HAPUS 'onTimeUp' dari dependency array.
  // Timer sekarang HANYA akan me-reset jika 'durationInSeconds' berubah
  // (yaitu saat pindah subtes atau saat refresh halaman)
  }, [durationInSeconds]); 
  // --- AKHIR PERBAIKAN 3 ---

  const warnaTeks = sisaDetik <= 300 ? 'text-red-600' : 'text-gray-900'; 

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
