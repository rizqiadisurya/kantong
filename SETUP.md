# Menyiapkan Kantong dengan Firebase dan Netlify

Proyek yang dipakai sekarang: Firebase **kantong-511100** (paket gratis Spark), Firestore region `asia-southeast2` (Jakarta).

## 1. Firebase
1. **console.firebase.google.com** → buat proyek (atau tambahkan ke proyek Google Cloud yang ada).
2. **Authentication → Sign-in method → Google** → Enable → Save.
3. **Authentication → Settings → Authorized domains**: tambahkan domain situs (mis. `kantong-keuangan.netlify.app`).
4. **Firestore Database → Create database**: Standard edition, ID `(default)`, region Jakarta, mode Restrictive.
5. **Firestore → Rules**: tempel isi `firestore.rules`, lalu Publish.
6. **Project settings → Your apps → Web app**: salin `firebaseConfig` ke `config.js`.

## 2. Login di iPhone (Safari)
Safari memblokir cookie pihak ketiga, jadi login lewat domain situs sendiri:
- `netlify.toml` sudah meneruskan `/__/auth/*` ke `kantong-511100.firebaseapp.com`.
- Di **Google Cloud Console → Google Auth Platform → Clients → Web client (auto created by Google Service)**,
  tambahkan *Authorized redirect URI*: `https://kantong-keuangan.netlify.app/__/auth/handler`.

## 3. Netlify
Sudah tersambung ke repo GitHub `kantong`; setiap push otomatis terbit.

## Cara kerja data
- **Tamu**: catatan di browser (localStorage).
- **Masuk dengan Google**: `users/{uid}` (pengaturan) dan `users/{uid}/tx/{id}` (transaksi) di Firestore, dengan salinan offline di IndexedDB perangkat.
- Catatan dari versi lama (Supabase) yang tersisa di perangkat dipindahkan otomatis saat pertama masuk.
