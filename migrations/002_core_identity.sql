create table municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  country_code text default 'JO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid references municipalities(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  password_hash text,
  role text not null check (role in (
    'super_admin',
    'municipality_admin',
    'municipality_staff',
    'owner',
    'tenant',
    'auditor'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table owners (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  full_name text not null,
  national_id text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tenants (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  full_name text not null,
  national_id text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
