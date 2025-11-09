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
    
    // --- PERBAIKAN 1 (NAMA SUBTES) ---
    // Tambahkan .toLowerCase() untuk memastikan perbandingan aman
    const subtes = (kunciSoal.subtes_id || '').toLowerCase(); 

    const jawaban = jawabanUser[idSoal]; 

    if (!jawaban) {
      continue;
    }

    // Pastikan kunci_jawaban ada sebelum diakses
    const kunci = kunciSoal.kunci_jawaban;
    if (!kunci) {
      console.error(`Kunci jawaban null untuk soal ${idSoal}`);
      continue;
    }

    if (subtes === 'twk' || subtes === 'tiu') {
      const kunciBenar = kunci.kunci;
      
      // --- PERBAIKAN 2 (JAWABAN) ---
      // Pastikan keduanya .toLowerCase()
      if (jawaban && kunciBenar && jawaban.toLowerCase() === kunciBenar.toLowerCase()) {
        if (subtes === 'twk') skorTWK += 5;
        if (subtes === 'tiu') skorTIU += 5;
      }
    } else if (subtes === 'tkp') {
      // (Logika TKP sudah aman, karena 'jawaban' adalah key, bukan value)
      const skorOpsi = kunci[jawaban];
      if (skorOpsi) {
        skorTKP += skorOpsi;
      }
    }
  }

  // ... (Sisa fungsi tetap sama) ...
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
