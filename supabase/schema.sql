create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null default 'Rookie' check (char_length(username) between 1 and 18),
  avatar text not null default '🧗',
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 120 check (coins >= 0),
  completed integer not null default 0 check (completed between 0 and 100),
  streak integer not null default 1 check (streak >= 1),
  last_claim text not null default '',
  hearts integer not null default 3 check (hearts between 0 and 3),
  heart_refill_at timestamptz,
  campaign_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Players can read their own profile'
  ) then
    create policy "Players can read their own profile"
      on public.profiles for select
      to authenticated
      using ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Players can create their own profile'
  ) then
    create policy "Players can create their own profile"
      on public.profiles for insert
      to authenticated
      with check ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Players can update their own profile'
  ) then
    create policy "Players can update their own profile"
      on public.profiles for update
      to authenticated
      using ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end;
$$;

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'profiles_updated_at'
      and tgrelid = 'public.profiles'::regclass
      and not tgisinternal
  ) then
    create trigger profiles_updated_at
      before update on public.profiles
      for each row execute function public.touch_profile_updated_at();
  end if;
end;
$$;

create or replace view public.leaderboard as
  select username, avatar, xp, completed, updated_at
  from public.profiles;

revoke all on public.leaderboard from public;
grant select on public.leaderboard to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
