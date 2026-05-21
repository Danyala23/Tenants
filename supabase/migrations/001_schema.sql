-- Tenants app schema (Postgres / Supabase)
-- Maps from EF Core entities in Tenants.Server/Data

create type utility_type as enum ('Gas', 'Electricity');
create type bill_type as enum ('Water', 'Electricity', 'Gas');

create table properties (
  id bigint generated always as identity primary key,
  house_number text not null default '',
  address text not null default '',
  size numeric(18, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table floors (
  id bigint generated always as identity primary key,
  property_id bigint not null references properties(id) on delete cascade,
  floor_number int not null,
  label text not null default ''
);

create table tenants (
  id bigint generated always as identity primary key,
  name text not null default '',
  phone_number text not null default ''
);

create table tenant_occupancies (
  id bigint generated always as identity primary key,
  tenant_id bigint not null references tenants(id) on delete cascade,
  property_id bigint not null references properties(id) on delete cascade,
  floor_id bigint references floors(id) on delete restrict,
  rent numeric(18, 2) not null default 0,
  security_deposit numeric(18, 2) not null default 0,
  start_date date not null,
  end_date date
);

create table utility_connections (
  id bigint generated always as identity primary key,
  property_id bigint not null references properties(id) on delete cascade,
  floor_id bigint references floors(id) on delete restrict,
  type utility_type not null default 'Gas',
  reference_number text,
  consumer_number text,
  provider_name text
);

create table monthly_bills (
  id bigint generated always as identity primary key,
  tenant_occupancy_id bigint references tenant_occupancies(id) on delete restrict,
  property_id bigint not null references properties(id) on delete cascade,
  floor_id bigint references floors(id) on delete restrict,
  utility_connection_id bigint references utility_connections(id) on delete restrict,
  type bill_type not null default 'Water',
  year int not null,
  month int not null,
  amount numeric(18, 2) not null default 0,
  is_paid boolean not null default false,
  due_date timestamptz,
  units_consumed numeric(18, 2),
  bill_html_content text,
  scraped_at timestamptz
);

create table rent_payments (
  id bigint generated always as identity primary key,
  tenant_occupancy_id bigint not null references tenant_occupancies(id) on delete cascade,
  year int not null,
  month int not null,
  is_paid boolean not null default false,
  amount_paid numeric(18, 2) not null default 0,
  collected_at timestamptz
);

create table rent_increase_rules (
  id bigint generated always as identity primary key,
  tenant_occupancy_id bigint not null unique references tenant_occupancies(id) on delete cascade,
  increase_percent numeric(5, 2) not null default 10,
  next_increase_date timestamptz not null
);

create index idx_floors_property on floors(property_id);
create index idx_occupancies_property on tenant_occupancies(property_id);
create index idx_occupancies_tenant on tenant_occupancies(tenant_id);
create index idx_occupancies_floor on tenant_occupancies(floor_id);
create index idx_bills_property on monthly_bills(property_id);
create index idx_bills_year_month on monthly_bills(year, month);
create index idx_utility_connections_property on utility_connections(property_id);

-- RLS: authenticated users can manage all data (single-landlord app)
alter table properties enable row level security;
alter table floors enable row level security;
alter table tenants enable row level security;
alter table tenant_occupancies enable row level security;
alter table utility_connections enable row level security;
alter table monthly_bills enable row level security;
alter table rent_payments enable row level security;
alter table rent_increase_rules enable row level security;

create policy "authenticated_all_properties" on properties for all to authenticated using (true) with check (true);
create policy "authenticated_all_floors" on floors for all to authenticated using (true) with check (true);
create policy "authenticated_all_tenants" on tenants for all to authenticated using (true) with check (true);
create policy "authenticated_all_occupancies" on tenant_occupancies for all to authenticated using (true) with check (true);
create policy "authenticated_all_utilities" on utility_connections for all to authenticated using (true) with check (true);
create policy "authenticated_all_bills" on monthly_bills for all to authenticated using (true) with check (true);
create policy "authenticated_all_payments" on rent_payments for all to authenticated using (true) with check (true);
create policy "authenticated_all_rent_rules" on rent_increase_rules for all to authenticated using (true) with check (true);

-- Service role bypasses RLS (used by GitHub Actions scraper)
