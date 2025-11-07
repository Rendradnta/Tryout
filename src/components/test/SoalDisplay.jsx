import React from 'react';

// Tampilan untuk Pilihan Ganda Biasa (PG) atau Isian Singkat
const PilihanGandaBiasa = ({ soal, jawaban, onSelect }) => {
  return (
    <div className="space-y-3">
      {soal.opsi_jawaban.map((opsi) => {
        const isSelected = jawaban === opsi.id;
        return (
          <label
            key={opsi.id}
            className={`block w-full p-4 border rounded-lg cursor-pointer transition-colors
              ${isSelected 
                ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
          >
            <input
              type="radio"
              name={soal.id}
              value={opsi.id}
              checked={isSelected}
              onChange={() => onSelect(soal.id, opsi.id)}
              className="sr-only" // Sembunyikan radio button asli
            />
            <div className="flex items-center">
              <span className={`font-bold mr-3 ${isSelected ? 'text-blue-700' : ''}`}>
                {opsi.id}.
              </span>
              {/* Gunakan dangerouslySetInnerHTML jika opsi berisi HTML/MathJax */}
              <span dangerouslySetInnerHTML={{ __html: opsi.teks }} />
            </div>
          </label>
        );
      })}
    </div>
  );
};

// Tampilan untuk Pilihan Ganda Kompleks (PGK) - Kotak Centang
const PilihanGandaKompleks = ({ soal, jawaban, onSelect }) => {
  // Jawaban untuk PGK adalah array, misal: ["1", "3"]
  const currentSelection = jawaban || [];

  const handleChange = (opsiId) => {
    let newSelection;
    if (currentSelection.includes(opsiId)) {
      // Jika sudah ada, hapus dari array
      newSelection = currentSelection.filter(id => id !== opsiId);
    } else {
      // Jika belum ada, tambahkan ke array
      newSelection = [...currentSelection, opsiId];
    }
    onSelect(soal.id, newSelection);
  };

  return (
    <div className="space-y-3">
      {soal.opsi_jawaban.map((opsi) => {
        const isSelected = currentSelection.includes(opsi.id);
        return (
          <label
            key={opsi.id}
            className={`block w-full p-4 border rounded-lg cursor-pointer transition-colors
              ${isSelected 
                ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
          >
            <input
              type="checkbox"
              name={soal.id}
              value={opsi.id}
              checked={isSelected}
              onChange={() => handleChange(opsi.id)}
              className="mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded"
            />
            {/* Gunakan dangerouslySetInnerHTML jika opsi berisi HTML/MathJax */}
            <span dangerouslySetInnerHTML={{ __html: opsi.teks }} />
          </label>
        );
      })}
    </div>
  );
};

// Tampilan untuk Soal Tabel (Benar/Salah)
const PilihanGandaTabel = ({ soal, jawaban, onSelect }) => {
  // Jawaban untuk Tabel adalah objek, misal: { "pernyataan_1": "benar", ... }
  const currentSelection = jawaban || {};

  const handleChange = (pernyataanId, nilai) => {
    const newSelection = {
      ...currentSelection,
      [pernyataanId]: nilai
    };
    onSelect(soal.id, newSelection);
  };

  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-3 text-left">Pernyataan</th>
          <th className="border border-gray-300 p-3 w-24 text-center">Benar</th>
          <th className="border border-gray-300 p-3 w-24 text-center">Salah</th>
        </tr>
      </thead>
      <tbody>
        {soal.opsi_jawaban.map((pernyataan) => (
          <tr key={pernyataan.id} className="even:bg-white odd:bg-gray-50">
            <td className="border border-gray-300 p-3" dangerouslySetInnerHTML={{ __html: pernyataan.teks }} />
            <td className="border border-gray-300 p-3 text-center">
              <input
                type="radio"
                name={`tabel-${soal.id}-${pernyataan.id}`}
                checked={currentSelection[pernyataan.id] === 'benar'}
                onChange={() => handleChange(pernyataan.id, 'benar')}
                className="h-5 w-5 text-blue-600"
              />
            </td>
            <td className="border border-gray-300 p-3 text-center">
              <input
                type="radio"
                name={`tabel-${soal.id}-${pernyataan.id}`}
                checked={currentSelection[pernyataan.id] === 'salah'}
                onChange={() => handleChange(pernyataan.id, 'salah')}
                className="h-5 w-5 text-blue-600"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// --- Komponen Utama (SoalDisplay) ---
export default function SoalDisplay({ soal, jawaban, onSelectJawaban }) {
  if (!soal) {
    return <div className="text-center text-gray-500">Soal tidak ditemukan.</div>;
  }

  // Fungsi render dinamis berdasarkan tipe soal
  const renderTipeSoal = () => {
    switch (soal.tipe_soal) {
      case 'pg':
        return <PilihanGandaBiasa soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'pgk':
        return <PilihanGandaKompleks soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'tabel':
        return <PilihanGandaTabel soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'isian':
        // TODO: Buat tampilan untuk soal isian singkat
        // Untuk saat ini, kita samakan dengan PG
        return <PilihanGandaBiasa soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      default:
        return <p className="text-red-500">Tipe soal tidak dikenal: {soal.tipe_soal}</p>;
    }
  };

  return (
    <article className="space-y-6">
      {/* 1. Tampilkan Narasi (jika ada) */}
      {soal.narasi_soal && (
        <div 
          className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          dangerouslySetInnerHTML={{ __html: soal.narasi_soal }} 
        />
      )}
      
      {/* 2. Tampilkan Teks Soal (Pertanyaan) */}
      <div 
        className="text-base text-gray-900 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: soal.teks_soal }} 
      />
      
      {/* 3. Tampilkan Pilihan Jawaban (Dinamis) */}
      <div className="mt-6">
        {renderTipeSoal()}
      </div>
    </article>
  );
}
