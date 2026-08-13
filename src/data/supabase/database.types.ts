export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id: string; display_name: string; role: 'patient' | 'practitioner'; created_at: string }; Insert: { id: string; display_name: string; role: 'patient' | 'practitioner' }; Update: { display_name?: string } };
      nutrition_plans: { Row: { id: string; patient_id: string; title: string; active: boolean; created_at: string }; Insert: { patient_id: string; title: string; active?: boolean }; Update: { title?: string; active?: boolean } };
      daily_logs: { Row: { id: string; patient_id: string; log_date: string; created_at: string }; Insert: { patient_id: string; log_date: string }; Update: never };
      meal_logs: { Row: { id: string; daily_log_id: string; meal_key: string; status: string; macros: Json; recorded_at: string }; Insert: { daily_log_id: string; meal_key: string; status: string; macros: Json }; Update: { status?: string; macros?: Json } };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
