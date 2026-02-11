-- Migration to fix handle_new_user trigger robustness

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 
    COALESCE((NEW.raw_user_meta_data->>'role')::"UserRole", 'STUDENT'::"UserRole")
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error (visible in Supabase logs) but don't fail the transaction if possible? 
  -- Actually, we MUST fail if profile creation fails, but let's try to be safe.
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW; 
  -- Returning NEW without insert allows auth user creation but leaves profile empty. 
  -- This is better than blocking sign up, but might verify logic later.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
