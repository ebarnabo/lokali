-- Lokali: profils, offres, entraide, textes. Pas de données fictives.

create table if not exists profiles (
  user_id text primary key references "user" (id) on delete cascade,
  display_name text not null default '',
  account_kind text not null default 'particulier' check (account_kind in ('particulier', 'pro')),
  is_admin boolean not null default false,
  business_name text not null default '',
  description text not null default '',
  address text not null default '',
  commune text not null default '',
  lat double precision,
  lng double precision,
  public_phone text not null default '',
  public_email text not null default '',
  show_phone boolean not null default false,
  show_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id serial primary key,
  user_id text not null references profiles (user_id) on delete cascade,
  name text not null,
  detail text not null default '',
  price_label text not null default '',
  unit text not null default '',
  available boolean not null default true,
  hidden_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists products_user_idx on products (user_id);

create table if not exists posts (
  id serial primary key,
  user_id text not null references profiles (user_id) on delete cascade,
  kind text not null check (kind in ('besoin', 'surplus', 'covoiturage', 'autre')),
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_status_idx on posts (status, created_at desc);
create index if not exists posts_user_idx on posts (user_id, created_at desc);

create table if not exists legal_pages (
  slug text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create table if not exists site_copy (
  key text primary key,
  value text not null
);

insert into legal_pages (slug, title, body) values
  ('mentions-legales', 'Mentions légales', 'Texte à rédiger par l''administrateur. Ce bloc n''est pas un document juridique.'),
  ('confidentialite', 'Confidentialité', 'Texte à rédiger par l''administrateur. Indiquez quelles données sont collectées, pourquoi, et pendant combien de temps.'),
  ('cgu', 'Conditions d''utilisation', 'Texte à rédiger par l''administrateur.')
on conflict (slug) do nothing;

insert into site_copy (key, value) values
  ('hero_title', 'Le local, près de chez vous.'),
  ('hero_text', 'Les commerces pro publient eux-mêmes ce qu''ils proposent. Rien n''est inventé.'),
  ('entraide_intro', 'Annonces écrites par les habitants. Elles apparaissent après validation.')
on conflict (key) do nothing;
