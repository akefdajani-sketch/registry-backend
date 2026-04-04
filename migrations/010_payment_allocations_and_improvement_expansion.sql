create table if not exists payment_allocations (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  obligation_id uuid not null references obligations(id) on delete cascade,
  amount_allocated numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_allocations_payment_id on payment_allocations(payment_id);
create index if not exists idx_payment_allocations_obligation_id on payment_allocations(obligation_id);

create table if not exists improvement_categories (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid references municipalities(id) on delete cascade,
  code text not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_improvement_categories_code on improvement_categories(municipality_id, code);

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  trade_type text,
  registration_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists improvement_materials (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  improvement_id uuid not null references improvements(id) on delete cascade,
  material_name text not null,
  specification text,
  quantity numeric(14,2),
  unit text,
  unit_cost numeric(14,2),
  total_cost numeric(14,2),
  supplier_name text,
  created_at timestamptz not null default now()
);

alter table improvements add column if not exists category_id uuid references improvement_categories(id) on delete set null;
alter table improvements add column if not exists contractor_id uuid references contractors(id) on delete set null;
alter table improvements add column if not exists estimated_value_add numeric(14,2);
alter table improvements add column if not exists permit_reference text;
alter table improvements add column if not exists blueprint_version text;
alter table improvements add column if not exists completion_notes text;

create index if not exists idx_improvements_category_id on improvements(category_id);
create index if not exists idx_improvements_contractor_id on improvements(contractor_id);
create index if not exists idx_improvement_materials_improvement_id on improvement_materials(improvement_id);

alter table media_assets drop constraint if exists media_assets_media_category_check;
alter table media_assets add constraint media_assets_media_category_check check (media_category in (
  'logo','property_image','blueprint','document_pdf','receipt','contract_scan','id_document',
  'before_photo','after_photo','progress_photo','permit_document','invoice','contractor_quote','technical_drawing','other'
));

create table if not exists property_value_notes (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  improvement_id uuid references improvements(id) on delete set null,
  note_type text not null check (note_type in ('market_impact','appraisal_note','compliance_note','insurance_note','owner_note','municipality_note')),
  title text not null,
  body text,
  estimated_value_impact numeric(14,2),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_value_notes_property_id on property_value_notes(property_id);
