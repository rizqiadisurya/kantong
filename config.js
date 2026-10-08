// Pengaturan Supabase untuk Kantong.
// Isi dua nilai ini dari Supabase → Project Settings → API.
// anon public key memang boleh ada di website ini: datanya dilindungi Row Level Security.
// JANGAN pernah menaruh service_role key di sini.
// Selama kosong, Kantong tetap berjalan dalam mode tamu (data di browser).
window.KANTONG_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
