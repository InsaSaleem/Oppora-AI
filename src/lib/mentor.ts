import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * mentor_students.mentor_id and mentor_feedback.mentor_id are foreign keys
 * to mentors.id — NOT to the mentor's auth/users id. (mentorship_requests.mentor_id
 * is the one table where mentor_id IS the auth id, which is what makes this
 * confusing.) Always resolve the real mentors.id through this helper before
 * touching mentor_students or mentor_feedback.
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
