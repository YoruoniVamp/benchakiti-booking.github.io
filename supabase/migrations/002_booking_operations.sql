-- Booking and staff operations. All checks run inside Postgres so two people
-- cannot reserve the same court or item at once.

drop function if exists public.park_state_save(jsonb);

create or replace function public.park_make_court_booking(
  p_sport_id text,
  p_court_number smallint,
  p_booking_date date,
  p_start_minute smallint,
  p_end_minute smallint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_name text;
  court_status text;
  local_now timestamp := now() at time zone 'Asia/Bangkok';
  booking_id text := 'q-' || gen_random_uuid()::text;
begin
  select p.username into caller_name from public.profiles p where p.id=caller_id;
  if caller_id is null or caller_name is null then raise exception 'Sign in before making a queue.' using errcode='28000'; end if;
  if p_booking_date < local_now::date then raise exception 'Choose today or a future date.' using errcode='22007'; end if;
  if p_start_minute < 420 or p_end_minute > 1260 or p_end_minute - p_start_minute < 30 then
    raise exception 'Choose a valid time between 7:00 AM and 9:00 PM.' using errcode='22023';
  end if;
  if p_booking_date=local_now::date and p_start_minute < extract(hour from local_now)::integer*60 + extract(minute from local_now)::integer then
    raise exception 'That start time has already passed. Choose a future time.' using errcode='22023';
  end if;
  select c.status into court_status from public.courts c where c.sport_id=p_sport_id and c.court_number=p_court_number;
  if court_status is null then raise exception 'Court not found.' using errcode='P0002'; end if;
  if court_status <> 'open' then raise exception 'This court is out of service. Choose another court.' using errcode='55000'; end if;
  insert into public.court_bookings(id,sport_id,court_number,booking_date,start_minute,end_minute,user_id,username_snapshot)
  values (booking_id,p_sport_id,p_court_number,p_booking_date,p_start_minute,p_end_minute,caller_id,caller_name);
  return booking_id;
end;
$$;

create or replace function public.park_delete_court_booking(p_booking_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_admin boolean := false;
  booking_owner uuid;
  sample_row boolean;
begin
  select p.is_admin into caller_admin from public.profiles p where p.id=caller_id;
  if caller_id is null then raise exception 'Sign in is required.' using errcode='28000'; end if;
  select b.user_id,b.is_sample into booking_owner,sample_row from public.court_bookings b where b.id=p_booking_id;
  if not found then return; end if;
  if not caller_admin and (booking_owner is distinct from caller_id or sample_row) then
    raise exception 'You can only delete your own court queue.' using errcode='42501';
  end if;
  delete from public.court_bookings where id=p_booking_id;
end;
$$;

create or replace function public.park_make_equipment_booking(
  p_equipment_id text,
  p_booking_date date,
  p_pickup_minute smallint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_name text;
  item_status text;
  local_now timestamp := now() at time zone 'Asia/Bangkok';
  booking_id text := 'e-' || gen_random_uuid()::text;
begin
  select p.username into caller_name from public.profiles p where p.id=caller_id;
  if caller_id is null or caller_name is null then raise exception 'Sign in before reserving equipment.' using errcode='28000'; end if;
  if p_booking_date < local_now::date then raise exception 'Choose today or a future date.' using errcode='22007'; end if;
  if p_pickup_minute < 300 or p_pickup_minute > 1260 then raise exception 'Choose a pickup time during park hours.' using errcode='22023'; end if;
  if p_booking_date=local_now::date and p_pickup_minute < extract(hour from local_now)::integer*60 + extract(minute from local_now)::integer then
    raise exception 'That pickup time has passed. Choose a future time.' using errcode='22023';
  end if;
  select e.status into item_status from public.equipment e where e.id=p_equipment_id;
  if item_status is null then raise exception 'Equipment item not found.' using errcode='P0002'; end if;
  if item_status <> 'idle' then raise exception 'This item is not available.' using errcode='55000'; end if;
  insert into public.equipment_bookings(id,equipment_id,booking_date,pickup_minute,user_id,username_snapshot)
  values (booking_id,p_equipment_id,p_booking_date,p_pickup_minute,caller_id,caller_name);
  return booking_id;
end;
$$;

create or replace function public.park_cancel_equipment_booking(p_equipment_id text,p_booking_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_admin boolean := false;
begin
  select p.is_admin into caller_admin from public.profiles p where p.id=caller_id;
  if caller_id is null then raise exception 'Sign in is required.' using errcode='28000'; end if;
  delete from public.equipment_bookings b
    where b.equipment_id=p_equipment_id and b.booking_date=p_booking_date
      and (b.user_id=caller_id or coalesce(caller_admin,false));
  if not found then raise exception 'You cannot cancel this equipment reservation.' using errcode='42501'; end if;
end;
$$;

create or replace function public.park_admin_set_court_status(p_sport_id text,p_court_number smallint,p_closed boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_admin boolean := false;
begin
  select p.is_admin into caller_admin from public.profiles p where p.id=auth.uid();
  if not coalesce(caller_admin,false) then raise exception 'Administrator access is required.' using errcode='42501'; end if;
  update public.courts set status=case when p_closed then 'out_of_service' else 'open' end
    where sport_id=p_sport_id and court_number=p_court_number;
  if not found then raise exception 'Court not found.' using errcode='P0002'; end if;
end;
$$;

create or replace function public.park_admin_set_equipment_status(
  p_equipment_id text,
  p_status text,
  p_username text default null,
  p_booking_date date default null,
  p_pickup_minute smallint default null,
  p_admin_date date default null,
  p_picked_up_at time default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_admin boolean := false;
  assigned_id uuid;
  item_found boolean := false;
begin
  select p.is_admin into caller_admin from public.profiles p where p.id=auth.uid();
  if not coalesce(caller_admin,false) then raise exception 'Administrator access is required.' using errcode='42501'; end if;
  select true into item_found from public.equipment e where e.id=p_equipment_id for update;
  if not coalesce(item_found,false) then raise exception 'Equipment item not found.' using errcode='P0002'; end if;
  if p_status not in ('idle','booked','broken') then raise exception 'Unknown equipment status.' using errcode='22023'; end if;

  if p_status='booked' then
    if p_booking_date is null or p_pickup_minute is null or p_username is null then
      raise exception 'Choose an account, pickup date, and time.' using errcode='22023';
    end if;
    if p_pickup_minute < 300 or p_pickup_minute > 1260 then
      raise exception 'Choose a pickup time between 5:00 AM and 9:00 PM.' using errcode='22023';
    end if;
    if p_picked_up_at is not null and (p_picked_up_at < time '05:00' or p_picked_up_at > time '21:00') then
      raise exception 'Actual pickup time must be between 5:00 AM and 9:00 PM.' using errcode='22023';
    end if;
    select p.id into assigned_id from public.profiles p where lower(p.username)=lower(p_username);
    if assigned_id is null then raise exception 'Choose a valid account.' using errcode='23503'; end if;
    delete from public.equipment_bookings b where b.equipment_id=p_equipment_id
      and b.booking_date in (p_booking_date,coalesce(p_admin_date,p_booking_date));
    insert into public.equipment_bookings(id,equipment_id,booking_date,pickup_minute,picked_up_at,user_id,username_snapshot,staff_managed)
      select 'staff-' || gen_random_uuid()::text,p_equipment_id,p_booking_date,p_pickup_minute,p_picked_up_at,assigned_id,p.username,true
      from public.profiles p where p.id=assigned_id;
    update public.equipment set status='idle' where id=p_equipment_id;
  elsif p_status='idle' then
    delete from public.equipment_bookings b where b.equipment_id=p_equipment_id and b.booking_date=coalesce(p_admin_date,p_booking_date);
    update public.equipment set status='idle' where id=p_equipment_id;
  else
    delete from public.equipment_bookings b where b.equipment_id=p_equipment_id;
    update public.equipment set status='broken' where id=p_equipment_id;
  end if;
end;
$$;

revoke all on function public.park_make_court_booking(text,smallint,date,smallint,smallint) from public;
revoke all on function public.park_delete_court_booking(text) from public;
revoke all on function public.park_make_equipment_booking(text,date,smallint) from public;
revoke all on function public.park_cancel_equipment_booking(text,date) from public;
revoke all on function public.park_admin_set_court_status(text,smallint,boolean) from public;
revoke all on function public.park_admin_set_equipment_status(text,text,text,date,smallint,date,time) from public;
grant execute on function public.park_make_court_booking(text,smallint,date,smallint,smallint) to authenticated;
grant execute on function public.park_delete_court_booking(text) to authenticated;
grant execute on function public.park_make_equipment_booking(text,date,smallint) to authenticated;
grant execute on function public.park_cancel_equipment_booking(text,date) to authenticated;
grant execute on function public.park_admin_set_court_status(text,smallint,boolean) to authenticated;
grant execute on function public.park_admin_set_equipment_status(text,text,text,date,smallint,date,time) to authenticated;
