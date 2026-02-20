-- ══════════════════════════════════════════════════════════════════════
-- Soča Sajt — Lost & Found: table + RLS + functions
-- Run this once in Supabase SQL Editor.
-- Safe to re-run (idempotent).
-- ══════════════════════════════════════════════════════════════════════

-- 1. Table
create table if not exists public.lost_found_posts (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text        not null,
  message     text        not null,
  tenant_slug text        null,
  location    text        null,
  constraint  lfp_message_length check (char_length(message) between 1 and 500)
);

-- 2. Row Level Security
alter table public.lost_found_posts enable row level security;

-- 3. Anon SELECT: only rows newer than 30 days (RLS hides older rows)
drop policy if exists lfp_anon_read on public.lost_found_posts;
create policy lfp_anon_read on public.lost_found_posts
  for select to anon
  using (created_at > now() - interval '30 days');

-- No direct anon INSERT policy — inserts go through the SECURITY DEFINER function below.

-- 4. Insert function: validates + enforces 3-post-per-email-per-30-days limit
create or replace function public.create_lost_found_post(
  p_email       text,
  p_message     text,
  p_tenant_slug text default null,
  p_location    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(trim(p_email));
  v_message text := trim(p_message);
  v_count   int;
  v_id      uuid;
  v_ts      timestamptz;
begin
  if v_email is null or position('@' in v_email) = 0 then
    raise exception 'INVALID_EMAIL';
  end if;

  if char_length(v_message) < 1 or char_length(v_message) > 500 then
    raise exception 'INVALID_MESSAGE_LENGTH';
  end if;

  select count(*) into v_count
  from public.lost_found_posts
  where email = v_email
    and created_at > now() - interval '30 days';

  if v_count >= 3 then
    raise exception 'LIMIT_REACHED';
  end if;

  insert into public.lost_found_posts (email, message, tenant_slug, location)
  values (v_email, v_message, p_tenant_slug, p_location)
  returning id, created_at into v_id, v_ts;

  return jsonb_build_object('id', v_id, 'created_at', v_ts);
end;
$$;

-- 5. Grant execute to anon (function is the only insert path)
grant execute on function public.create_lost_found_post(text, text, text, text) to anon;

-- 6. Grant SELECT to anon (RLS still applies; hides rows > 30 days)
grant select on public.lost_found_posts to anon;

-- 7. Cleanup function: called from page on load (safe + idempotent)
create or replace function public.cleanup_lost_found_posts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.lost_found_posts
  where created_at <= now() - interval '30 days';
$$;

grant execute on function public.cleanup_lost_found_posts() to anon;
