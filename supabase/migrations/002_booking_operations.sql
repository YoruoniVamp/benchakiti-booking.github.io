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

create or replace function public.park_send_friend_request(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_id uuid;
  low_id uuid;
  high_id uuid;
  existing_status text;
  existing_requester uuid;
begin
  if caller_id is null then raise exception 'Sign in to add friends.' using errcode='28000'; end if;
  select p.id into target_id from public.profiles p where lower(p.username)=lower(trim(p_username));
  if target_id is null then raise exception 'No account was found with that username.' using errcode='P0002'; end if;
  if target_id=caller_id then raise exception 'You cannot add yourself as a friend.' using errcode='22023'; end if;
  low_id := least(caller_id,target_id);
  high_id := greatest(caller_id,target_id);

  insert into public.friendships(user_low,user_high,requested_by,status)
  values (low_id,high_id,caller_id,'pending')
  on conflict (user_low,user_high) do nothing;
  if found then return 'sent'; end if;

  select f.status,f.requested_by into existing_status,existing_requester
    from public.friendships f where f.user_low=low_id and f.user_high=high_id for update;
  if existing_status='accepted' then raise exception 'You are already friends with this user.' using errcode='23505'; end if;
  if existing_requester=caller_id then raise exception 'A friend request is already pending.' using errcode='23505'; end if;
  update public.friendships set status='accepted',updated_at=now()
    where user_low=low_id and user_high=high_id and status='pending';
  return 'accepted';
end;
$$;

create or replace function public.park_respond_friend_request(p_username text,p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  requester_id uuid;
  low_id uuid;
  high_id uuid;
begin
  if caller_id is null then raise exception 'Sign in to manage friend requests.' using errcode='28000'; end if;
  select p.id into requester_id from public.profiles p where lower(p.username)=lower(trim(p_username));
  if requester_id is null or requester_id=caller_id then raise exception 'Friend request not found.' using errcode='P0002'; end if;
  low_id := least(caller_id,requester_id);
  high_id := greatest(caller_id,requester_id);
  if p_accept then
    update public.friendships set status='accepted',updated_at=now()
      where user_low=low_id and user_high=high_id and requested_by=requester_id and status='pending';
  else
    delete from public.friendships
      where user_low=low_id and user_high=high_id and requested_by=requester_id and status='pending';
  end if;
  if not found then raise exception 'Friend request is no longer pending.' using errcode='P0002'; end if;
end;
$$;

create or replace function public.park_remove_friend(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  friend_id uuid;
begin
  if caller_id is null then raise exception 'Sign in to manage friends.' using errcode='28000'; end if;
  select p.id into friend_id from public.profiles p where lower(p.username)=lower(trim(p_username));
  if friend_id is null or friend_id=caller_id then raise exception 'Friend not found.' using errcode='P0002'; end if;
  delete from public.friendships f
    where f.status='accepted' and f.user_low=least(caller_id,friend_id) and f.user_high=greatest(caller_id,friend_id);
  if not found then raise exception 'Friend relationship not found.' using errcode='P0002'; end if;
end;
$$;

create or replace function public.park_send_play_invite(p_booking_id text,p_friend_username text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  friend_id uuid;
  booking_owner uuid;
  sample_row boolean;
  friendship_exists boolean;
  existing_status text;
  invite_id uuid;
begin
  if caller_id is null then raise exception 'Sign in to invite a friend.' using errcode='28000'; end if;
  select p.id into friend_id from public.profiles p where lower(p.username)=lower(trim(p_friend_username));
  if friend_id is null or friend_id=caller_id then raise exception 'Friend not found.' using errcode='P0002'; end if;
  select b.user_id,b.is_sample into booking_owner,sample_row from public.court_bookings b where b.id=p_booking_id;
  if not found or booking_owner is distinct from caller_id or sample_row then
    raise exception 'You can only invite friends to your own court queue.' using errcode='42501';
  end if;
  select exists(select 1 from public.friendships f where f.status='accepted'
    and f.user_low=least(caller_id,friend_id) and f.user_high=greatest(caller_id,friend_id)) into friendship_exists;
  if not friendship_exists then raise exception 'You can only invite an accepted friend.' using errcode='42501'; end if;

  select i.id,i.status into invite_id,existing_status from public.play_invites i
    where i.booking_id=p_booking_id and i.receiver_id=friend_id for update;
  if existing_status in ('pending','accepted') then raise exception 'This friend has already been invited.' using errcode='23505'; end if;
  if invite_id is null then
    insert into public.play_invites(booking_id,sender_id,receiver_id,status)
      values (p_booking_id,caller_id,friend_id,'pending') returning id into invite_id;
  else
    update public.play_invites set sender_id=caller_id,status='pending',created_at=now()
      where id=invite_id returning id into invite_id;
  end if;
  return invite_id;
end;
$$;

create or replace function public.park_respond_play_invite(p_invite_id uuid,p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to respond to an invitation.' using errcode='28000'; end if;
  update public.play_invites set status=case when p_accept then 'accepted' else 'declined' end
    where id=p_invite_id and receiver_id=auth.uid() and status='pending';
  if not found then raise exception 'Invitation is no longer available.' using errcode='P0002'; end if;
end;
$$;

revoke all on function public.park_make_court_booking(text,smallint,date,smallint,smallint) from public;
revoke all on function public.park_delete_court_booking(text) from public;
revoke all on function public.park_make_equipment_booking(text,date,smallint) from public;
revoke all on function public.park_cancel_equipment_booking(text,date) from public;
revoke all on function public.park_admin_set_court_status(text,smallint,boolean) from public;
revoke all on function public.park_admin_set_equipment_status(text,text,text,date,smallint,date,time) from public;
revoke all on function public.park_send_friend_request(text) from public;
revoke all on function public.park_respond_friend_request(text,boolean) from public;
revoke all on function public.park_remove_friend(text) from public;
revoke all on function public.park_send_play_invite(text,text) from public;
revoke all on function public.park_respond_play_invite(uuid,boolean) from public;
grant execute on function public.park_make_court_booking(text,smallint,date,smallint,smallint) to authenticated;
grant execute on function public.park_delete_court_booking(text) to authenticated;
grant execute on function public.park_make_equipment_booking(text,date,smallint) to authenticated;
grant execute on function public.park_cancel_equipment_booking(text,date) to authenticated;
grant execute on function public.park_admin_set_court_status(text,smallint,boolean) to authenticated;
grant execute on function public.park_admin_set_equipment_status(text,text,text,date,smallint,date,time) to authenticated;
grant execute on function public.park_send_friend_request(text) to authenticated;
grant execute on function public.park_respond_friend_request(text,boolean) to authenticated;
grant execute on function public.park_remove_friend(text) to authenticated;
grant execute on function public.park_send_play_invite(text,text) to authenticated;
grant execute on function public.park_respond_play_invite(uuid,boolean) to authenticated;
