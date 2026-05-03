alter table public.pet_profiles
  add column if not exists current_scene text not null default 'home'
    check (current_scene in ('home', 'bedroom', 'dining', 'wardrobe', 'school')),
  add column if not exists current_outfit text not null default 'pajamas'
    check (current_outfit in ('pajamas', 'day', 'school')),
  add column if not exists activity jsonb,
  add column if not exists last_decay_at timestamptz not null default now();

alter table public.pet_events
  drop constraint if exists pet_events_event_type_check;

alter table public.pet_events
  add constraint pet_events_event_type_check
  check (event_type in ('feed', 'play', 'sleep', 'hug', 'school', 'wardrobe', 'chat'));

alter table public.pet_memories
  drop constraint if exists pet_memories_content_check;

alter table public.pet_memories
  add constraint pet_memories_content_check
  check (char_length(content) <= 4000);

create index if not exists pet_profiles_scene_idx
  on public.pet_profiles (current_scene, updated_at desc);
