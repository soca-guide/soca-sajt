-- Migration: pending_owner_invites — idempotent
-- Run in Supabase SQL Editor (or via supabase db push)

-- 1. Create table if it does not exist
CREATE TABLE IF NOT EXISTS public.pending_owner_invites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email      text        NOT NULL,
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pending'
);

-- 2. Add status column if table exists but column is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'pending_owner_invites'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.pending_owner_invites ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
END$$;

-- 3. Unique constraint on (email, tenant_id) for upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'pending_owner_invites'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'pending_owner_invites_email_tenant_id_key'
  ) THEN
    ALTER TABLE public.pending_owner_invites
      ADD CONSTRAINT pending_owner_invites_email_tenant_id_key UNIQUE (email, tenant_id);
  END IF;
END$$;

-- 4. RLS: MASTER can SELECT; INSERT/UPDATE only via service role (edge function)
ALTER TABLE public.pending_owner_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poi_master_select" ON public.pending_owner_invites;
CREATE POLICY "poi_master_select" ON public.pending_owner_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'MASTER'
    )
  );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_poi_tenant_id ON public.pending_owner_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_poi_email     ON public.pending_owner_invites(email);
