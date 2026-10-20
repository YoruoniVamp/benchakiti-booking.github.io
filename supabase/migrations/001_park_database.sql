-- Shared database for Benjakitti Active.
-- Run once in the Supabase SQL Editor. Passwords are held by Supabase Auth,
-- never in the profiles table or returned to the browser.

create extension if not exists btree_gist;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  phone text not null default '',
  is_admin boolean not null default false,
  is_head boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_head_is_admin check (not is_head or is_admin)
);
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));

-- Hashes of client IPs are kept briefly to limit public account creation.
create table if not exists public.registration_rate_limits (
  client_key text primary key check (length(client_key) = 64),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0)
);

create table if not exists public.courts (
  sport_id text not null check (sport_id in ('basketball','football','table-tennis','badminton')),
  court_number smallint not null check (court_number > 0),
  status text not null default 'open' check (status in ('open','out_of_service')),
  primary key (sport_id, court_number)
);

create table if not exists public.equipment (
  id text primary key,
  sport_id text not null check (sport_id in ('basketball','football','table-tennis','badminton')),
  item_number smallint not null check (item_number between 1 and 30),
  status text not null default 'idle' check (status in ('idle','booked','broken')),
  unique (sport_id, item_number)
);

create table if not exists public.court_bookings (
  id text primary key default gen_random_uuid()::text,
  sport_id text not null,
  court_number smallint not null,
  booking_date date not null,
  start_minute smallint not null check (start_minute >= 420),
  end_minute smallint not null check (end_minute <= 1260 and end_minute >= start_minute + 30),
  user_id uuid references public.profiles(id) on delete cascade,
  username_snapshot text not null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (sport_id, court_number) references public.courts(sport_id, court_number),
  constraint court_bookings_no_overlap exclude using gist (
    sport_id with =,
    court_number with =,
    booking_date with =,
    int4range(start_minute, end_minute, '[)') with &&
  )
);
create index if not exists court_bookings_date_idx on public.court_bookings (booking_date, sport_id, court_number);
create index if not exists court_bookings_user_idx on public.court_bookings (user_id, booking_date);

create table if not exists public.equipment_bookings (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.equipment(id) on delete cascade,
  booking_date date not null,
  pickup_minute smallint not null check (pickup_minute between 300 and 1260),
  picked_up_at time,
  user_id uuid references public.profiles(id) on delete cascade,
  username_snapshot text not null,
  staff_managed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (equipment_id, booking_date)
);
create index if not exists equipment_bookings_date_idx on public.equipment_bookings (booking_date, equipment_id);
create index if not exists equipment_bookings_user_idx on public.equipment_bookings (user_id, booking_date);

insert into public.courts (sport_id, court_number)
select sports.sport_id, n
from (values ('basketball',4),('football',4),('table-tennis',3),('badminton',4)) as sports(sport_id, court_count)
cross join lateral generate_series(1, sports.court_count) as n
on conflict (sport_id, court_number) do nothing;

insert into public.equipment (id, sport_id, item_number, status)
select prefixes.prefix || lpad(items.n::text, 3, '0'), prefixes.sport_id, items.n,
  case
    when items.n in (6,14,27) then 'broken'
    when items.n in (3,4,9,10,16,20,24) then 'booked'
    else 'idle'
  end
from (values
  ('basketball','BAS'),('football','FOO'),('table-tennis','TAB'),('badminton','BAD')
) as prefixes(sport_id, prefix)
cross join lateral generate_series(1,30) as items(n)
on conflict (id) do nothing;

