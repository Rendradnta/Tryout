    /**
 * Fungsi ini menghitung skor mentah UTBK berdasarkan jawaban user dan kunci.
 * Skor: Benar +1, Salah 0, Kosong 0.
 * @param {Object} jawabanUser - Objek jawaban dari user, misal: { "soal-id-1": "A", "soal-id-2": ["1", "3"], ... }
 * @param {Array} kunciJawabanPaket - Array berisi objek kunci dari database
 * Contoh 1 (PG): { id: "soal-1", subtes_id: "pu", tipe_soal: "pg", kunci_jawaban: { "kunci": "A" } }
 * Contoh 2 (PGK): { id: "soal-2", subtes_id: "pu", tipe_soal: "pgk", kunci_jawaban: { "kunci": ["1", "3"] } }
 * @returns {Object} - Objek hasil skor
 */
export async function hitungSkorUTBK(jawabanUser, kunciJawabanPaket) {
  const rincianSkor = {}; // Objek untuk menyimpan skor per subtes, misal: { pu: 10, pmu: 5, ... }

  // Loop melalui setiap soal di paket tersebut
  for (const kunciSoal of kunciJawabanPaket) {
    const idSoal = kunciSoal.id;

    // --- PERBAIKAN DI SINI ---
    // LAMA: const subtes = kunciSoal.subtes;
    // BARU: const subtes = kunciSoal.subtes_id;
    // (Nama kolom 'subtes_id' Anda diasumsikan berisi 'pu', 'pmu', dll)
    const subtes = kunciSoal.subtes_id;

    const tipeSoal = kunciSoal.tipe_soal;
    const jawaban = jawabanUser[idSoal]; // Jawaban user untuk soal ini

    // Inisialisasi skor subtes jika belum ada
    if (!rincianSkor[subtes]) {
      rincianSkor[subtes] = { benar: 0, salah: 0, kosong: 0, total: 0 };
    }

    // Jika user tidak menjawab (jawaban undefined, null, atau array kosong)
    if (!jawaban || (Array.isArray(jawaban) && jawaban.length === 0)) {
      rincianSkor[subtes].kosong += 1;
      continue; // Lanjut ke soal berikutnya
    }

    let isBenar = false;
    const kunci = kunciSoal.kunci_jawaban;

    try {
      // Logika pengecekan berdasarkan tipe soal
      if (tipeSoal === 'pg' || tipeSoal === 'isian') {
        // Pilihan Ganda Biasa atau Isian Singkat
        isBenar = (jawaban.toLowerCase() === kunci.kunci.toLowerCase());
      
      } else if (tipeSoal === 'pgk') {
        // Pilihan Ganda Kompleks (Jawaban adalah array)
        isBenar = arraysEqual((jawaban || []).sort(), (kunci.kunci || []).sort());
      
      } else if (tipeSoal === 'tabel') {
        // Tabel Benar/Salah (Jawaban adalah objek)
        isBenar = objectsEqual(jawaban, kunci);
      }
    } catch (e) {
      console.error(`Error saat mengecek soal ${idSoal}: ${e.message}`);
      isBenar = false;
    }

    // Update skor
    if (isBenar) {
      rincianSkor[subtes].benar += 1;
      rincianSkor[subtes].total += 1; // Skor +1
    } else {
      rincianSkor[subtes].salah += 1;
      // Skor 0 (tidak ada minus)
    }
  }

  // Hitung total skor dari semua subtes
  const skorTotal = Object.values(rincianSkor).reduce((acc, sub) => acc + sub.total, 0);

  return {
    skor_total: skorTotal,
    rincian_skor: rincianSkor // Mengembalikan rincian per subtes
  };
}


// --- Fungsi Helper ---

// Fungsi untuk membandingkan dua array (untuk PGK)
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Fungsi untuk membandingkan dua objek (untuk Tabel)
function objectsEqual(a, b) {
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
        }
