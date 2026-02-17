-- Migration: Fix missing profiles for existing users
-- Created: 2026-02-14
-- Description: Ensures all auth.users have corresponding profiles

-- 1. First, let's create profiles for any existing auth users that don't have one
INSERT INTO public.profiles (id, email, name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  COALESCE((u.raw_user_meta_data->>'role')::"UserRole", 'STUDENT')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. Ensure the trigger function handles edge cases better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists (idempotent)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::"UserRole", 'STUDENT')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create a function to manually create a profile (useful for edge cases)
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- This can be called manually if needed
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      (SELECT COALESCE(raw_user_meta_data->>'name', email) FROM auth.users WHERE id = auth.uid()),
      COALESCE((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()), 'STUDENT')::"UserRole"
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add RLS policy to allow users to create their own profile if missing
CREATE POLICY "Users can create their own profile if missing" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 6. Verify all users have profiles
DO $$
DECLARE
  v_missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  IF v_missing_count > 0 THEN
    RAISE NOTICE 'Warning: % users still missing profiles', v_missing_count;
  ELSE
    RAISE NOTICE 'All users have profiles - good!';
  END IF;
END $$;
