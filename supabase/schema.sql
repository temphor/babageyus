create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  discord_id text unique not null,
  username text not null,
  avatar text,
  email text,
  roblox_username text,
  webhook_url text,
  discord_access_token text,
  discord_refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.site_stats (
  id int primary key default 1,
  total_hits bigint default 0,
  total_users bigint default 0
);

insert into public.site_stats (id, total_hits, total_users)
values (1, 0, 0)
on conflict (id) do nothing;

create or replace function update_user_count()
returns trigger language plpgsql as $$
begin
  update public.site_stats
  set total_users = (select count(*) from public.users)
  where id = 1;
  return new;
end;
$$;

drop trigger if exists on_user_upsert on public.users;
create trigger on_user_upsert
after insert on public.users
for each row execute procedure update_user_count();

create or replace function increment_hits()
returns void language plpgsql as $$
begin
  update public.site_stats set total_hits = total_hits + 1 where id = 1;
end;
$$;

alter table public.users enable row level security;
alter table public.site_stats enable row level security;

create policy "stats_public_read" on public.site_stats for select using (true);
create policy "users_service_only" on public.users using (false);
