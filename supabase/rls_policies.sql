-- =============================================================================
-- RLS POLICIES — SOČA SAJT
-- Apply once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Re-running is safe: all policies use DROP IF EXISTS before CREATE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS  (security definer — run as function owner, not caller)
-- ---------------------------------------------------------------------------

create or replace function public.get_my_tenant_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select tenant_id from public.user_profiles where user_id = auth.uid();
$$;

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.user_profiles where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- ENABLE RLS ON ALL RELEVANT TABLES
-- ---------------------------------------------------------------------------

alter table public.tenants       enable row level security;
alter table public.items         enable row level security;
alter table public.user_profiles enable row level security;
alter table public.permissions   enable row level security;

-- ---------------------------------------------------------------------------
-- TABLE: public.tenants
-- ---------------------------------------------------------------------------

-- Guest (anon): may only read active tenants
drop policy if exists tenants_anon_read_active on public.tenants;
create policy tenants_anon_read_active
  on public.tenants for select
  to anon
  using (status = 'active');

-- MASTER: full access (create / read / update / delete tenants)
drop policy if exists tenants_master_all on public.tenants;
create policy tenants_master_all
  on public.tenants for all
  to authenticated
  using      (public.get_my_role() = 'MASTER')
  with check (public.get_my_role() = 'MASTER');

-- ---------------------------------------------------------------------------
-- TABLE: public.items
-- ---------------------------------------------------------------------------

-- Guest (anon): read-only, visible rows only (no tenant filter — guest fetches
-- both global rows [tenant_id IS NULL] and tenant rows [tenant_id = ?] in one
-- query; visible=true guard prevents draft/hidden rows leaking)
drop policy if exists items_anon_read_visible on public.items;
create policy items_anon_read_visible
  on public.items for select
  to anon
  using (visible = true);

-- OWNER: read own tenant rows only
drop policy if exists items_owner_read_own on public.items;
create policy items_owner_read_own
  on public.items for select
  to authenticated
  using (tenant_id = public.get_my_tenant_id());

-- OWNER write: own tenant AND only keys listed in permissions table
drop policy if exists items_owner_write_allowed on public.items;
create policy items_owner_write_allowed
  on public.items for insert
  to authenticated
  with check (
    tenant_id = public.get_my_tenant_id()
    and exists (
      select 1 from public.permissions p
      where p.tenant_id    = public.get_my_tenant_id()
        and p.role         = 'OWNER'
        and p.can_edit     = true
        and p.section_key  = items.section_key
        and p.item_key     = items.item_key
    )
  );

drop policy if exists items_owner_update_allowed on public.items;
create policy items_owner_update_allowed
  on public.items for update
  to authenticated
  using (
    tenant_id = public.get_my_tenant_id()
    and exists (
      select 1 from public.permissions p
      where p.tenant_id    = public.get_my_tenant_id()
        and p.role         = 'OWNER'
        and p.can_edit     = true
        and p.section_key  = items.section_key
        and p.item_key     = items.item_key
    )
  )
  with check (
    tenant_id = public.get_my_tenant_id()
    and exists (
      select 1 from public.permissions p
      where p.tenant_id    = public.get_my_tenant_id()
        and p.role         = 'OWNER'
        and p.can_edit     = true
        and p.section_key  = items.section_key
        and p.item_key     = items.item_key
    )
  );

-- MASTER: full access to all items
drop policy if exists items_master_all on public.items;
create policy items_master_all
  on public.items for all
  to authenticated
  using      (public.get_my_role() = 'MASTER')
  with check (public.get_my_role() = 'MASTER');

-- ---------------------------------------------------------------------------
-- TABLE: public.user_profiles
-- ---------------------------------------------------------------------------

-- Any authenticated user: read only their own row
drop policy if exists profiles_read_own on public.user_profiles;
create policy profiles_read_own
  on public.user_profiles for select
  to authenticated
  using (user_id = auth.uid());

-- MASTER: full access (create/read/update profiles for any user)
drop policy if exists profiles_master_all on public.user_profiles;
create policy profiles_master_all
  on public.user_profiles for all
  to authenticated
  using      (public.get_my_role() = 'MASTER')
  with check (public.get_my_role() = 'MASTER');

-- ---------------------------------------------------------------------------
-- TABLE: public.permissions
-- ---------------------------------------------------------------------------

-- OWNER: read permissions for own tenant (useful for client-side display)
drop policy if exists perms_owner_read_own on public.permissions;
create policy perms_owner_read_own
  on public.permissions for select
  to authenticated
  using (tenant_id = public.get_my_tenant_id());

-- MASTER: full access
drop policy if exists perms_master_all on public.permissions;
create policy perms_master_all
  on public.permissions for all
  to authenticated
  using      (public.get_my_role() = 'MASTER')
  with check (public.get_my_role() = 'MASTER');

-- ---------------------------------------------------------------------------
-- SCHEMA / TABLE GRANTS
-- (PostgREST requires explicit grants in addition to RLS policies)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- anon: read-only on the two tables the guest site needs
grant select on public.tenants to anon;
grant select on public.items   to anon;

-- authenticated (OWNER + MASTER): items read+write; profiles+permissions read
grant select, insert, update, delete on public.items         to authenticated;
grant select                         on public.user_profiles to authenticated;
grant select                         on public.permissions   to authenticated;

-- MASTER needs insert/update on user_profiles and permissions for admin ops.
-- These are enforced by RLS; grant the raw privilege here.
grant insert, update, delete on public.user_profiles to authenticated;
grant insert, update, delete on public.permissions   to authenticated;
grant insert, update, delete on public.tenants       to authenticated;
