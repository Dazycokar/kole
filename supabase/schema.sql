-- Optional. The site creates these tables itself on first start. Run this in Supabase > SQL Editor
-- if you prefer to create them by hand. Row level security with no policy keeps them closed to the public anon key.
create table if not exists kole_store (key text primary key, value jsonb not null);
create table if not exists kole_files (id text primary key, mime text not null, data bytea not null, created_at timestamptz not null default now());
alter table kole_store enable row level security;
alter table kole_files enable row level security;
