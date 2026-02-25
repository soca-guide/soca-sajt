-- ─────────────────────────────────────────────────────────────────────────────
-- OWNER INVITE SYSTEM — radi BEZ Edge Function deploymenta
--
-- Pokretati u Supabase SQL Editor (jednom)
--
-- Kako radi:
--   1. Admin kreira apartman → JS ubacuje red u pending_owner_invites
--   2. JS zove sb.auth.signInWithOtp() → Supabase šalje magic-link vlasniku
--   3. Trigger na auth.users (AFTER INSERT) automatski:
--        - kreira user_profiles (OWNER, tenant_id)
--        - ubacuje permissions
--        - briše pending red
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Tabela za čekanje pozivnica
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pending_owner_invites (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL UNIQUE,
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poi_email_idx
  ON public.pending_owner_invites (LOWER(email));

ALTER TABLE public.pending_owner_invites ENABLE ROW LEVEL SECURITY;

-- MASTER može sve
DROP POLICY IF EXISTS poi_master_all ON public.pending_owner_invites;
CREATE POLICY poi_master_all
  ON public.pending_owner_invites FOR ALL TO authenticated
  USING      (public.get_my_role() = 'MASTER')
  WITH CHECK (public.get_my_role() = 'MASTER');


-- 2) Funkcija koja se pokreće kada novi user uđe u auth.users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_link_pending_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Traži pending invite po emailu
  SELECT tenant_id INTO v_tenant_id
  FROM public.pending_owner_invites
  WHERE LOWER(email) = LOWER(NEW.email)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN NEW; -- Nema pending invite, ništa ne radi
  END IF;

  -- Kreiraj user_profiles
  INSERT INTO public.user_profiles (user_id, role, tenant_id, email, disabled)
  VALUES (NEW.id, 'OWNER', v_tenant_id, LOWER(NEW.email), false)
  ON CONFLICT (user_id) DO UPDATE
    SET role      = 'OWNER',
        tenant_id = v_tenant_id,
        disabled  = false;

  -- Ubaci permissions
  INSERT INTO public.permissions
    (tenant_id, role, section_key, item_key, can_view, can_edit)
  VALUES
    (v_tenant_id, 'OWNER', 'info',        'default_config',      true, true),
    (v_tenant_id, 'OWNER', 'parking',     'parking_recommended', true, true),
    (v_tenant_id, 'OWNER', 'house_rules', 'house_rules_private', true, true),
    (v_tenant_id, 'OWNER', 'booking',     'rebook',              true, true),
    (v_tenant_id, 'OWNER', 'biznis',      'owner_config',        true, true)
  ON CONFLICT (tenant_id, role, section_key, item_key) DO NOTHING;

  -- Obriši pending red
  DELETE FROM public.pending_owner_invites
  WHERE LOWER(email) = LOWER(NEW.email);

  RETURN NEW;
END;
$$;

-- 3) Trigger na auth.users INSERT
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS auto_link_owner_trigger ON auth.users;
CREATE TRIGGER auto_link_owner_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_pending_owner();


-- 4) RPC: pošalji/pošalji ponovo login link za postojećeg ownera
--    (za "Pošalji login link" dugme u admin panelu)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resend_owner_invite(
  p_email     text,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id uuid;
  v_user_profile     public.user_profiles%ROWTYPE;
BEGIN
  -- Provjeri da caller ima MASTER rolu
  IF public.get_my_role() <> 'MASTER' THEN
    RETURN jsonb_build_object('error', 'Forbidden');
  END IF;

  -- Provjeri da li user već postoji
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    -- User postoji: osiguraj da ima profile i permissions
    INSERT INTO public.user_profiles (user_id, role, tenant_id, email, disabled)
    VALUES (v_existing_user_id, 'OWNER', p_tenant_id, LOWER(p_email), false)
    ON CONFLICT (user_id) DO UPDATE
      SET role      = 'OWNER',
          tenant_id = p_tenant_id,
          disabled  = false;

    INSERT INTO public.permissions
      (tenant_id, role, section_key, item_key, can_view, can_edit)
    VALUES
      (p_tenant_id, 'OWNER', 'info',        'default_config',      true, true),
      (p_tenant_id, 'OWNER', 'parking',     'parking_recommended', true, true),
      (p_tenant_id, 'OWNER', 'house_rules', 'house_rules_private', true, true),
      (p_tenant_id, 'OWNER', 'booking',     'rebook',              true, true),
      (p_tenant_id, 'OWNER', 'biznis',      'owner_config',        true, true)
    ON CONFLICT (tenant_id, role, section_key, item_key) DO NOTHING;

    RETURN jsonb_build_object('ok', true, 'existing_user', true, 'user_id', v_existing_user_id);
  ELSE
    -- User ne postoji: kreiraj/obnovi pending invite
    INSERT INTO public.pending_owner_invites (email, tenant_id)
    VALUES (LOWER(p_email), p_tenant_id)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('ok', true, 'existing_user', false, 'pending', true);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resend_owner_invite(text, uuid) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5) OPCIONALNO: Welcome email webhook
--
-- Kada je send-email Edge Function deployovana, dodaj Database Webhook u
-- Supabase Dashboard → Database → Webhooks:
--
--   Name:    owner-welcome-email
--   Table:   pending_owner_invites
--   Events:  INSERT
--   URL:     https://hkztanenhxoducivluor.supabase.co/functions/v1/send-email
--   Headers: x-webhook-secret: <tvoj WEBHOOK_SECRET>
--
-- Webhook payload automatski uključuje `record` sa email i tenant_id.
-- send-email funkcija čita tenant_name iz payload-a ako postoji, inače koristi tenant_id.
--
-- Da bi tenant_name bio dostupan u webhook payloadu, možeš koristiti view:
-- ─────────────────────────────────────────────────────────────────────────────

-- Pomocni view koji obogacuje pending_owner_invites sa tenant info
-- (Supabase webhook šalje podatke iz tabele, ne iz view-a — webhook treba biti na tabeli)
-- Preporuka: kada deploy send-email, dodaj webhook kako je opisano gore.
