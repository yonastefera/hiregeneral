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
    PostgrestVersion: "14.15";
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
      auth_role_audit_log: {
        Row: {
          created_at: string;
          effective_role: Database["public"]["Enums"]["app_role"];
          event: string;
          id: number;
          requested_role: Database["public"]["Enums"]["app_role"];
          source: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          effective_role: Database["public"]["Enums"]["app_role"];
          event: string;
          id?: never;
          requested_role: Database["public"]["Enums"]["app_role"];
          source: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          effective_role?: Database["public"]["Enums"]["app_role"];
          event?: string;
          id?: never;
          requested_role?: Database["public"]["Enums"]["app_role"];
          source?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      billing_events: {
        Row: {
          attempts: number;
          claim_token: string | null;
          event_type: string;
          id: string;
          last_attempt_at: string;
          last_error: string | null;
          processed_at: string | null;
          status: string;
          stripe_event_id: string;
        };
        Insert: {
          attempts?: number;
          claim_token?: string | null;
          event_type: string;
          id?: string;
          last_attempt_at?: string;
          last_error?: string | null;
          processed_at?: string | null;
          status?: string;
          stripe_event_id: string;
        };
        Update: {
          attempts?: number;
          claim_token?: string | null;
          event_type?: string;
          id?: string;
          last_attempt_at?: string;
          last_error?: string | null;
          processed_at?: string | null;
          status?: string;
          stripe_event_id?: string;
        };
        Relationships: [];
      };
      billing_receipts: {
        Row: {
          amount_paid_cents: number;
          company_id: string;
          created_at: string;
          currency: string;
          description: string | null;
          hosted_invoice_url: string | null;
          id: string;
          invoice_number: string | null;
          invoice_pdf_url: string | null;
          paid_at: string | null;
          stripe_invoice_id: string;
        };
        Insert: {
          amount_paid_cents?: number;
          company_id: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          paid_at?: string | null;
          stripe_invoice_id: string;
        };
        Update: {
          amount_paid_cents?: number;
          company_id?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          paid_at?: string | null;
          stripe_invoice_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_receipts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          account_credit_cents: number;
          active_job_limit: number;
          billing_email: string | null;
          billing_last_event_created: number;
          billing_plan: string;
          boost_credits: number;
          created_at: string;
          current_period_end: string | null;
          description: string | null;
          id: string;
          industry: string | null;
          location: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          size: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string;
          tagline: string | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          account_credit_cents?: number;
          active_job_limit?: number;
          billing_email?: string | null;
          billing_last_event_created?: number;
          billing_plan?: string;
          boost_credits?: number;
          created_at?: string;
          current_period_end?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          size?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          tagline?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          account_credit_cents?: number;
          active_job_limit?: number;
          billing_email?: string | null;
          billing_last_event_created?: number;
          billing_plan?: string;
          boost_credits?: number;
          created_at?: string;
          current_period_end?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          size?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          tagline?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          audience: string;
          company: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          source_path: string | null;
          status: string;
          subject: string | null;
          topic: string;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          audience?: string;
          company?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          source_path?: string | null;
          status?: string;
          subject?: string | null;
          topic?: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          audience?: string;
          company?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          source_path?: string | null;
          status?: string;
          subject?: string | null;
          topic?: string;
          updated_at?: string;
          user_agent?: string | null;
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
      employer_candidate_invites: {
        Row: {
          candidate_id: string;
          created_at: string;
          id: string;
          job_id: string;
          message: string;
          recruiter_id: string;
          status: string;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          id?: string;
          job_id: string;
          message: string;
          recruiter_id: string;
          status?: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          id?: string;
          job_id?: string;
          message?: string;
          recruiter_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employer_candidate_invites_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_boosts: {
        Row: {
          company_id: string;
          created_at: string;
          ends_at: string;
          id: string;
          job_id: string;
          starts_at: string;
          stripe_payment_intent_id: string | null;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          ends_at: string;
          id?: string;
          job_id: string;
          starts_at?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          ends_at?: string;
          id?: string;
          job_id?: string;
          starts_at?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_boosts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_boosts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_enrichments: {
        Row: {
          about_role: string;
          benefits: string[];
          confidence: number;
          created_at: string;
          display_location: string;
          display_title: string;
          enriched_at: string | null;
          error_message: string | null;
          id: string;
          job_id: string;
          location_count: number;
          model: string;
          prompt_version: string;
          quality_flags: string[];
          requirements: string[];
          responsibilities: string[];
          source_updated_at: string | null;
          status: string;
          summary: string;
          updated_at: string;
        };
        Insert: {
          about_role: string;
          benefits?: string[];
          confidence?: number;
          created_at?: string;
          display_location: string;
          display_title: string;
          enriched_at?: string | null;
          error_message?: string | null;
          id?: string;
          job_id: string;
          location_count?: number;
          model: string;
          prompt_version: string;
          quality_flags?: string[];
          requirements?: string[];
          responsibilities?: string[];
          source_updated_at?: string | null;
          status?: string;
          summary: string;
          updated_at?: string;
        };
        Update: {
          about_role?: string;
          benefits?: string[];
          confidence?: number;
          created_at?: string;
          display_location?: string;
          display_title?: string;
          enriched_at?: string | null;
          error_message?: string | null;
          id?: string;
          job_id?: string;
          location_count?: number;
          model?: string;
          prompt_version?: string;
          quality_flags?: string[];
          requirements?: string[];
          responsibilities?: string[];
          source_updated_at?: string | null;
          status?: string;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_enrichments_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_ingestion_runs: {
        Row: {
          company_name: string;
          created_at: string;
          error_message: string | null;
          expired_jobs: number;
          fetched_jobs: number;
          finished_at: string | null;
          id: string;
          rejected_jobs: number;
          source_name: string;
          source_slug: string;
          started_at: string;
          status: string;
          upserted_jobs: number;
          valid_jobs: number;
        };
        Insert: {
          company_name: string;
          created_at?: string;
          error_message?: string | null;
          expired_jobs?: number;
          fetched_jobs?: number;
          finished_at?: string | null;
          id?: string;
          rejected_jobs?: number;
          source_name: string;
          source_slug: string;
          started_at?: string;
          status?: string;
          upserted_jobs?: number;
          valid_jobs?: number;
        };
        Update: {
          company_name?: string;
          created_at?: string;
          error_message?: string | null;
          expired_jobs?: number;
          fetched_jobs?: number;
          finished_at?: string | null;
          id?: string;
          rejected_jobs?: number;
          source_name?: string;
          source_slug?: string;
          started_at?: string;
          status?: string;
          upserted_jobs?: number;
          valid_jobs?: number;
        };
        Relationships: [];
      };
      job_sources: {
        Row: {
          company_domain: string | null;
          company_logo_url: string | null;
          company_name: string;
          created_at: string;
          enabled: boolean;
          id: string;
          metadata: Json;
          notes: string | null;
          source_slug: string;
          source_type: string;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          company_domain?: string | null;
          company_logo_url?: string | null;
          company_name: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          metadata?: Json;
          notes?: string | null;
          source_slug: string;
          source_type: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          company_domain?: string | null;
          company_logo_url?: string | null;
          company_name?: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          metadata?: Json;
          notes?: string | null;
          source_slug?: string;
          source_type?: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          applicant_distance_miles: number;
          apply_url: string | null;
          benefits: string[];
          boost_id: string;
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
          include_relocation: boolean;
          latitude: number | null;
          location: string;
          longitude: number | null;
          notification_email: string | null;
          posted_at: string;
          recruiter_id: string;
          requirements: string[];
          responsibilities: string[];
          salary_currency: string;
          salary_frequency: string;
          salary_max: number | null;
          salary_min: number | null;
          screening_questions: Json;
          search_text: string | null;
          skills: string[];
          slug: string | null;
          source_id: string | null;
          source_name: string | null;
          status: Database["public"]["Enums"]["job_status"];
          street_address: string | null;
          title: string;
          updated_at: string;
          work_mode: string;
        };
        Insert: {
          applicant_distance_miles?: number;
          apply_url?: string | null;
          benefits?: string[];
          boost_id?: string;
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
          include_relocation?: boolean;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          notification_email?: string | null;
          posted_at?: string;
          recruiter_id: string;
          requirements?: string[];
          responsibilities?: string[];
          salary_currency?: string;
          salary_frequency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          screening_questions?: Json;
          search_text?: string | null;
          skills?: string[];
          slug?: string | null;
          source_id?: string | null;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          street_address?: string | null;
          title: string;
          updated_at?: string;
          work_mode?: string;
        };
        Update: {
          applicant_distance_miles?: number;
          apply_url?: string | null;
          benefits?: string[];
          boost_id?: string;
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
          include_relocation?: boolean;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          notification_email?: string | null;
          posted_at?: string;
          recruiter_id?: string;
          requirements?: string[];
          responsibilities?: string[];
          salary_currency?: string;
          salary_frequency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          screening_questions?: Json;
          search_text?: string | null;
          skills?: string[];
          slug?: string | null;
          source_id?: string | null;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          street_address?: string | null;
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
      locations: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          id: number;
          popularity_rank: number;
          state: string;
          zip_code: string | null;
        };
        Insert: {
          city: string;
          country?: string;
          created_at?: string;
          id?: number;
          popularity_rank?: number;
          state: string;
          zip_code?: string | null;
        };
        Update: {
          city?: string;
          country?: string;
          created_at?: string;
          id?: number;
          popularity_rank?: number;
          state?: string;
          zip_code?: string | null;
        };
        Relationships: [];
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
      profile_demographics: {
        Row: {
          created_at: string;
          disability_status: string | null;
          ethnicity: string | null;
          ethnicity_self_describe: string | null;
          gender: string | null;
          gender_self_describe: string | null;
          profile_id: string;
          updated_at: string;
          user_id: string;
          veteran_status: string | null;
        };
        Insert: {
          created_at?: string;
          disability_status?: string | null;
          ethnicity?: string | null;
          ethnicity_self_describe?: string | null;
          gender?: string | null;
          gender_self_describe?: string | null;
          profile_id: string;
          updated_at?: string;
          user_id: string;
          veteran_status?: string | null;
        };
        Update: {
          created_at?: string;
          disability_status?: string | null;
          ethnicity?: string | null;
          ethnicity_self_describe?: string | null;
          gender?: string | null;
          gender_self_describe?: string | null;
          profile_id?: string;
          updated_at?: string;
          user_id?: string;
          veteran_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_demographics_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          achievements: Json;
          additional_info: string | null;
          avatar_file_name: string | null;
          avatar_uploaded_at: string | null;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
          deleted_at: string | null;
          deletion_requested_at: string | null;
          education: Json;
          email: string | null;
          employer_access_consent_at: string | null;
          executive_summary: string | null;
          full_name: string | null;
          headline: string | null;
          highest_degree: string | null;
          id: string;
          industry: string | null;
          level_of_experience: string | null;
          licenses_certifications: Json;
          location: string | null;
          minimum_desired_pay: string | null;
          objective: string | null;
          open_to_relocation: boolean;
          phone: string | null;
          profile_links: Json;
          resume_file_name: string | null;
          resume_file_size: number | null;
          resume_scan_status: string | null;
          resume_uploaded_at: string | null;
          resume_url: string | null;
          skills: string[];
          state: string | null;
          updated_at: string;
          user_id: string;
          user_type: Database["public"]["Enums"]["app_role"];
          visibility: Database["public"]["Enums"]["profile_visibility"];
          work_experience: Json;
          zip_code: string | null;
        };
        Insert: {
          achievements?: Json;
          additional_info?: string | null;
          avatar_file_name?: string | null;
          avatar_uploaded_at?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          education?: Json;
          email?: string | null;
          employer_access_consent_at?: string | null;
          executive_summary?: string | null;
          full_name?: string | null;
          headline?: string | null;
          highest_degree?: string | null;
          id?: string;
          industry?: string | null;
          level_of_experience?: string | null;
          licenses_certifications?: Json;
          location?: string | null;
          minimum_desired_pay?: string | null;
          objective?: string | null;
          open_to_relocation?: boolean;
          phone?: string | null;
          profile_links?: Json;
          resume_file_name?: string | null;
          resume_file_size?: number | null;
          resume_scan_status?: string | null;
          resume_uploaded_at?: string | null;
          resume_url?: string | null;
          skills?: string[];
          state?: string | null;
          updated_at?: string;
          user_id: string;
          user_type?: Database["public"]["Enums"]["app_role"];
          visibility?: Database["public"]["Enums"]["profile_visibility"];
          work_experience?: Json;
          zip_code?: string | null;
        };
        Update: {
          achievements?: Json;
          additional_info?: string | null;
          avatar_file_name?: string | null;
          avatar_uploaded_at?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          education?: Json;
          email?: string | null;
          employer_access_consent_at?: string | null;
          executive_summary?: string | null;
          full_name?: string | null;
          headline?: string | null;
          highest_degree?: string | null;
          id?: string;
          industry?: string | null;
          level_of_experience?: string | null;
          licenses_certifications?: Json;
          location?: string | null;
          minimum_desired_pay?: string | null;
          objective?: string | null;
          open_to_relocation?: boolean;
          phone?: string | null;
          profile_links?: Json;
          resume_file_name?: string | null;
          resume_file_size?: number | null;
          resume_scan_status?: string | null;
          resume_uploaded_at?: string | null;
          resume_url?: string | null;
          skills?: string[];
          state?: string | null;
          updated_at?: string;
          user_id?: string;
          user_type?: Database["public"]["Enums"]["app_role"];
          visibility?: Database["public"]["Enums"]["profile_visibility"];
          work_experience?: Json;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      salary_benchmarks: {
        Row: {
          annual_mean: number | null;
          annual_median: number | null;
          annual_p10: number | null;
          annual_p25: number | null;
          annual_p75: number | null;
          annual_p90: number | null;
          area_code: string;
          area_name: string;
          area_type: string;
          created_at: string;
          employment: number | null;
          hourly_median: number | null;
          id: string;
          occupation_code: string;
          occupation_name: string;
          occupation_search_text: string | null;
          release_period: string;
          release_year: number;
          source_name: string;
          source_url: string;
          state_code: string | null;
          updated_at: string;
        };
        Insert: {
          annual_mean?: number | null;
          annual_median?: number | null;
          annual_p10?: number | null;
          annual_p25?: number | null;
          annual_p75?: number | null;
          annual_p90?: number | null;
          area_code: string;
          area_name: string;
          area_type: string;
          created_at?: string;
          employment?: number | null;
          hourly_median?: number | null;
          id?: string;
          occupation_code: string;
          occupation_name: string;
          occupation_search_text?: string | null;
          release_period: string;
          release_year: number;
          source_name?: string;
          source_url?: string;
          state_code?: string | null;
          updated_at?: string;
        };
        Update: {
          annual_mean?: number | null;
          annual_median?: number | null;
          annual_p10?: number | null;
          annual_p25?: number | null;
          annual_p75?: number | null;
          annual_p90?: number | null;
          area_code?: string;
          area_name?: string;
          area_type?: string;
          created_at?: string;
          employment?: number | null;
          hourly_median?: number | null;
          id?: string;
          occupation_code?: string;
          occupation_name?: string;
          occupation_search_text?: string | null;
          release_period?: string;
          release_year?: number;
          source_name?: string;
          source_url?: string;
          state_code?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      salary_bls_oews: {
        Row: {
          annual_mean: number | null;
          annual_median: number | null;
          annual_p10: number | null;
          annual_p25: number | null;
          annual_p75: number | null;
          annual_p90: number | null;
          area_code: string;
          area_name: string;
          area_type: string;
          created_at: string;
          employment: number | null;
          hourly_median: number | null;
          id: string;
          occupation_code: string;
          occupation_name: string;
          occupation_search_text: string | null;
          release_period: string;
          release_year: number;
          source_url: string;
          state_code: string | null;
          updated_at: string;
        };
        Insert: {
          annual_mean?: number | null;
          annual_median?: number | null;
          annual_p10?: number | null;
          annual_p25?: number | null;
          annual_p75?: number | null;
          annual_p90?: number | null;
          area_code: string;
          area_name: string;
          area_type: string;
          created_at?: string;
          employment?: number | null;
          hourly_median?: number | null;
          id?: string;
          occupation_code: string;
          occupation_name: string;
          occupation_search_text?: string | null;
          release_period: string;
          release_year: number;
          source_url?: string;
          state_code?: string | null;
          updated_at?: string;
        };
        Update: {
          annual_mean?: number | null;
          annual_median?: number | null;
          annual_p10?: number | null;
          annual_p25?: number | null;
          annual_p75?: number | null;
          annual_p90?: number | null;
          area_code?: string;
          area_name?: string;
          area_type?: string;
          created_at?: string;
          employment?: number | null;
          hourly_median?: number | null;
          id?: string;
          occupation_code?: string;
          occupation_name?: string;
          occupation_search_text?: string | null;
          release_period?: string;
          release_year?: number;
          source_url?: string;
          state_code?: string | null;
          updated_at?: string;
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
      schools: {
        Row: {
          city: string | null;
          created_at: string;
          id: string;
          name: string;
          popularity_rank: number;
          source: string;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          id: string;
          name: string;
          popularity_rank?: number;
          source?: string;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          popularity_rank?: number;
          source?: string;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      security_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string;
          created_at: string;
          id: string;
          metadata: Json;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [];
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
      append_security_audit: {
        Args: {
          p_action: string;
          p_metadata?: Json;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: undefined;
      };
      apply_company_billing_event: {
        Args: {
          p_active_job_limit: number;
          p_company_id: string;
          p_current_period_end: string;
          p_customer_id: string;
          p_event_created: number;
          p_plan: string;
          p_status: string;
          p_subscription_id: string;
        };
        Returns: boolean;
      };
      assign_initial_role: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_source: string;
          p_user_id: string;
        };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      claim_billing_event: {
        Args: { p_event_type: string; p_stripe_event_id: string };
        Returns: string;
      };
      current_employer_entitlements: { Args: never; Returns: Json };
      finish_billing_event: {
        Args: {
          p_claim_token: string;
          p_status: string;
          p_stripe_event_id: string;
        };
        Returns: boolean;
      };
      get_hiring_companies_this_week: {
        Args: { p_limit?: number };
        Returns: {
          company_logo_url: string | null;
          company_name: string | null;
          company_size: string | null;
          company_website: string | null;
          has_remote: boolean | null;
          industry: string | null;
          new_roles: number;
          roles: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_service_role: { Args: never; Returns: boolean };
      prune_stale_operational_data: { Args: never; Returns: Json };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
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
