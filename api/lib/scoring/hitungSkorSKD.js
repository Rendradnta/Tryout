/**
 * Fungsi ini menghitung skor SKD berdasarkan jawaban user dan kunci.
 * @param {Object} jawabanUser - Objek jawaban dari user, misal: { "soal-id-1": "A", "soal-id-2": "C", ... }
 * @param {Array} kunciJawabanPaket - Array berisi objek kunci dari database
 * Contoh 1 (TWK/TIU): { id: "soal-id-1", subtes_id: "twk", kunci_jawaban: { "kunci": "A" } }
 * Contoh 2 (TKP): { id: "soal-id-2", subtes_id: "tkp", kunci_jawaban: { "A": 5, "B": 4, "C": 3, "D": 2, "E": 1 } }
 * @param {Object} passingGrade - Objek passing grade, misal: { twk: 65, tiu: 80, tkp: 156 }
 * @returns {Object} - Objek hasil skor
 */
export async function hitungSkorSKD(jawabanUser, kunciJawabanPaket, passingGrade) {
  let skorTWK = 0;
  let skorTIU = 0;
  let skorTKP = 0;

  // Loop melalui setiap soal di paket tersebut
  for (const kunciSoal of kunciJawabanPaket) {
    const idSoal = kunciSoal.id;
    
    // --- PERBAIKAN DI SINI ---
    // LAMA: const subtes = kunciSoal.subtes;
    // BARU: const subtes = kunciSoal.subtes_id;
    // (Nama kolom 'subtes_id' Anda diasumsikan berisi 'twk', 'tiu', atau 'tkp')
    const subtes = kunciSoal.subtes_id; 

    const jawaban = jawabanUser[idSoal]; // Jawaban user untuk soal ini

    // Jika user tidak menjawab, skor 0
    if (!jawaban) {
      continue;
    }

    if (subtes === 'twk' || subtes === 'tiu') {
      // PENILAIAN TWK & TIU (Benar = 5, Salah = 0)
      const kunciBenar = kunciSoal.kunci_jawaban.kunci;
      if (jawaban === kunciBenar) {
        if (subtes === 'twk') skorTWK += 5;
        if (subtes === 'tiu') skorTIU += 5;
      }
    } else if (subtes === 'tkp') {
      // PENILAIAN TKP (Skor 1-5)
      const skorOpsi = kunciSoal.kunci_jawaban[jawaban];
      if (skorOpsi) {
        skorTKP += skorOpsi;
      }
    }
  }

  // Hitung total dan cek status lulus
  const skorTotal = skorTWK + skorTIU + skorTKP;
  
  let statusLulus = null;
  if (passingGrade) {
     statusLulus = (
        skorTWK >= passingGrade.twk &&
        skorTIU >= passingGrade.tiu &&
        skorTKP >= passingGrade.tkp
     );
  }

  // Kembalikan objek hasil skor
  return {
    skor_total: skorTotal,
    status_lulus: statusLulus, // true, false, atau null
    rincian_skor: {
      twk: skorTWK,
      tiu: skorTIU,
      tkp: skorTKP
    }
  };
}
