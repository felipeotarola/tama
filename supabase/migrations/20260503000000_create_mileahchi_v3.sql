create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id text,
  name text not null default 'Mileahchi',
  hunger int not null default 26 check (hunger between 0 and 100),
  energy int not null default 68 check (energy between 0 and 100),
  happiness int not null default 82 check (happiness between 0 and 100),
  mood text not null default 'idle' check (mood in ('idle', 'happy', 'hungry', 'sleepy', 'playful')),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_profiles_has_owner check (user_id is not null or guest_id is not null)
);

create table if not exists public.pet_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pet_profiles(id) on delete cascade,
  event_type text not null check (event_type in ('feed', 'play', 'sleep', 'hug', 'chat')),
  stat_delta jsonb not null default '{}'::jsonb,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pet_profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (char_length(content) <= 2000),
  mood_snapshot text check (mood_snapshot in ('idle', 'happy', 'hungry', 'sleepy', 'playful')),
  stats_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pet_memories (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pet_profiles(id) on delete cascade,
  memory_type text not null,
  content text not null check (char_length(content) <= 1000),
  importance int not null default 1 check (importance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pet_profiles_user_id_key
  on public.pet_profiles (user_id)
  where user_id is not null;

create unique index if not exists pet_profiles_guest_id_key
  on public.pet_profiles (guest_id)
  where guest_id is not null;

create index if not exists pet_events_pet_id_created_at_idx
  on public.pet_events (pet_id, created_at desc);

create index if not exists chat_messages_pet_id_created_at_idx
  on public.chat_messages (pet_id, created_at desc);

create index if not exists pet_memories_pet_id_importance_idx
  on public.pet_memories (pet_id, importance desc, updated_at desc);

create index if not exists pet_memories_game_state_idx
  on public.pet_memories (pet_id, updated_at desc)
  where memory_type = 'game_state';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists pet_profiles_set_updated_at on public.pet_profiles;
create trigger pet_profiles_set_updated_at
  before update on public.pet_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists pet_memories_set_updated_at on public.pet_memories;
create trigger pet_memories_set_updated_at
  before update on public.pet_memories
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.pet_profiles enable row level security;
alter table public.pet_events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.pet_memories enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "pet_profiles_select_own" on public.pet_profiles;
create policy "pet_profiles_select_own"
  on public.pet_profiles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pet_profiles_insert_own" on public.pet_profiles;
create policy "pet_profiles_insert_own"
  on public.pet_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pet_profiles_update_own" on public.pet_profiles;
create policy "pet_profiles_update_own"
  on public.pet_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pet_events_select_own" on public.pet_events;
create policy "pet_events_select_own"
  on public.pet_events for select
  to authenticated
  using (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = pet_events.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "pet_events_insert_own" on public.pet_events;
create policy "pet_events_insert_own"
  on public.pet_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = pet_events.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = chat_messages.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = chat_messages.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "pet_memories_select_own" on public.pet_memories;
create policy "pet_memories_select_own"
  on public.pet_memories for select
  to authenticated
  using (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = pet_memories.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "pet_memories_manage_own" on public.pet_memories;
create policy "pet_memories_manage_own"
  on public.pet_memories for all
  to authenticated
  using (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = pet_memories.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pet_profiles
      where pet_profiles.id = pet_memories.pet_id
      and pet_profiles.user_id = auth.uid()
    )
  );
