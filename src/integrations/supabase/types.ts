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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          age_group: string | null
          created_at: string | null
          daily_message_count: number | null
          full_name: string | null
          gender_identity: string | null
          id: string
          last_message_date: string | null
          pro_subscription_ends_at: string | null
          pro_subscription_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          daily_message_count?: number | null
          full_name?: string | null
          gender_identity?: string | null
          id: string
          last_message_date?: string | null
          pro_subscription_ends_at?: string | null
          pro_subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          daily_message_count?: number | null
          full_name?: string | null
          gender_identity?: string | null
          id?: string
          last_message_date?: string | null
          pro_subscription_ends_at?: string | null
          pro_subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          age_group: string | null
          created_at: string | null
          current_mood_scales: Json | null
          custom_notes: string | null
          gender_identity: string | null
          id: string
          previous_experience: string | null
          session_id: string
          therapy_goals: string[] | null
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          current_mood_scales?: Json | null
          custom_notes?: string | null
          gender_identity?: string | null
          id?: string
          previous_experience?: string | null
          session_id: string
          therapy_goals?: string[] | null
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          current_mood_scales?: Json | null
          custom_notes?: string | null
          gender_identity?: string | null
          id?: string
          previous_experience?: string | null
          session_id?: string
          therapy_goals?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "therapy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapy_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "therapy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_sessions: {
        Row: {
          has_quiz_completed: boolean | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          message_count: number | null
          started_at: string | null
          therapy_type: Database["public"]["Enums"]["therapy_type"]
          title: string
          user_id: string
        }
        Insert: {
          has_quiz_completed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          started_at?: string | null
          therapy_type: Database["public"]["Enums"]["therapy_type"]
          title: string
          user_id: string
        }
        Update: {
          has_quiz_completed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          started_at?: string | null
          therapy_type?: Database["public"]["Enums"]["therapy_type"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_send_message: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      therapy_type:
        | "yogic"
        | "psychological"
        | "physiotherapy"
        | "ayurveda"
        | "talk_therapy"
        | "genz_therapy"
        | "female_therapy"
        | "male_therapy"
        | "older_therapy"
        | "children_therapy"
        | "millennial_therapy"
        | "advanced_therapy"
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
      therapy_type: [
        "yogic",
        "psychological",
        "physiotherapy",
        "ayurveda",
        "talk_therapy",
        "genz_therapy",
        "female_therapy",
        "male_therapy",
        "older_therapy",
        "children_therapy",
        "millennial_therapy",
        "advanced_therapy",
      ],
    },
  },
} as const
