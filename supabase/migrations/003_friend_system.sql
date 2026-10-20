-- Friend relationships and court play invitations.
-- Existing projects that have already run 001 and 002 should run this migration once.
begin;

create table if not exists public.friendships (
  user_low uuid not null references public.profiles(id) on delete cascade,
  user_high uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low < user_high),
  check (requested_by = user_low or requested_by = user_high)
);
create index if not exists friendships_pending_users_idx
  on public.friendships (user_low, user_high, status);

create table if not exists public.play_invites (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.court_bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (booking_id, receiver_id),
  check (sender_id <> receiver_id)
);
create index if not exists play_invites_receiver_status_idx on public.play_invites (receiver_id, status, created_at desc);
create index if not exists play_invites_sender_idx on public.play_invites (sender_id, created_at desc);

alter table public.friendships enable row level security;
alter table public.play_invites enable row level security;
revoke all on public.friendships, public.play_invites from anon, authenticated;
grant all on public.friendships, public.play_invites to service_role;

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
    'friends', case when caller_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id::text, 'username', p.username) order by lower(p.username))
      from public.friendships f
      join public.profiles p on p.id = case when f.user_low = caller_id then f.user_high else f.user_low end
      where f.status = 'accepted' and caller_id in (f.user_low, f.user_high)
    ), '[]'::jsonb) end,
    'friendRequests', case when caller_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.user_low::text || ':' || f.user_high::text,
        'username', p.username,
        'direction', case when f.requested_by = caller_id then 'outgoing' else 'incoming' end,
        'createdAt', f.created_at
      ) order by f.created_at desc)
      from public.friendships f
      join public.profiles p on p.id = case when f.user_low = caller_id then f.user_high else f.user_low end
      where f.status = 'pending' and caller_id in (f.user_low, f.user_high)
    ), '[]'::jsonb) end,
    'playInvites', case when caller_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id::text,
        'bookingId', b.id,
        'sportId', b.sport_id,
        'court', b.court_number,
        'date', b.booking_date::text,
        'start', b.start_minute,
        'end', b.end_minute,
        'sender', sender.username,
        'receiver', receiver.username,
        'direction', case when i.receiver_id = caller_id then 'incoming' else 'outgoing' end,
        'status', i.status
      ) order by i.created_at desc)
      from public.play_invites i
      join public.court_bookings b on b.id = i.booking_id
      join public.profiles sender on sender.id = i.sender_id
      join public.profiles receiver on receiver.id = i.receiver_id
      where caller_id in (i.sender_id, i.receiver_id)
    ), '[]'::jsonb) end,
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
      'seeded', b.is_sample,
      'isFriend', not b.is_sample and b.user_id is distinct from caller_id and exists (
        select 1 from public.friendships f
        where f.status='accepted' and caller_id in (f.user_low,f.user_high)
          and b.user_id in (f.user_low,f.user_high)
      )
    ) order by b.booking_date, b.start_minute) from public.court_bookings b), '[]'::jsonb),
    'equipmentBookings', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'equipmentId', b.equipment_id,
      'sportId', e.sport_id,
      'date', b.booking_date::text,
      'time', b.pickup_minute,
      'user', case when caller_admin or b.user_id = caller_id then b.username_snapshot else 'member' end,
      'pickedUpAt', case when b.picked_up_at is null then '' else to_char(b.picked_up_at,'HH24:MI') end,
      'staffManaged', b.staff_managed,
      'isFriend', b.user_id is distinct from caller_id and exists (
        select 1 from public.friendships f
        where f.status='accepted' and caller_id in (f.user_low,f.user_high)
          and b.user_id in (f.user_low,f.user_high)
      )
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


revoke all on function public.park_state_read() from public;
grant execute on function public.park_state_read() to anon, authenticated;
revoke all on function public.park_send_friend_request(text) from public;
revoke all on function public.park_respond_friend_request(text,boolean) from public;
revoke all on function public.park_remove_friend(text) from public;
revoke all on function public.park_send_play_invite(text,text) from public;
revoke all on function public.park_respond_play_invite(uuid,boolean) from public;
grant execute on function public.park_send_friend_request(text) to authenticated;
grant execute on function public.park_respond_friend_request(text,boolean) to authenticated;
grant execute on function public.park_remove_friend(text) to authenticated;
grant execute on function public.park_send_play_invite(text,text) to authenticated;
grant execute on function public.park_respond_play_invite(uuid,boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
