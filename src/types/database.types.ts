

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          court_id: string
          created_at: string
          ends_at: string
          guest_player_names: string[]
          id: string
          is_coach_booking: boolean
          player_count: number
          player_ids: string[]
          price_huf: number | null
          recurring_series_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Insert: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          court_id: string
          created_at?: string
          ends_at: string
          guest_player_names?: string[]
          id?: string
          is_coach_booking?: boolean
          player_count: number
          player_ids?: string[]
          price_huf?: number | null
          recurring_series_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          court_id?: string
          created_at?: string
          ends_at?: string
          guest_player_names?: string[]
          id?: string
          is_coach_booking?: boolean
          player_count?: number
          player_ids?: string[]
          price_huf?: number | null
          recurring_series_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          number?: number
        }
        Relationships: []
      }
      coach_players: {
        Row: {
          id: string
          coach_id: string
          player_id: string
          status: string
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          player_id: string
          status?: string
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          player_id?: string
          status?: string
          responded_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_players_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          body: string
          data: Record<string, unknown>
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: Database["public"]["Enums"]["notification_type"]
          title: string
          body?: string
          data?: Record<string, unknown>
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          body?: string
          data?: Record<string, unknown>
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      player_statistics: {
        Row: {
          id: string
          coach_id: string
          player_id: string
          stat_type: string
          stat_value: string
          notes: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          player_id: string
          stat_type: string
          stat_value?: string
          notes?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          player_id?: string
          stat_type?: string
          stat_value?: string
          notes?: string | null
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_statistics_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_season_pass: boolean
          avatar_url: string | null
          coach_title: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          active_season_pass?: boolean
          avatar_url?: string | null
          coach_title?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          active_season_pass?: boolean
          avatar_url?: string | null
          coach_title?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      recurring_booking_exceptions: {
        Row: {
          id: string
          series_id: string
          excluded_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          series_id: string
          excluded_date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          series_id?: string
          excluded_date?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_booking_exceptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "recurring_booking_series"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_booking_series: {
        Row: {
          id: string
          coach_id: string
          title: string
          day_of_week: number
          start_time: string
          end_time: string
          court_ids: string[]
          effective_from: string
          effective_until: string
          is_active: boolean
          player_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title?: string
          day_of_week: number
          start_time: string
          end_time: string
          court_ids: string[]
          effective_from: string
          effective_until: string
          is_active?: boolean
          player_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          court_ids?: string[]
          effective_from?: string
          effective_until?: string
          is_active?: boolean
          player_ids?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_booking_series_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_pass_whitelist: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "confirmed" | "cancelled"
      booking_type: "season_pass" | "one_time"
      notification_type: "booking_displaced" | "coach_assignment" | "coach_invitation" | "practice_cancelled" | "general"
      user_role: "member" | "admin" | "coach"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      booking_status: ["confirmed", "cancelled"],
      booking_type: ["season_pass", "one_time"],
      notification_type: ["booking_displaced", "coach_assignment", "coach_invitation", "practice_cancelled", "general"],
      user_role: ["member", "admin", "coach"],
    },
  },
} as const;
