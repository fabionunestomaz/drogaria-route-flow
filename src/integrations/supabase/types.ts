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
      drivers: {
        Row: {
          approved: boolean | null
          cnh_back_url: string | null
          cnh_front_url: string | null
          cnh_number: string | null
          created_at: string
          id: string
          last_seen_at: string | null
          plate: string | null
          selfie_url: string | null
          shift_status: string | null
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          approved?: boolean | null
          cnh_back_url?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string | null
          plate?: string | null
          selfie_url?: string | null
          shift_status?: string | null
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          approved?: boolean | null
          cnh_back_url?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string | null
          plate?: string | null
          selfie_url?: string | null
          shift_status?: string | null
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ride_locations: {
        Row: {
          accuracy: number | null
          driver_id: string | null
          heading: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          ride_id: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          driver_id?: string | null
          heading?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          ride_id: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string | null
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          ride_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          cancelable_until: string | null
          coupon_code: string | null
          created_at: string
          customer_id: string | null
          dest_address: string
          dest_lat: number | null
          dest_lng: number | null
          driver_id: string | null
          id: string
          origin_address: string
          origin_lat: number | null
          origin_lng: number | null
          price_final: number | null
          price_mode: string | null
          status: string
          tracking_enabled: boolean
          tracking_expires_at: string | null
          tracking_token: string
          updated_at: string
        }
        Insert: {
          cancelable_until?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          dest_address: string
          dest_lat?: number | null
          dest_lng?: number | null
          driver_id?: string | null
          id?: string
          origin_address: string
          origin_lat?: number | null
          origin_lng?: number | null
          price_final?: number | null
          price_mode?: string | null
          status?: string
          tracking_enabled?: boolean
          tracking_expires_at?: string | null
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          cancelable_until?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          dest_address?: string
          dest_lat?: number | null
          dest_lng?: number | null
          driver_id?: string | null
          id?: string
          origin_address?: string
          origin_lat?: number | null
          origin_lng?: number | null
          price_final?: number | null
          price_mode?: string | null
          status?: string
          tracking_enabled?: boolean
          tracking_expires_at?: string | null
          tracking_token?: string
          updated_at?: string
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
