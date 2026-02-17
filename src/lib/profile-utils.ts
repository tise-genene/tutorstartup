// Utility function to ensure user profile exists
import { createClient } from "./supabase";

export async function ensureProfileExists() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error("No authenticated user");
  }
  
  // Check if profile exists for THIS user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  
  if (profile) {
    // Profile already exists
    return false;
  }
  
  if (profileError && profileError.code !== "PGRST116") {
    throw profileError;
  }
  
  // Profile doesn't exist, create it
  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      role: user.user_metadata?.role || "STUDENT",
    });
  
  if (insertError) {
    // If it's a duplicate key error, the profile was probably created by another process
    if (insertError.code === "23505") {
      console.log("Profile already exists (created by another process)");
      return false;
    }
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }
  
  return true;
}