-- Sample queue data for the current Bangkok date, matching the browser prototype.
insert into public.court_bookings (id,sport_id,court_number,booking_date,start_minute,end_minute,username_snapshot,is_sample)
values
  ('demo-basketball-1-0','basketball',1,(now() at time zone 'Asia/Bangkok')::date,450,540,'somsak',true),
  ('demo-basketball-1-1','basketball',1,(now() at time zone 'Asia/Bangkok')::date,660,750,'pimchan',true),
  ('demo-basketball-2-0','basketball',2,(now() at time zone 'Asia/Bangkok')::date,540,630,'niran',true),
  ('demo-basketball-2-1','basketball',2,(now() at time zone 'Asia/Bangkok')::date,780,870,'suda',true),
  ('demo-basketball-3-0','basketball',3,(now() at time zone 'Asia/Bangkok')::date,420,480,'ananda',true),
  ('demo-basketball-3-1','basketball',3,(now() at time zone 'Asia/Bangkok')::date,900,1020,'kanya',true),
  ('demo-basketball-4-0','basketball',4,(now() at time zone 'Asia/Bangkok')::date,600,690,'wirot',true),
  ('demo-basketball-4-1','basketball',4,(now() at time zone 'Asia/Bangkok')::date,810,900,'malee',true),
  ('demo-football-1-0','football',1,(now() at time zone 'Asia/Bangkok')::date,480,600,'prasit',true),
  ('demo-football-1-1','football',1,(now() at time zone 'Asia/Bangkok')::date,780,900,'arun',true),
  ('demo-football-2-0','football',2,(now() at time zone 'Asia/Bangkok')::date,420,510,'dao',true),
  ('demo-football-2-1','football',2,(now() at time zone 'Asia/Bangkok')::date,660,780,'natt',true),
  ('demo-football-3-0','football',3,(now() at time zone 'Asia/Bangkok')::date,570,690,'kiet',true),
  ('demo-football-3-1','football',3,(now() at time zone 'Asia/Bangkok')::date,870,990,'suda',true),
  ('demo-football-4-0','football',4,(now() at time zone 'Asia/Bangkok')::date,690,780,'pimchan',true),
  ('demo-football-4-1','football',4,(now() at time zone 'Asia/Bangkok')::date,900,1020,'niran',true),
  ('demo-table-tennis-1-0','table-tennis',1,(now() at time zone 'Asia/Bangkok')::date,450,510,'ananda',true),
  ('demo-table-tennis-1-1','table-tennis',1,(now() at time zone 'Asia/Bangkok')::date,660,720,'dao',true),
  ('demo-table-tennis-1-2','table-tennis',1,(now() at time zone 'Asia/Bangkok')::date,840,900,'kanya',true),
  ('demo-table-tennis-2-0','table-tennis',2,(now() at time zone 'Asia/Bangkok')::date,510,570,'somsak',true),
  ('demo-table-tennis-2-1','table-tennis',2,(now() at time zone 'Asia/Bangkok')::date,750,810,'malee',true),
  ('demo-table-tennis-3-0','table-tennis',3,(now() at time zone 'Asia/Bangkok')::date,600,660,'wirot',true),
  ('demo-table-tennis-3-1','table-tennis',3,(now() at time zone 'Asia/Bangkok')::date,900,960,'arun',true),
  ('demo-badminton-1-0','badminton',1,(now() at time zone 'Asia/Bangkok')::date,420,510,'suda',true),
  ('demo-badminton-1-1','badminton',1,(now() at time zone 'Asia/Bangkok')::date,660,750,'prasit',true),
  ('demo-badminton-2-0','badminton',2,(now() at time zone 'Asia/Bangkok')::date,510,600,'kanya',true),
  ('demo-badminton-2-1','badminton',2,(now() at time zone 'Asia/Bangkok')::date,780,900,'dao',true),
  ('demo-badminton-3-0','badminton',3,(now() at time zone 'Asia/Bangkok')::date,600,690,'arun',true),
  ('demo-badminton-3-1','badminton',3,(now() at time zone 'Asia/Bangkok')::date,840,930,'malee',true),
  ('demo-badminton-4-0','badminton',4,(now() at time zone 'Asia/Bangkok')::date,450,540,'niran',true),
  ('demo-badminton-4-1','badminton',4,(now() at time zone 'Asia/Bangkok')::date,720,810,'pimchan',true)
on conflict (id) do nothing;

create or replace function public.handle_new_park_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username',''), split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data ->> 'phone','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_park_profile on auth.users;
create trigger on_auth_user_created_park_profile
  after insert on auth.users
  for each row execute function public.handle_new_park_profile();
