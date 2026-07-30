import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * mentor_students.mentor_id, mentor_feedback.mentor_id, and (after
 * supabase/fix-mentorship-requests-fk.sql) mentorship_requests.mentor_id
 * are all foreign keys to mentors.id — NOT to the mentor's auth/users id.
 * Always resolve the real mentors.id through this helper before touching
 * any of those three tables.
 *
 * Returns null if the logged-in user doesn't have a mentors row yet.
 */
export async function getMentorRowId(
  supabase: SupabaseClient,
  authUserId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("mentors")
    .select("id")
    .eq("user_id", authUserId)
    .single();

  if (error || !data) return null;
  return data.id as string;
}
