export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      class_event_questions: {
        Row: {
          created_at: string
          event_id: string
          position: number
          question_id: string
          source: Database["public"]["Enums"]["event_question_source"]
        }
        Insert: {
          created_at?: string
          event_id: string
          position: number
          question_id: string
          source: Database["public"]["Enums"]["event_question_source"]
        }
        Update: {
          created_at?: string
          event_id?: string
          position?: number
          question_id?: string
          source?: Database["public"]["Enums"]["event_question_source"]
        }
        Relationships: [
          {
            foreignKeyName: "class_event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "class_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_event_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_events: {
        Row: {
          course_id: string
          created_at: string
          event_config_id: string
          expires_at: string
          id: string
          qr_code: string
          status: Database["public"]["Enums"]["event_status"]
          survey_config_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          event_config_id: string
          expires_at: string
          id?: string
          qr_code: string
          status?: Database["public"]["Enums"]["event_status"]
          survey_config_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          event_config_id?: string
          expires_at?: string
          id?: string
          qr_code?: string
          status?: Database["public"]["Enums"]["event_status"]
          survey_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_events_event_config_id_fkey"
            columns: ["event_config_id"]
            isOneToOne: false
            referencedRelation: "event_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_events_survey_config_id_fkey"
            columns: ["survey_config_id"]
            isOneToOne: false
            referencedRelation: "survey_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          department_id: string
          id: string
          name: string
          professor_id: string
          semester: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          id?: string
          name: string
          professor_id: string
          semester: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          id?: string
          name?: string
          professor_id?: string
          semester?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professors"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          coordinator_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          coordinator_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          coordinator_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_configs: {
        Row: {
          active: boolean
          course_id: string
          created_at: string
          expiration_minutes: number
          frequency: Database["public"]["Enums"]["event_frequency"]
          id: string
          scheduled_days: number[]
          scheduled_time: string
          survey_config_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          course_id: string
          created_at?: string
          expiration_minutes: number
          frequency: Database["public"]["Enums"]["event_frequency"]
          id?: string
          scheduled_days?: number[]
          scheduled_time: string
          survey_config_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          course_id?: string
          created_at?: string
          expiration_minutes?: number
          frequency?: Database["public"]["Enums"]["event_frequency"]
          id?: string
          scheduled_days?: number[]
          scheduled_time?: string
          survey_config_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_configs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_configs_survey_config_id_fkey"
            columns: ["survey_config_id"]
            isOneToOne: false
            referencedRelation: "survey_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      professors: {
        Row: {
          created_at: string
          department_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          department_id: string | null
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          department_id?: string | null
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          department_id?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["question_category"]
          created_at: string
          id: string
          likert_scale: number | null
          options: Json | null
          required: boolean
          text: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["question_category"]
          created_at?: string
          id?: string
          likert_scale?: number | null
          options?: Json | null
          required?: boolean
          text: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["question_category"]
          created_at?: string
          id?: string
          likert_scale?: number | null
          options?: Json | null
          required?: boolean
          text?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: []
      }
      response_receipts: {
        Row: {
          event_id: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          event_id: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          event_id?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_receipts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "class_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          answers: Json
          event_id: string
          id: string
          submitted_at: string
        }
        Insert: {
          answers: Json
          event_id: string
          id?: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          event_id?: string
          id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "class_events"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_configs: {
        Row: {
          active: boolean
          course_id: string
          created_at: string
          id: string
          name: string
          random_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          course_id: string
          created_at?: string
          id?: string
          name: string
          random_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          random_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_configs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_fixed_questions: {
        Row: {
          created_at: string
          position: number
          question_id: string
          survey_config_id: string
        }
        Insert: {
          created_at?: string
          position: number
          question_id: string
          survey_config_id: string
        }
        Update: {
          created_at?: string
          position?: number
          question_id?: string
          survey_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_fixed_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_fixed_questions_survey_config_id_fkey"
            columns: ["survey_config_id"]
            isOneToOne: false
            referencedRelation: "survey_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_random_questions: {
        Row: {
          created_at: string
          question_id: string
          survey_config_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          survey_config_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          survey_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_random_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_random_questions_survey_config_id_fkey"
            columns: ["survey_config_id"]
            isOneToOne: false
            referencedRelation: "survey_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_course: { Args: { p_course_id: string }; Returns: boolean }
      generate_class_event: {
        Args: { p_course_id: string }
        Returns: {
          event_id: string
          expires_at: string
          qr_code: string
          status: Database["public"]["Enums"]["event_status"]
        }[]
      }
      generate_unique_qr_code: { Args: never; Returns: string }
      has_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      submit_event_response: {
        Args: { p_answers: Json; p_qr_code: string }
        Returns: {
          response_id: string
          status: string
          submitted_at: string
        }[]
      }
    }
    Enums: {
      app_role: "estudiante" | "profesor" | "admin" | "coordinador" | "director"
      event_frequency:
        | "per_class"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "manual"
      event_question_source: "fixed" | "random"
      event_status: "scheduled" | "active" | "expired" | "cancelled"
      question_category:
        | "pedagogia"
        | "contenido"
        | "evaluacion"
        | "comunicacion"
        | "general"
      question_type: "likert" | "open" | "multiple_choice"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["estudiante", "profesor", "admin", "coordinador", "director"],
      event_frequency: ["per_class", "weekly", "biweekly", "monthly", "manual"],
      event_question_source: ["fixed", "random"],
      event_status: ["scheduled", "active", "expired", "cancelled"],
      question_category: [
        "pedagogia",
        "contenido",
        "evaluacion",
        "comunicacion",
        "general",
      ],
      question_type: ["likert", "open", "multiple_choice"],
    },
  },
} as const
