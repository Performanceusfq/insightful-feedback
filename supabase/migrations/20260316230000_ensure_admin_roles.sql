-- Ensure super admin roles for specified admin accounts
-- jisignacio10@gmail.com and rmunoz@humanreinvention.com

DO $$
DECLARE
  v_user_id uuid;
BEGIN

  -- =========================================================
  -- 1. jisignacio10@gmail.com → admin
  -- =========================================================
  SELECT id INTO v_user_id
    FROM auth.users
   WHERE email = 'jisignacio10@gmail.com'
   LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Ensure profile has active_role = 'admin'
    UPDATE profiles
       SET active_role = 'admin'
     WHERE id = v_user_id
       AND active_role IS DISTINCT FROM 'admin';

    -- Ensure admin role exists in user_roles
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role ensured for jisignacio10@gmail.com (user_id: %)', v_user_id;
  ELSE
    RAISE WARNING 'User jisignacio10@gmail.com not found in auth.users';
  END IF;

  -- =========================================================
  -- 2. rmunoz@humanreinvention.com → admin
  -- =========================================================
  SELECT id INTO v_user_id
    FROM auth.users
   WHERE email = 'rmunoz@humanreinvention.com'
   LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE profiles
       SET active_role = 'admin'
     WHERE id = v_user_id
       AND active_role IS DISTINCT FROM 'admin';

    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role ensured for rmunoz@humanreinvention.com (user_id: %)', v_user_id;
  ELSE
    RAISE WARNING 'User rmunoz@humanreinvention.com not found in auth.users';
  END IF;

END $$;
