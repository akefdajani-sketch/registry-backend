alter table obligations add column if not exists amount_paid numeric(14,2) not null default 0;
alter table obligations add column if not exists amount_remaining numeric(14,2);
alter table obligations add column if not exists issued_date date;
alter table obligations add column if not exists is_recurring_generated boolean not null default false;
alter table obligations add column if not exists parent_schedule_key text;
alter table obligations add column if not exists responsible_party_type text;
alter table obligations add column if not exists responsible_owner_id uuid references owners(id) on delete set null;
alter table obligations add column if not exists responsible_tenant_id uuid references tenants(id) on delete set null;
alter table obligations add column if not exists shared_allocation_note text;

update obligations set amount_remaining = amount_due - amount_paid where amount_remaining is null;
alter table obligations alter column amount_remaining set not null;
