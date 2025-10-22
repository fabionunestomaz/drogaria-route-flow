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
      customers: {
        Row: {
          address: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          notes: string | null
          pharmacy_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          notes?: string | null
          pharmacy_id: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          pharmacy_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          address: string
          batch_id: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          id: string
          lat: number
          lng: number
          notes: string | null
          order_number: string
          proof_photo_url: string | null
          request_id: string | null
          sequence: number
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          batch_id: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          lat: number
          lng: number
          notes?: string | null
          order_number: string
          proof_photo_url?: string | null
          request_id?: string | null
          sequence?: number
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          batch_id?: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          lat?: number
          lng?: number
          notes?: string | null
          order_number?: string
          proof_photo_url?: string | null
          request_id?: string | null
          sequence?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "delivery_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_batches: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          optimized_route: Json | null
          pharmacy_id: string
          status: string
          total_distance: number | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          optimized_route?: Json | null
          pharmacy_id: string
          status?: string
          total_distance?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          optimized_route?: Json | null
          pharmacy_id?: string
          status?: string
          total_distance?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_batches_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          created_at: string | null
          customer_id: string | null
          dest_address: string
          dest_lat: number
          dest_lng: number
          distance: number | null
          estimated_price: number | null
          estimated_time: number | null
          id: string
          notes: string | null
          origin_address: string
          origin_lat: number
          origin_lng: number
          status: string | null
          tracking_token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          dest_address: string
          dest_lat: number
          dest_lng: number
          distance?: number | null
          estimated_price?: number | null
          estimated_time?: number | null
          id?: string
          notes?: string | null
          origin_address: string
          origin_lat: number
          origin_lng: number
          status?: string | null
          tracking_token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          dest_address?: string
          dest_lat?: number
          dest_lng?: number
          distance?: number | null
          estimated_price?: number | null
          estimated_time?: number | null
          id?: string
          notes?: string | null
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          status?: string | null
          tracking_token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      pharmacy_settings: {
        Row: {
          address: string
          base_price: number | null
          created_at: string
          id: string
          lat: number
          lng: number
          pharmacy_name: string
          phone: string | null
          price_per_km: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          base_price?: number | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          pharmacy_name: string
          phone?: string | null
          price_per_km?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          base_price?: number | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          pharmacy_name?: string
          phone?: string | null
          price_per_km?: number | null
          updated_at?: string
          user_id?: string
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
          profile_completed: boolean | null
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
          profile_completed?: boolean | null
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
          profile_completed?: boolean | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "customer"
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
      app_role: ["admin", "driver", "customer"],
    },
  },
} as const
