/**
 * Fungsi ini menghitung skor SKD berdasarkan jawaban user dan kunci.
 * ... (deskripsi tetap sama) ...
 */
export async function hitungSkorSKD(jawabanUser, kunciJawabanPaket, passingGrade) {
  let skorTWK = 0;
  let skorTIU = 0;
  let skorTKP = 0;

  for (const kunciSoal of kunciJawabanPaket) {
    const idSoal = kunciSoal.id;
    const subtes = kunciSoal.subtes_id; 
    const jawaban = jawabanUser[idSoal]; 

    if (!jawaban) {
      continue;
    }

    if (subtes === 'twk' || subtes === 'tiu') {
      const kunciBenar = kunciSoal.kunci_jawaban.kunci;
      
      // --- PERBAIKAN DI SINI ---
      // Kita ubah keduanya jadi huruf kecil sebelum membandingkan
      if (jawaban.toLowerCase() === kunciBenar.toLowerCase()) {
        if (subtes === 'twk') skorTWK += 5;
        if (subtes === 'tiu') skorTIU += 5;
      }
    } else if (subtes === 'tkp') {
      // (Logika TKP sudah benar, tidak perlu diubah)
      const skorOpsi = kunciSoal.kunci_jawaban[jawaban];
      if (skorOpsi) {
        skorTKP += skorOpsi;
      }
    }
  }

  // ... (sisa fungsi tetap sama) ...
  const skorTotal = skorTWK + skorTIU + skorTKP;
  let statusLulus = null;
  if (passingGrade) {
     statusLulus = (
        skorTWK >= passingGrade.twk &&
        skorTIU >= passingGrade.tiu &&
        skorTKP >= passingGrade.tkp
     );
  }
  return {
    skor_total: skorTotal,
    status_lulus: statusLulus,
    rincian_skor: {
      twk: skorTWK,
      tiu: skorTIU,
      tkp: skorTKP
    }
  };
}