revoke all on function public.handle_new_park_profile() from public;

create or replace function public.park_state_read()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_name text;
  caller_admin boolean := false;
  result jsonb;
begin
  select p.username, p.is_admin into caller_name, caller_admin
  from public.profiles p where p.id = caller_id;

  select jsonb_build_object(
    'users', case when caller_admin then
      coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'phone', p.phone,
        'role', case when p.is_head then 'head' when p.is_admin then 'admin' else 'user' end
      ) order by lower(p.username)) from public.profiles p), '[]'::jsonb)
    when caller_id is not null then
      coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'phone', p.phone,
        'role', case when p.is_head then 'head' when p.is_admin then 'admin' else 'user' end
      )) from public.profiles p where p.id = caller_id), '[]'::jsonb)
    else '[]'::jsonb end,
    'currentUser', caller_name,
    'courtBookings', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'sportId', b.sport_id,
      'court', b.court_number,
      'date', b.booking_date::text,
      'start', b.start_minute,
      'end', b.end_minute,
      'user', case
        when b.is_sample then b.username_snapshot
        when caller_admin then b.username_snapshot
        when b.user_id = caller_id then caller_name
        else upper(left(b.username_snapshot,4))
      end,
      'seeded', b.is_sample
    ) order by b.booking_date, b.start_minute) from public.court_bookings b), '[]'::jsonb),
    'equipmentBookings', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'equipmentId', b.equipment_id,
      'sportId', e.sport_id,
      'date', b.booking_date::text,
      'time', b.pickup_minute,
      'user', case when caller_admin or b.user_id = caller_id then b.username_snapshot else 'member' end,
      'pickedUpAt', case when b.picked_up_at is null then '' else to_char(b.picked_up_at,'HH24:MI') end,
      'staffManaged', b.staff_managed
    ) order by b.booking_date, b.pickup_minute) from public.equipment_bookings b join public.equipment e on e.id=b.equipment_id), '[]'::jsonb),
    'equipmentOverrides', coalesce((select jsonb_object_agg(e.id, jsonb_build_object(
      'status', case when e.status='booked' then 'others' else e.status end
    )) from public.equipment e), '{}'::jsonb),
    'courtMaintenance', coalesce((select jsonb_object_agg(c.sport_id || '-' || c.court_number::text, true)
      from public.courts c where c.status='out_of_service'), '{}'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.park_claim_registration_slot(p_client_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
begin
  if p_client_key is null or length(p_client_key) <> 64 then
    raise exception 'Invalid registration key.' using errcode='22023';
  end if;

  insert into public.registration_rate_limits as rate_limit(client_key, window_started_at, attempts)
  values (p_client_key, now(), 1)
  on conflict (client_key) do update set
    window_started_at = case
      when rate_limit.window_started_at < now() - interval '1 hour' then now()
      else rate_limit.window_started_at
    end,
    attempts = case
      when rate_limit.window_started_at < now() - interval '1 hour' then 1
      else rate_limit.attempts + 1
    end
  returning attempts into attempt_count;

  delete from public.registration_rate_limits
    where window_started_at < now() - interval '1 day';
  return attempt_count <= 10;
end;
$$;

-- The browser can only use the guarded RPCs. Direct table access is denied.
alter table public.profiles enable row level security;
alter table public.registration_rate_limits enable row level security;
alter table public.courts enable row level security;
alter table public.equipment enable row level security;
alter table public.court_bookings enable row level security;
alter table public.equipment_bookings enable row level security;

revoke all on public.profiles, public.registration_rate_limits, public.courts, public.equipment, public.court_bookings, public.equipment_bookings from anon, authenticated;
grant all on public.profiles, public.registration_rate_limits, public.courts, public.equipment, public.court_bookings, public.equipment_bookings to service_role;
revoke all on function public.park_state_read() from public;
grant execute on function public.park_state_read() to anon, authenticated;
revoke all on function public.park_claim_registration_slot(text) from public;
grant execute on function public.park_claim_registration_slot(text) to service_role;

