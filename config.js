// Pengaturan Supabase untuk Kantong.
// Isi dua nilai ini dari Supabase → Project Settings → API.
// anon public key memang boleh ada di website ini: datanya dilindungi Row Level Security.
// JANGAN pernah menaruh service_role key di sini.
// Selama kosong, Kantong tetap berjalan dalam mode tamu (data di browser).
window.KANTONG_CONFIG = {
  supabaseUrl: "https://rthgzbwznmepwauagoti.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aGd6Ynd6bm1lcHdhdWFnb3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODU2ODgsImV4cCI6MjEwNzA2MTY4OH0.cOei-78AKEumip8DTEg8ZZE4eCTxqtiKkltFLCGARCQ"
};
