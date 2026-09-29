-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR THE HAPPY CLUB STUDIOS (TCHS AUTOMATION)
-- Run this in your Supabase SQL Editor: https://app.supabase.com
-- ====================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. PROFILES (Staff & Sales Reps)
-- References Supabase auth.users(id) so it seamlessly links to login credentials!
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text check (role in ('admin', 'sales_rep')) default 'sales_rep',
  job_title text default 'Senior Event Account Executive',
  phone text,
  signature_image_url text,
  email_signature_html text,
  company_branch text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Automatic Profile Creation on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    job_title,
    email_signature_html
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales_rep'),
    coalesce(new.raw_user_meta_data->>'job_title', 'Senior Event Account Executive'),
    'Best regards,\n' || coalesce(new.raw_user_meta_data->>'full_name', 'Account Executive') || '\nThe Happy Club Studios'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. SERVICE CATEGORIES
create table if not exists public.service_categories (
  id text primary key,
  name text not null,
  description text,
  sort_order int default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SERVICE PACKAGES
create table if not exists public.service_packages (
  id text primary key,
  category_id text references public.service_categories(id) on delete cascade,
  name text not null,
  script_title text,
  subtitle text,
  short_code text,
  base_price numeric(12, 2) not null default 0.00,
  base_hours numeric(5, 2) default 2.00,
  base_pax int default 100,
  badge_text text,
  description text,
  specs jsonb default '[]'::jsonb,
  inclusions jsonb default '[]'::jsonb,
  freebies jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ADDONS
create table if not exists public.addons (
  id text primary key,
  service_id text references public.service_packages(id) on delete cascade,
  name text not null,
  category_tag text,
  pricing_type text check (pricing_type in ('fixed', 'interval', 'pax_dependent', 'variant')) not null,
  base_price numeric(12, 2) not null default 0.00,
  interval_unit text,
  interval_step int default 1,
  default_quantity int default 1,
  is_pax_dependent boolean default false,
  pax_multiplier numeric(12, 2),
  variants jsonb default '[]'::jsonb,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. LOCATION ZONES & MOBILIZATION
create table if not exists public.location_zones (
  id text primary key,
  name text not null,
  default_fee numeric(12, 2) not null default 0.00,
  description text
);

-- 8. PROPOSALS
create table if not exists public.proposals (
  id uuid primary key default uuid_generate_v4(),
  proposal_number text unique not null,
  client jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  services jsonb default '[]'::jsonb,
  discounts jsonb default '[]'::jsonb,
  mobilization jsonb default '{}'::jsonb,
  pricing jsonb default '{}'::jsonb,
  package_tier_badge text default 'PACKAGE A',
  status text check (status in ('draft', 'sent', 'approved', 'invoiced', 'declined')) default 'draft',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. INVOICES
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null,
  proposal_id uuid references public.proposals(id) on delete set null,
  proposal_number text,
  client jsonb not null default '{}'::jsonb,
  issued_by uuid references public.profiles(id) on delete set null,
  issue_date date not null default current_date,
  due_date date not null,
  services jsonb default '[]'::jsonb,
  discounts jsonb default '[]'::jsonb,
  mobilization jsonb default '{}'::jsonb,
  pricing jsonb default '{}'::jsonb,
  package_tier_badge text,
  payment_status text check (payment_status in ('unpaid', 'partial', 'paid')) default 'unpaid',
  paid_amount numeric(12, 2) default 0.00,
  balance_due numeric(12, 2) default 0.00,
  signer_name text not null,
  signer_title text,
  signer_email text,
  signer_phone text,
  signer_signature_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_packages enable row level security;
alter table public.addons enable row level security;
alter table public.location_zones enable row level security;
alter table public.proposals enable row level security;
alter table public.invoices enable row level security;

-- Policies: Authenticated staff can read and write data
create policy "Allow authenticated staff full access to profiles" on public.profiles for all to authenticated using (true);
create policy "Allow public read access to service categories" on public.service_categories for select using (true);
create policy "Allow authenticated staff write access to categories" on public.service_categories for all to authenticated using (true);
create policy "Allow public read access to packages" on public.service_packages for select using (true);
create policy "Allow authenticated staff write access to packages" on public.service_packages for all to authenticated using (true);
create policy "Allow public read access to addons" on public.addons for select using (true);
create policy "Allow authenticated staff write access to addons" on public.addons for all to authenticated using (true);
create policy "Allow public read access to location zones" on public.location_zones for select using (true);
create policy "Allow authenticated staff full access to proposals" on public.proposals for all to authenticated using (true);
create policy "Allow authenticated staff full access to invoices" on public.invoices for all to authenticated using (true);

-- 11. INITIAL SEED DATA
insert into public.location_zones (id, name, default_fee, description) values
  ('zone-mm', 'Metro Manila', 0.00, 'Standard coverage, zero mobilization'),
  ('zone-bulacan', 'Bulacan (Sta. Maria / San Jose / Malolos)', 2500.00, 'Suburban North zone'),
  ('zone-rizal', 'Rizal (Antipolo / Tanay / Taytay)', 2000.00, 'Suburban East zone'),
  ('zone-cavite', 'Cavite (Bacoor / Imus / Dasma)', 2500.00, 'Suburban South zone'),
  ('zone-tagaytay', 'Tagaytay / Alfonso / Silang', 3500.00, 'Upland South zone'),
  ('zone-pampanga', 'Pampanga / Clark / Angeles', 3500.00, 'Central Luzon zone'),
  ('zone-batangas', 'Batangas / Lipa / Nasugbu', 4500.00, 'Southern Luzon zone'),
  ('zone-custom', 'Out of Town (Custom)', 5000.00, 'Custom computed rate')
on conflict (id) do nothing;
