-- HOUSE COMMAND CENTER SCHEMA
-- Run this entire file in Supabase SQL Editor

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  start_date date,
  target_date date,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text default '#2563eb',
  is_active boolean default true
);

create table spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  type text check (type in ('floor','room','zone','exterior')),
  floor text,
  parent_id uuid references spaces(id)
);

create table users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  phone text,
  role text check (role in ('owner','editor','viewer','clarifier')),
  team_type text,
  access_token text unique default encode(gen_random_bytes(12), 'hex'),
  language_pref text default 'english',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  phone text not null,
  whatsapp_phone text,
  category_id uuid references categories(id),
  language_pref text default 'hindi' check (language_pref in ('hindi','english','bilingual')),
  reliability_score int default 5,
  missed_count int default 0,
  payment_hold boolean default false,
  payment_hold_reason text,
  contract_amount numeric,
  total_paid numeric default 0,
  access_token text unique default encode(gen_random_bytes(12), 'hex'),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  space_id uuid references spaces(id),
  category_id uuid references categories(id),
  status text default 'planned' check (status in (
    'planned','in_progress','waiting_vendor','waiting_material',
    'waiting_decision','blocked','delayed','done','verified','closed'
  )),
  priority text default 'normal' check (priority in ('critical','normal','low')),
  start_date date,
  end_date date,
  actual_end_date date,
  blocks_task_id uuid references tasks(id),
  assigned_to uuid references users(id),
  photo_proof_required boolean default false,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table task_vendors (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  scope text,
  is_primary boolean default true,
  unique(task_id, vendor_id)
);

create table promises (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  promise_type text check (promise_type in (
    'complete_work','start_work','send_workers',
    'deliver_material','send_invoice','other'
  )),
  promised_date date not null,
  arrival_time time,
  workers_promised int,
  description text,
  status text default 'pending' check (status in ('pending','kept','missed','partial')),
  miss_reason text,
  logged_by uuid references users(id),
  created_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text check (entity_type in ('task','vendor','promise','clarification')),
  entity_id uuid not null,
  content text not null,
  source text default 'typed' check (source in ('typed','voice','photo_caption')),
  added_by_user uuid references users(id),
  added_by_vendor uuid references vendors(id),
  created_at timestamptz default now()
);

create table clarifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id),
  question text not null,
  assigned_to uuid references users(id),
  raised_by uuid references users(id),
  status text default 'open' check (status in ('open','answered','closed')),
  answer text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  vendor_id uuid references vendors(id),
  storage_path text not null,
  public_url text,
  description text,
  uploaded_by_user uuid references users(id),
  uploaded_by_vendor uuid references vendors(id),
  verified boolean default false,
  verified_by uuid references users(id),
  taken_at timestamptz default now()
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name text not null,
  type text check (type in (
    'reminder','confirmation','escalation',
    'payment_hold','photo_request','weekly_plan','custom'
  )),
  body_en text not null,
  body_hi text,
  placeholders jsonb default '[]',
  is_system boolean default false,
  is_custom boolean default false,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table wa_log (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  task_id uuid references tasks(id),
  template_id uuid references templates(id),
  message_text text,
  sent_by uuid references users(id),
  sent_at timestamptz default now()
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  week_start date not null,
  task_id uuid references tasks(id),
  vendor_id uuid references vendors(id),
  planned_by uuid references users(id),
  sent_to_vendor boolean default false,
  sent_at timestamptz,
  notes text
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks
for each row execute function update_updated_at();

create or replace function increment_missed_count()
returns trigger as $$
begin
  if new.status = 'missed' and old.status != 'missed' then
    update vendors set missed_count = missed_count + 1 where id = new.vendor_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger promise_missed_trigger after update on promises
for each row execute function increment_missed_count();