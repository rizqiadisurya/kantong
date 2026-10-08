-- Kantong: skema database Supabase
-- Tempel seluruh isi file ini di Supabase → SQL Editor → New query, lalu klik Run.
-- Aman dijalankan ulang.

-- 1) Pengaturan per pengguna: dompet, kategori, anggaran, tagihan rutin, target tabungan.
create table if not exists public.user_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Transaksi: satu baris per transaksi.
create table if not exists public.transactions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  type       text not null check (type in ('in', 'out', 'transfer')),
  amount     bigint not null check (amount > 0),
  cat        text,
  wallet     text not null,
  to_wallet  text,
  date       date not null,
  note       text not null default '',
  at         bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists transactions_user_date on public.transactions (user_id, date desc);

-- 3) Row Level Security: setiap pengguna hanya bisa membaca dan mengubah datanya sendiri.
alter table public.user_state   enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "state: milik sendiri" on public.user_state;
create policy "state: milik sendiri" on public.user_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transaksi: milik sendiri" on public.transactions;
create policy "transaksi: milik sendiri" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Pengunjung yang belum masuk tidak punya akses sama sekali.
revoke all on public.user_state, public.transactions from anon;
grant select, insert, update, delete on public.user_state, public.transactions to authenticated;
