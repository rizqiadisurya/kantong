# Menyiapkan Kantong dengan Supabase, Google, dan Netlify

Urutannya: **Netlify → Supabase → Google → sambungkan**. Sekitar 20 menit.
Selama `config.js` masih kosong, website tetap jalan dalam mode tamu (data di browser).

---

## 1. Netlify: online-kan dari GitHub

1. Masuk ke **app.netlify.com** (bisa pakai akun GitHub).
2. **Add new project → Import an existing project → GitHub**, lalu pilih repo `kantong`.
3. Biarkan *Build command* kosong dan *Publish directory* `.`, lalu klik **Deploy**.
4. Di **Project configuration → Change project name**, ganti nama menjadi `kantong` (atau nama lain yang masih tersedia).
   Alamatnya: `https://kantong.netlify.app` → catat sebagai **ALAMAT_SITUS**.

Setiap perubahan yang diunggah ke GitHub akan otomatis tampil di Netlify.

## 2. Supabase: buat database

1. Masuk ke **supabase.com → New project**. Pilih region **Southeast Asia (Singapore)** supaya cepat dari Indonesia.
2. Buka **SQL Editor → New query**, tempel seluruh isi `supabase/schema.sql`, lalu klik **Run**.
3. Buka **Project Settings → API** (atau **Data API**) dan catat:
   - **Project URL**, misalnya `https://abcd1234.supabase.co`
   - **anon public key**
   Jangan pernah membagikan **service_role key**.

## 3. Google: buat kunci login

1. Buka **console.cloud.google.com**, lalu buat project baru bernama `Kantong`.
2. Buka **Google Auth Platform** (dulu bernama *OAuth consent screen*) → **Get started**:
   - App name: `Kantong`, support email: emailmu
   - Audience: **External**
3. **Clients → Create client → Web application**:
   - *Authorized JavaScript origins*: `ALAMAT_SITUS`
   - *Authorized redirect URIs*: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (`<PROJECT-REF>` adalah bagian depan Project URL Supabase)
4. Catat **Client ID** dan **Client secret**.
5. Di **Audience**, klik **Publish app** agar semua orang bisa masuk, bukan hanya akun uji coba.
   Kantong hanya meminta nama dan email, jadi biasanya tidak perlu verifikasi Google.

## 4. Sambungkan Google ke Supabase

1. Supabase → **Authentication → Sign In / Providers → Google**: aktifkan, lalu tempel Client ID dan Client secret, kemudian Save.
2. Supabase → **Authentication → URL Configuration**:
   - *Site URL*: `ALAMAT_SITUS`
   - *Redirect URLs*: tambahkan `ALAMAT_SITUS/**` dan `https://rizqiadisurya.github.io/kantong/**`

## 5. Isi `config.js`

Isi `supabaseUrl` dan `supabaseAnonKey`, lalu unggah ke GitHub. Netlify akan memperbaruinya otomatis.

---

## Cara kerja data

- **Tamu**: catatan disimpan di browser.
- **Masuk dengan Google**: catatan disimpan di tabel `transactions` dan `user_state`, dikunci per pengguna dengan Row Level Security.
- **Pertama kali masuk**: catatan yang sudah ada di browser dipindahkan otomatis ke akun. Kalau akun sudah punya data, aplikasi menawarkan untuk menggabungkannya.

## Catatan paket gratis

Proyek Supabase gratis bisa dijeda setelah lama tidak dipakai, dan kapasitasnya terbatas. Cek halaman harga Supabase dan Netlify untuk batas terbaru.
