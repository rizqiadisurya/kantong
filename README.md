# Kantong

Aplikasi pencatatan keuangan pribadi yang semudah chat: ketik `kopi susu 25rb`, selesai.

**Buka aplikasinya:** https://kantong-keuangan.netlify.app/ (cadangan: https://rizqiadisurya.github.io/kantong/)

Panduan menyiapkan login Google, Supabase, dan Netlify: lihat [SETUP.md](SETUP.md).

## Fitur
- Ketik cepat: jumlah, kategori, dan catatan terisi otomatis
- Scan struk: foto struk → total, tanggal, toko, dan daftar barang terbaca otomatis (OCR di perangkat, Tesseract.js)
- Banyak dompet (tunai, bank, e-wallet) dan transfer antar dompet
- Anggaran per kategori dengan peringatan
- Tagihan & pemasukan rutin
- Target tabungan
- Laporan bulanan dan tren 6 bulan
- Ekspor CSV, cadangan & pulihkan (JSON)
- Masuk dengan Google & sinkron antarperangkat (Supabase)
- Kunci PIN 6 angka per perangkat, dengan kunci otomatis saat aplikasi ditinggal

## Privasi
Bisa dipakai tanpa akun (data di browser). Masuk dengan Google untuk menyinkronkan catatan antarperangkat; data dikunci per pengguna dengan Row Level Security Supabase. Lihat [privasi.html](privasi.html).
