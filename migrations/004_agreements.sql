create table if not exists agreements (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references property_units(id) on delete set null,
  owner_id uuid references owners(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  agreement_type text not null check (agreement_type in ('rental','sale','lease_to_own','usufruct','other')),
  agreement_status text not null default 'draft' check (agreement_status in ('draft','pending_signature','active','completed','terminated','cancelled','expired')),
  reference_number text,
  start_date date,
  end_date date,
  signed_at timestamptz,
  contract_value numeric(14,2),
  currency_code text default 'JOD',
  payment_frequency text check (payment_frequency in ('one_time','monthly','quarterly','semi_annual','annual')),
  deposit_amount numeric(14,2),
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agreements_property_id on agreements(property_id);
create index if not exists idx_agreements_tenant_id on agreements(tenant_id);
create index if not exists idx_agreements_owner_id on agreements(owner_id);
create index if not exists idx_agreements_status on agreements(agreement_status);
