create table if not exists obligations (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references property_units(id) on delete set null,
  agreement_id uuid references agreements(id) on delete set null,
  obligation_type text not null check (obligation_type in ('rent','property_tax','municipality_fee','electricity','water','sewage','service_charge','insurance','maintenance','custom')),
  source_system text,
  provider_name text,
  external_reference text,
  title text not null,
  description text,
  period_start date,
  period_end date,
  amount_due numeric(14,2) not null,
  currency_code text default 'JOD',
  due_date date,
  status text not null default 'pending' check (status in ('pending','paid','partial','overdue','cancelled','disputed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  obligation_id uuid not null references obligations(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  agreement_id uuid references agreements(id) on delete set null,
  amount_paid numeric(14,2) not null,
  currency_code text default 'JOD',
  payment_method text not null check (payment_method in ('cash','card','bank_transfer','cliq','efawateer','manual_adjustment','other')),
  payment_reference text,
  external_transaction_id text,
  paid_at timestamptz not null default now(),
  received_by_user_id uuid references users(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_obligations_property_id on obligations(property_id);
create index if not exists idx_obligations_agreement_id on obligations(agreement_id);
create index if not exists idx_obligations_status on obligations(status);
create index if not exists idx_obligations_due_date on obligations(due_date);
create index if not exists idx_payments_obligation_id on payments(obligation_id);
create index if not exists idx_payments_paid_at on payments(paid_at);
