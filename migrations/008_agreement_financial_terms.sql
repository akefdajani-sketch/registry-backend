alter table agreements add column if not exists rent_amount numeric(14,2);
alter table agreements add column if not exists deposit_due numeric(14,2);
alter table agreements add column if not exists billing_day integer;
alter table agreements add column if not exists first_billing_date date;
alter table agreements add column if not exists recurring_until date;
alter table agreements add column if not exists auto_generate_obligations boolean not null default false;
alter table agreements add column if not exists utility_responsibility text;
alter table agreements add column if not exists tax_responsibility text;
