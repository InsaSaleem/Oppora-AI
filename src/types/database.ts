export type UserRole = "student" | "mentor" | "admin";
export type OpportunityType =
  | "internship" | "scholarship" | "job" | "competition" | "conference"
  | "hackathon" | "research" | "exchange_program" | "bootcamp" | "fellowship";
export type OpportunityStatus = "draft" | "published" | "closed" | "archived";
export type ApplicationStatus = "applied" | "pending" | "interview" | "rejected" | "accepted" | "archived";
export type NotificationType = "deadline_alert" | "application_update" | "mentor_feedback" | "ai_recommendation" | "system";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  semester: number | null;
  cgpa: number | null;
  skills: string[] | null;
  experience: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_updated_at: string | null;
}

export interface OpportunityRow {
  id: string;
  title: string;
  description: string;
  company: string | null;
  type: OpportunityType;
  location: string | null;
  is_remote: boolean;
  deadline: string;
  category: string | null;
  requirements: string[] | null;
  required_skills: string[] | null;
  status: OpportunityStatus;
  created_at: string;
}

export interface ApplicationRow {
  id: string;
  student_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  notes: string | null;
  applied_date: string;
}

export interface AiRecommendationRow {
  id: string;
  student_id: string;
  opportunity_id: string;
  score: number;
  reason: string | null;
  is_dismissed: boolean;
  opportunities?: OpportunityRow;
}

export interface AiResumeAnalysisRow {
  id: string;
  student_id: string;
  overall_score: number | null;
  extracted_skills: string[] | null;
  suggestions: string[] | null;
  created_at: string;
}

export interface SavedOpportunityRow {
  id: string;
  student_id: string;
  opportunity_id: string;
  saved_at: string;
  opportunities?: OpportunityRow;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MentorshipRow {
  id: string;
  mentor_id: string;
  student_id: string;
  status: "active" | "completed" | "paused";
  started_at: string;
  users?: UserRow;
}

export interface MentorFeedbackRow {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users?: UserRow;
}

// Minimal Database type placeholder so createBrowserClient<Database> / createServerClient<Database>
// have something to satisfy generics with. Replace with `supabase gen types typescript` output
// once your schema stabilizes, for full type-safety on every table/column.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
