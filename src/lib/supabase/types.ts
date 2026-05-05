export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_email: string | null;
          applicant_full_name: string | null;
          applicant_linkedin: string | null;
          applicant_location: string | null;
          applicant_phone: string | null;
          applicant_portfolio: string | null;
          cover_note: string | null;
          created_at: string;
          id: string;
          job_id: string;
          requires_sponsorship: string;
          resume_url: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          work_authorization: string | null;
          years_experience: string | null;
        };
        Insert: {
          applicant_email?: string | null;
          applicant_full_name?: string | null;
          applicant_linkedin?: string | null;
          applicant_location?: string | null;
          applicant_phone?: string | null;
          applicant_portfolio?: string | null;
          cover_note?: string | null;
          created_at?: string;
          id?: string;
          job_id: string;
          requires_sponsorship?: string;
          resume_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          work_authorization?: string | null;
          years_experience?: string | null;
        };
        Update: {
          applicant_email?: string | null;
          applicant_full_name?: string | null;
          applicant_linkedin?: string | null;
          applicant_location?: string | null;
          applicant_phone?: string | null;
          applicant_portfolio?: string | null;
          cover_note?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string;
          requires_sponsorship?: string;
          resume_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          work_authorization?: string | null;
          years_experience?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          location: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          job_id: string | null;
          last_message_at: string;
          participant_one: string;
          participant_two: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_id?: string | null;
          last_message_at?: string;
          participant_one: string;
          participant_two: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string | null;
          last_message_at?: string;
          participant_one?: string;
          participant_two?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          apply_url: string | null;
          benefits: string[];
          category: string | null;
          company_id: string | null;
          company_logo_url: string | null;
          company_name: string;
          company_size: string | null;
          company_tagline: string | null;
          company_website: string | null;
          created_at: string;
          description: string;
          employment_type: string;
          experience_level: string | null;
          expires_at: string | null;
          id: string;
          latitude: number | null;
          location: string;
          longitude: number | null;
          posted_at: string;
          recruiter_id: string;
          requirements: string[];
          responsibilities: string[];
          salary_currency: string;
          salary_max: number | null;
          salary_min: number | null;
          skills: string[];
          slug: string | null;
          source_id: string | null;
          source_name: string | null;
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
          work_mode: string;
        };
        Insert: {
          apply_url?: string | null;
          benefits?: string[];
          category?: string | null;
          company_id?: string | null;
          company_logo_url?: string | null;
          company_name: string;
          company_size?: string | null;
          company_tagline?: string | null;
          company_website?: string | null;
          created_at?: string;
          description: string;
          employment_type?: string;
          experience_level?: string | null;
          expires_at?: string | null;
          id?: string;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          posted_at?: string;
          recruiter_id: string;
          requirements?: string[];
          responsibilities?: string[];
          salary_currency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          skills?: string[];
          slug?: string | null;
          source_id?: string | null;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at?: string;
          work_mode?: string;
        };
        Update: {
          apply_url?: string | null;
          benefits?: string[];
          category?: string | null;
          company_id?: string | null;
          company_logo_url?: string | null;
          company_name?: string;
          company_size?: string | null;
          company_tagline?: string | null;
          company_website?: string | null;
          created_at?: string;
          description?: string;
          employment_type?: string;
          experience_level?: string | null;
          expires_at?: string | null;
          id?: string;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          posted_at?: string;
          recruiter_id?: string;
          requirements?: string[];
          responsibilities?: string[];
          salary_currency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          skills?: string[];
          slug?: string | null;
          source_id?: string | null;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          title?: string;
          updated_at?: string;
          work_mode?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          application_status_updates: boolean;
          created_at: string;
          daily_job_alerts: boolean;
          employer_messages: boolean;
          hiregeneral_communications: boolean;
          id: string;
          instant_match_alerts: boolean;
          profile_activity: boolean;
          unsubscribed_all: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          application_status_updates?: boolean;
          created_at?: string;
          daily_job_alerts?: boolean;
          employer_messages?: boolean;
          hiregeneral_communications?: boolean;
          id?: string;
          instant_match_alerts?: boolean;
          profile_activity?: boolean;
          unsubscribed_all?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          application_status_updates?: boolean;
          created_at?: string;
          daily_job_alerts?: boolean;
          employer_messages?: boolean;
          hiregeneral_communications?: boolean;
          id?: string;
          instant_match_alerts?: boolean;
          profile_activity?: boolean;
          unsubscribed_all?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          additional_info: string | null;
          created_at: string;
          deleted_at: string | null;
          deletion_requested_at: string | null;
          disability_status: string | null;
          email: string | null;
          ethnicity: string | null;
          full_name: string | null;
          gender: string | null;
          headline: string | null;
          id: string;
          location: string | null;
          phone: string | null;
          resume_url: string | null;
          skills: string[];
          updated_at: string;
          user_id: string;
          user_type: Database["public"]["Enums"]["app_role"];
          veteran_status: string | null;
          visibility: Database["public"]["Enums"]["profile_visibility"];
        };
        Insert: {
          additional_info?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          disability_status?: string | null;
          email?: string | null;
          ethnicity?: string | null;
          full_name?: string | null;
          gender?: string | null;
          headline?: string | null;
          id?: string;
          location?: string | null;
          phone?: string | null;
          resume_url?: string | null;
          skills?: string[];
          updated_at?: string;
          user_id: string;
          user_type?: Database["public"]["Enums"]["app_role"];
          veteran_status?: string | null;
          visibility?: Database["public"]["Enums"]["profile_visibility"];
        };
        Update: {
          additional_info?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          disability_status?: string | null;
          email?: string | null;
          ethnicity?: string | null;
          full_name?: string | null;
          gender?: string | null;
          headline?: string | null;
          id?: string;
          location?: string | null;
          phone?: string | null;
          resume_url?: string | null;
          skills?: string[];
          updated_at?: string;
          user_id?: string;
          user_type?: Database["public"]["Enums"]["app_role"];
          veteran_status?: string | null;
          visibility?: Database["public"]["Enums"]["profile_visibility"];
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          created_at: string;
          id: string;
          job_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      job_applicant_counts: {
        Row: {
          applicant_count: number | null;
          job_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "recruiter" | "job_seeker";
      job_status: "draft" | "published" | "closed";
      profile_visibility: "public" | "private";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "recruiter", "job_seeker"],
      job_status: ["draft", "published", "closed"],
      profile_visibility: ["public", "private"],
    },
  },
} as const;
