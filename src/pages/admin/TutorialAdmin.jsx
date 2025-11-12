import React from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Copy, Image, Users, Package, FileText, Key, List, BookOpen } from 'lucide-react';

// Komponen internal untuk bagian (Section)
const Section = ({ title, icon, children }) => {
  const Icon = icon;
  return (
    <motion.section
      className="space-y-4 rounded-2xl bg-white p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <Icon className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
    </motion.section>
  );
};

// Komponen internal untuk blok kode JSON
const JsonTemplate = ({ title, jsonObject }) => (
  <div>
    <h4 className="font-semibold text-gray-800">{title}</h4>
    <pre className="mt-2 w-full overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300">
      <code>{JSON.stringify(jsonObject, null, 2)}</code>
    </pre>
  </div>
);

export default function TutorialAdmin() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Panduan Admin
      </h1>
      <p className="text-lg text-gray-600">
        Selamat datang! Halaman ini adalah panduan lengkap Anda untuk
        mengelola konten di Resa Tryout.
      </p>

      {/* --- ALUR KERJA --- */}
      <Section title="Alur Kerja Dasar" icon={FilePlus}>
        <p>Menambahkan tryout baru ke <i>website</i> memiliki 2 langkah utama:</p>
        <ol>
          <li>
            <strong>Buat Paket Soal:</strong> Pergi ke "Manajemen Paket", klik
            "+ Buat Paket Soal Baru", isi detailnya (judul, tipe), lalu "Simpan".
          </li>
          <li>
            <strong>Salin Paket ID:</strong> Setelah paket dibuat, salin "Paket
            ID" (UUID) dari kartu paket yang baru.
          </li>
          <li>
            <strong>Tambah Soal:</strong> Pergi ke "Manajemen Soal" (via link di
            kartu paket), klik "Tambah Soal", dan tempelkan "Paket ID" tadi ke
            <i>form</i> soal.
          </li>
          <li>
            <strong>Publikasikan:</strong> Kembali ke "Manajemen Paket" dan
            nyalakan <i>toggle</i> "Publish" untuk paket tersebut agar terlihat
            oleh <i>user</i>.
          </li>
        </ol>
      </Section>

      {/* --- MANAJEMEN PAKET --- */}
      <Section title="Manajemen Paket" icon={Package}>
        <p>
          Halaman "Manajemen Paket" adalah pusat kontrol Anda untuk semua
          tryout.
        </p>
        <ul>
          <li>
            <strong>Sembunyikan/Tampilkan:</strong> <i>Toggle</i> ini
            (<code>is_published</code>) menentukan apakah paket soal bisa
            dilihat oleh <i>user</i> di <i>dashboard</i> mereka.{" "}
            <strong>DEFAULT:</strong> false (Tersembunyi).
          </li>
          <li>
            <strong>Batas Pengerjaan:</strong> (<code>max_attempts</code>) Ini
            menentukan fitur "1x Coba".
            <ul>
              <li>
                <code>Tak Terbatas</code>: (Default) User bisa mengerjakan
                berkali-kali.
              </li>
              <li>
                <code>Hanya 1x Coba</code>: User hanya bisa mengerjakan 1 kali.
                Tombol akan non-aktif setelahnya.
              </li>
            </ul>
          </li>
          <li>
            <strong>Paket Premium:</strong> (<code>is_premium</code>) Centang
            ini jika paket ini adalah paket berbayar.
          </li>
        </ul>
      </Section>

      {/* --- TEMPLATE JSON SOAL --- */}
      <Section title="Template JSON Soal" icon={FileText}>
        <p>
          Ini adalah bagian terpenting. Kesalahan format JSON akan menyebabkan
          soal gagal disimpan. Gunakan ini sebagai referensi saat mengisi
          <i>form</i> "Tambah/Edit Soal".
        </p>

        <h3 className="text-lg font-bold">
          Opsi Jawaban (<List className="inline h-5 w-5" />)
        </h3>
        <JsonTemplate
          title="1. Pilihan Ganda (PG)"
          jsonObject={[
            { id: "A", teks: "Teks jawaban A" },
            { id: "B", teks: "Teks jawaban B" },
            { id: "C", teks: "Teks jawaban C" },
            { id: "D", teks: "Teks jawaban D" },
            { id: "E", teks: "Teks jawaban E" },
          ]}
        />
        <JsonTemplate
          title="2. Pilihan Ganda Kompleks (PGK)"
          jsonObject={[
            { id: "1", teks: "Teks pernyataan 1 (untuk dicentang)" },
            { id: "2", teks: "Teks pernyataan 2" },
            { id: "3", teks: "Teks pernyataan 3" },
          ]}
        />
        <JsonTemplate
          title="3. Tabel (Benar/Salah)"
          jsonObject={[
            { id: "p1", teks: "Pernyataan di baris 1" },
            { id: "p2", teks: "Pernyataan di baris 2" },
            { id: "p3", teks: "Pernyataan di baris 3" },
          ]}
        />

        <hr className="my-6" />
        <h3 className="text-lg font-bold">
          Kunci Jawaban (<Key className="inline h-5 w-5" />)
        </h3>

        <JsonTemplate
          title="1. Kunci PG (SKD: TWK/TIU atau UTBK)"
          jsonObject={{ kunci: "A" }}
        />
        <JsonTemplate
          title="2. Kunci TKP (SKD: TKP)"
          jsonObject={{ A: 5, B: 4, C: 3, D: 2, E: 1 }}
        />
        <JsonTemplate
          title="3. Kunci PGK (UTBK)"
          jsonObject={{ kunci: ["1", "3"] }}
        />
        <JsonTemplate
          title="4. Kunci Tabel (UTBK)"
          jsonObject={{ p1: "benar", p2: "salah", p3: "benar" }}
        />
        <JsonTemplate
          title="5. Kunci Isian Singkat (UTBK)"
          jsonObject={{ kunci: "12" }}
        />
      </Section>

      {/* --- HTML & GAMBAR --- */}
      <Section title="Menambah Gambar & HTML" icon={Image}>
        <p>
          Anda bisa menggunakan tag HTML standar di semua <i>field</i> teks
          (Narasi, Soal, Opsi, Pembahasan) untuk membuatnya rapi.
        </p>
        <p>
          Untuk menambahkan gambar, Anda harus meng-upload gambar ke{" "}
          <i>storage</i> (misal: Supabase Storage, Vercel Blob) dan salin
          URL-nya. Gunakan tag <code>&lt;img&gt;</code>:
        </p>
        <pre className="mt-2 w-full rounded-lg bg-gray-900 p-4 text-xs text-green-300">
          <code>{`<p>Perhatikan gambar:</p>\n<img src="https://URL_GAMBAR_ANDA.jpg" alt="Deskripsi gambar" style="width: 200px; margin: 10px 0;" />`}</code>
        </pre>
        <p className="mt-4">
          Anda juga bisa menggunakan <code>&lt;b&gt;</code> (tebal),{" "}
          <code>&lt;i&gt;</code> (miring), <code>&lt;ul&gt;</code> (poin), dan{" "}
          <code>MathJax</code> (untuk rumus).
        </p>
      </Section>

      {/* --- MANAJEMEN USER --- */}
      <Section title="Manajemen User" icon={Users}>
        <p>
          Halaman ini memungkinkan Anda mengelola semua pengguna yang
          terdaftar.
        </p>
        <ul>
          <li>
            <strong>Edit User:</strong> Klik ikon "Edit" untuk mengubah{" "}
            <code>role</code> (Admin/User) atau status <code>Premium</code>.
          </li>
          <li>
            <strong>Menambah Premium:</strong> Untuk memberi <i>user</i> akses
            premium, pilih tanggal di "Premium Kadaluwarsa Pada". Jika tanggal
            itu di masa depan, <i>user</i> akan menjadi premium. Untuk menghapus
            premium, kosongkan tanggalnya.
          </li>
          <li>
            <strong>Hapus User:</strong> Klik ikon "Hapus". Ini akan menghapus
            akun <i>user</i> dari Supabase Auth <strong>DAN</strong> semua data
            terkait (profil, riwayat tes) secara permanen.
          </li>
        </ul>
      </Section>

      {/* --- GAYA TAMBAHAN --- */}
      <style>{`
        .prose pre {
          background-color: #111827;
          color: #D1D5DB;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .prose code {
          color: #6EE7B7;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
