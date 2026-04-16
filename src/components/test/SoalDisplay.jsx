import React from 'react';

// Tampilan untuk Pilihan Ganda Biasa (PG) atau Isian Singkat
const PilihanGandaBiasa = ({ soal, jawaban, onSelect }) => {
  return (
    <div className="space-y-3">
      {(soal.opsi_jawaban || []).map((opsi) => {
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
              className="sr-only" 
            />
            <div className="flex items-start"> {/* Ubah items-center jadi items-start agar huruf rapi jika teks panjang */}
              <span className={`font-bold mr-3 mt-0.5 ${isSelected ? 'text-blue-700' : ''}`}>
                {opsi.id}.
              </span>
              {/* Tambahkan whitespace-pre-wrap di sini */}
              <span className="prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: opsi.teks }} />
            </div>
          </label>
        );
      })}
    </div>
  );
};

// Tampilan untuk Pilihan Ganda Kompleks (PGK) - Kotak Centang
const PilihanGandaKompleks = ({ soal, jawaban, onSelect }) => {
  const currentSelection = jawaban || [];

  const handleChange = (opsiId) => {
    let newSelection;
    if (currentSelection.includes(opsiId)) {
      newSelection = currentSelection.filter(id => id !== opsiId);
    } else {
      newSelection = [...currentSelection, opsiId];
    }
    onSelect(soal.id, newSelection);
  };

  return (
    <div className="space-y-3">
      {(soal.opsi_jawaban || []).map((opsi) => {
        const isSelected = currentSelection.includes(opsi.id);
        return (
          <label
            key={opsi.id}
            className={`flex items-start w-full p-4 border rounded-lg cursor-pointer transition-colors
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
              className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-blue-600 border-gray-300 rounded"
            />
            {/* Tambahkan whitespace-pre-wrap di sini */}
            <span className="prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: opsi.teks }} />
          </label>
        );
      })}
    </div>
  );
};

// Tampilan untuk Soal Tabel (Benar/Salah)
const PilihanGandaTabel = ({ soal, jawaban, onSelect }) => {
  const currentSelection = jawaban || {};

  const handleChange = (pernyataanId, nilai) => {
    const newSelection = {
      ...currentSelection,
      [pernyataanId]: nilai
    };
    onSelect(soal.id, newSelection);
  };

  return (
    <div className="overflow-x-auto"> {/* Tambahan agar tabel tidak merusak layout di HP */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-3 text-left">Pernyataan</th>
            <th className="border border-gray-300 p-3 w-24 text-center">Benar</th>
            <th className="border border-gray-300 p-3 w-24 text-center">Salah</th>
          </tr>
        </thead>
        <tbody>
          {(soal.opsi_jawaban || []).map((pernyataan) => (
            <tr key={pernyataan.id} className="even:bg-white odd:bg-gray-50">
              {/* Tambahkan whitespace-pre-wrap di sini */}
              <td className="border border-gray-300 p-3 prose-sm max-w-xs whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: pernyataan.teks }} />
              <td className="border border-gray-300 p-3 text-center align-middle">
                <input
                  type="radio"
                  name={`tabel-${soal.id}-${pernyataan.id}`}
                  checked={currentSelection[pernyataan.id] === 'benar'}
                  onChange={() => handleChange(pernyataan.id, 'benar')}
                  className="h-5 w-5 text-blue-600"
                />
              </td>
              <td className="border border-gray-300 p-3 text-center align-middle">
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
    </div>
  );
};

// --- Komponen Utama (SoalDisplay) ---
export default function SoalDisplay({ soal, jawaban, onSelectJawaban }) {
  if (!soal) {
    return <div className="text-center text-gray-500">Soal tidak ditemukan.</div>;
  }

  // Fungsi pintar untuk mendeteksi apakah teks dari DB menggunakan HTML atau tidak
  const isHTML = (str) => {
    if (!str) return false;
    // Deteksi jika ada tag seperti <p>, <strong>, <ol>, dll. 
    // Aman untuk soal matematika seperti "x < 5" karena mendeteksi huruf setelah "<".
    return /<\/?[a-z][\s\S]*>/i.test(str);
  };

  const narasiHasHTML = isHTML(soal.narasi_soal);
  const teksHasHTML = isHTML(soal.teks_soal);

  const renderTipeSoal = () => {
    switch (soal.tipe_soal) {
      case 'pg':
        return <PilihanGandaBiasa soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'pgk':
        return <PilihanGandaKompleks soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'tabel':
        return <PilihanGandaTabel soal={soal} jawaban={jawaban} onSelect={onSelectJawaban} />;
      case 'isian':
        return <p className="text-gray-700">Tipe soal "isian" belum didukung.</p>;
      default:
        return <p className="text-red-500">Tipe soal tidak dikenal: {soal.tipe_soal}</p>;
    }
  };

  return (
    <article className="space-y-6">
      {/* 1. Tampilkan Narasi (jika ada) */}
      {soal.narasi_soal && (
        <div 
          className={`prose max-w-none p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm 
          [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-3
          ${narasiHasHTML 
            ? 'prose-p:my-2 prose-ol:my-2 prose-ul:my-2 prose-li:my-0' // Jika HTML, rapihkan margin list-nya
            : 'whitespace-pre-wrap' // Jika teks biasa, paksa baca karakter Enter
          }`}
          dangerouslySetInnerHTML={{ __html: soal.narasi_soal }} 
        />
      )}
      
      {/* 2. Tampilkan Teks Soal (Pertanyaan) */}
      <div 
        className={`prose max-w-none text-base text-gray-900 leading-relaxed 
        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:my-4
        ${teksHasHTML 
          ? 'prose-p:my-2 prose-ol:my-2 prose-ul:my-2 prose-li:my-0' 
          : 'whitespace-pre-wrap'
        }`}
        dangerouslySetInnerHTML={{ __html: soal.teks_soal }} 
      />
      
      {/* 3. Tampilkan Pilihan Jawaban (Dinamis) */}
      <div className="mt-6">
        {renderTipeSoal()}
      </div>
    </article>
  );
}
