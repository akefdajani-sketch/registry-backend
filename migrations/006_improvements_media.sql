create table if not exists improvements (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references property_units(id) on delete set null,
  title text not null,
  description text,
  improvement_type text,
  contractor_name text,
  material_summary text,
  estimated_cost numeric(14,2),
  actual_cost numeric(14,2),
  currency_code text default 'JOD',
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  entity_type text not null check (entity_type in ('property','property_unit','agreement','improvement','owner','tenant','payment','obligation')),
  entity_id uuid not null,
  media_category text not null check (media_category in ('logo','property_image','blueprint','document_pdf','receipt','contract_scan','id_document','other')),
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  r2_bucket text not null,
  r2_key text not null,
  public_url text,
  uploaded_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_improvements_property_id on improvements(property_id);
create index if not exists idx_media_assets_entity on media_assets(entity_type, entity_id);
