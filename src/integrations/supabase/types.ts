export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      admin_auth_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed: string | null
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_auth_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_credentials: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          salt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          salt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          salt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_password_logs: {
        Row: {
          action: string
          admin_email: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action?: string
          admin_email: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          last_accessed: string | null
          session_token: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          last_accessed?: string | null
          session_token: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          actual_win: number | null
          amount: number
          bet_type: string
          bet_value: string
          created_at: string | null
          game_id: string | null
          id: string
          is_winner: boolean | null
          potential_win: number
          user_id: string | null
        }
        Insert: {
          actual_win?: number | null
          amount: number
          bet_type: string
          bet_value: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_winner?: boolean | null
          potential_win: number
          user_id?: string | null
        }
        Update: {
          actual_win?: number | null
          amount?: number
          bet_type?: string
          bet_value?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_winner?: boolean | null
          potential_win?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          admin_controlled: boolean | null
          admin_notes: string | null
          admin_set_result_color: string | null
          admin_set_result_number: number | null
          created_at: string | null
          end_time: string
          game_mode: string | null
          game_mode_type: string | null
          game_number: number
          id: string
          manual_result_set: boolean | null
          result_color: string | null
          result_number: number | null
          start_time: string
          status: string | null
        }
        Insert: {
          admin_controlled?: boolean | null
          admin_notes?: string | null
          admin_set_result_color?: string | null
          admin_set_result_number?: number | null
          created_at?: string | null
          end_time: string
          game_mode?: string | null
          game_mode_type?: string | null
          game_number: number
          id?: string
          manual_result_set?: boolean | null
          result_color?: string | null
          result_number?: number | null
          start_time: string
          status?: string | null
        }
        Update: {
          admin_controlled?: boolean | null
          admin_notes?: string | null
          admin_set_result_color?: string | null
          admin_set_result_number?: number | null
          created_at?: string | null
          end_time?: string
          game_mode?: string | null
          game_mode_type?: string | null
          game_number?: number
          id?: string
          manual_result_set?: boolean | null
          result_color?: string | null
          result_number?: number | null
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      manual_game_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          game_id: string
          id: string
          notes: string | null
          result_number: number | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          game_id: string
          id?: string
          notes?: string | null
          result_number?: number | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          game_id?: string
          id?: string
          notes?: string | null
          result_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_game_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_game_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_config: {
        Row: {
          config_data: Json
          created_at: string | null
          gateway_type: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          config_data: Json
          created_at?: string | null
          gateway_type: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config_data?: Json
          created_at?: string | null
          gateway_type?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          status: string | null
          transaction_reference: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          transaction_reference?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          transaction_reference?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          balance: number | null
          created_at: string | null
          email: string
          id: string
          referral_code: string | null
          referred_by: string | null
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          email: string
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          email?: string
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_deposit_request: {
        Args: {
          p_request_id: string
          p_admin_id: string
          p_admin_notes?: string
        }
        Returns: Json
      }
      change_admin_password: {
        Args: {
          p_email: string
          p_current_password: string
          p_new_password: string
        }
        Returns: Json
      }
      complete_manual_game: {
        Args: { p_game_id: string; p_admin_user_id: string }
        Returns: Json
      }
      create_admin_account: {
        Args: {
          p_username: string
          p_password: string
          p_email?: string
          p_full_name?: string
        }
        Returns: string
      }
      create_admin_auth_session: {
        Args: { p_user_id: string }
        Returns: string
      }
      create_admin_auth_session_enhanced: {
        Args: { p_email: string }
        Returns: string
      }
      create_admin_session: {
        Args: { p_admin_id: string }
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      hash_password: {
        Args: { password: string }
        Returns: {
          hash: string
          salt: string
        }[]
      }
      log_password_change: {
        Args: {
          p_admin_email: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      logout_admin_session: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      reject_deposit_request: {
        Args: {
          p_request_id: string
          p_admin_id: string
          p_admin_notes: string
        }
        Returns: Json
      }
      set_manual_game_result: {
        Args: {
          p_game_id: string
          p_admin_user_id: string
          p_result_number: number
        }
        Returns: Json
      }
      set_manual_game_result_enhanced: {
        Args: {
          p_game_id: string
          p_admin_user_id: string
          p_result_number: number
        }
        Returns: Json
      }
      verify_admin_auth_session: {
        Args: { p_session_token: string }
        Returns: {
          user_id: string
          email: string
          username: string
          role: string
        }[]
      }
      verify_admin_credentials: {
        Args: { p_email: string; p_password: string }
        Returns: {
          user_id: string
          email: string
          username: string
          role: string
        }[]
      }
      verify_admin_credentials_enhanced: {
        Args: { p_email: string; p_password: string }
        Returns: {
          user_id: string
          email: string
          username: string
          role: string
          session_token: string
        }[]
      }
      verify_admin_login: {
        Args: { p_username: string; p_password: string }
        Returns: {
          admin_id: string
          username: string
          email: string
          full_name: string
          is_active: boolean
        }[]
      }
      verify_admin_session: {
        Args: { p_session_token: string }
        Returns: {
          admin_id: string
          username: string
          email: string
          full_name: string
        }[]
      }
      verify_admin_session_with_user: {
        Args: { p_session_token: string }
        Returns: {
          user_id: string
          email: string
          username: string
          role: string
          session_valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
