export interface Submission {
  id: string;
  google_user_id: string;
  google_email: string;
  full_name: string;
  registration_number: string;
  phone_number: string;
  form_four_index_number: string;
  declaration_accepted: boolean;
  submitted_at: string;
  status: string;
}

export interface AppConfig {
  deadline: string; // ISO timestamp
  minister_name: string;
  minister_phone: string;
  deputy_minister_name: string;
  deputy_minister_phone: string;
  secretary_name: string;
  secretary_phone: string;
  contact_email: string;
  announcement_text: string;
  organization_name: string;
  logo_url: string | null;
}
