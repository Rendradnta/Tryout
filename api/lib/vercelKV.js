import { createClient } from '@vercel/kv';

// 1. Ambil kredensial KV
// Vercel secara otomatis memasukkan variabel-variabel ini
// ke environment saat Anda menghubungkan KV Storage ke proyek Anda.
const kvRestApiUrl = process.env.KV_REST_API_URL;
const kvRestApiToken = process.env.KV_REST_API_TOKEN;

if (!kvRestApiUrl || !kvRestApiToken) {
  // Ini penting untuk debugging jika koneksi gagal
  console.error('Vercel KV environment variables are not set.');
  // Sebaiknya, buat agar fungsi apa pun yang menggunakan ini gagal jika tidak ada kredensial
}

// 2. Buat dan ekspor client Vercel KV
export const kv = createClient({
  url: kvRestApiUrl,
  token: kvRestApiToken,
});
