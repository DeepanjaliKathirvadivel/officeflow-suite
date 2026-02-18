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
      asset_transactions: {
        Row: {
          asset_id: string
          created_at: string
          due_date: string
          id: string
          issue_date: string
          issued_by: string
          issued_to: string
          return_condition: string | null
          return_date: string | null
          signature_data: string | null
          status: Database["public"]["Enums"]["asset_status"]
        }
        Insert: {
          asset_id: string
          created_at?: string
          due_date: string
          id?: string
          issue_date?: string
          issued_by: string
          issued_to: string
          return_condition?: string | null
          return_date?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
        }
        Update: {
          asset_id?: string
          created_at?: string
          due_date?: string
          id?: string
          issue_date?: string
          issued_by?: string
          issued_to?: string
          return_condition?: string | null
          return_date?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
        }
        Relationships: [
          {
            foreignKeyName: "asset_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_code: string
          asset_type: string
          created_at: string
          created_by: string
          department: string | null
          id: string
          image_url: string | null
          name: string
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          asset_code: string
          asset_type: string
          created_at?: string
          created_by: string
          department?: string | null
          id?: string
          image_url?: string | null
          name: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          asset_code?: string
          asset_type?: string
          created_at?: string
          created_by?: string
          department?: string | null
          id?: string
          image_url?: string | null
          name?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bill_approvals: {
        Row: {
          acted_at: string | null
          approval_level: number
          approver_id: string
          bill_id: string
          comments: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["bill_status"]
        }
        Insert: {
          acted_at?: string | null
          approval_level: number
          approver_id: string
          bill_id: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["bill_status"]
        }
        Update: {
          acted_at?: string | null
          approval_level?: number
          approver_id?: string
          bill_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["bill_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bill_approvals_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_date: string | null
          bill_number: string | null
          created_at: string
          current_approval_level: number
          department: string | null
          file_url: string | null
          gst_number: string | null
          id: string
          ocr_text: string | null
          status: Database["public"]["Enums"]["bill_status"]
          submitted_by: string
          total_amount: number
          updated_at: string
          vendor_name: string
        }
        Insert: {
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          current_approval_level?: number
          department?: string | null
          file_url?: string | null
          gst_number?: string | null
          id?: string
          ocr_text?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          submitted_by: string
          total_amount?: number
          updated_at?: string
          vendor_name?: string
        }
        Update: {
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          current_approval_level?: number
          department?: string | null
          file_url?: string | null
          gst_number?: string | null
          id?: string
          ocr_text?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          submitted_by?: string
          total_amount?: number
          updated_at?: string
          vendor_name?: string
        }
        Relationships: []
      }
      complaint_assignments: {
        Row: {
          assigned_at: string
          assigned_department: string
          assigned_to: string | null
          complaint_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assigned_department: string
          assigned_to?: string | null
          complaint_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assigned_department?: string
          assigned_to?: string | null
          complaint_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_assignments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_history: {
        Row: {
          action: string
          complaint_id: string
          created_at: string
          id: string
          note: string | null
          performed_by: string
        }
        Insert: {
          action: string
          complaint_id: string
          created_at?: string
          id?: string
          note?: string | null
          performed_by: string
        }
        Update: {
          action?: string
          complaint_id?: string
          created_at?: string
          id?: string
          note?: string | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_history_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          attachment_url: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["complaint_priority"]
          resolution_remark: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resolution_remark?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resolution_remark?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      courier_acknowledgements: {
        Row: {
          acknowledged_at: string
          acknowledged_by: string
          courier_id: string
          id: string
          signature_data: string
        }
        Insert: {
          acknowledged_at?: string
          acknowledged_by: string
          courier_id: string
          id?: string
          signature_data: string
        }
        Update: {
          acknowledged_at?: string
          acknowledged_by?: string
          courier_id?: string
          id?: string
          signature_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_acknowledgements_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_vendors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      couriers: {
        Row: {
          assigned_to: string
          created_at: string
          created_by: string
          id: string
          slip_image_url: string | null
          status: Database["public"]["Enums"]["courier_status"]
          tracking_number: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          created_by: string
          id?: string
          slip_image_url?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          tracking_number: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          created_by?: string
          id?: string
          slip_image_url?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          tracking_number?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couriers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "courier_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_reports: {
        Row: {
          asset_id: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          reported_by: string
          transaction_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          reported_by: string
          transaction_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          reported_by?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "asset_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_rules: {
        Row: {
          approval_levels: Json
          created_at: string
          id: string
          max_amount: number | null
          min_amount: number
        }
        Insert: {
          approval_levels?: Json
          created_at?: string
          id?: string
          max_amount?: number | null
          min_amount?: number
        }
        Update: {
          approval_levels?: Json
          created_at?: string
          id?: string
          max_amount?: number | null
          min_amount?: number
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
      app_role:
        | "reception"
        | "accounts"
        | "manager"
        | "md"
        | "admin"
        | "employee"
        | "it_team"
      asset_status: "available" | "issued" | "returned" | "overdue" | "damaged"
      bill_status: "draft" | "pending" | "approved" | "rejected"
      complaint_category: "it" | "maintenance" | "hr" | "security" | "admin"
      complaint_priority: "low" | "medium" | "high"
      complaint_status: "open" | "in_progress" | "closed"
      courier_status: "pending_pickup" | "collected"
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
      app_role: [
        "reception",
        "accounts",
        "manager",
        "md",
        "admin",
        "employee",
        "it_team",
      ],
      asset_status: ["available", "issued", "returned", "overdue", "damaged"],
      bill_status: ["draft", "pending", "approved", "rejected"],
      complaint_category: ["it", "maintenance", "hr", "security", "admin"],
      complaint_priority: ["low", "medium", "high"],
      complaint_status: ["open", "in_progress", "closed"],
      courier_status: ["pending_pickup", "collected"],
    },
  },
} as const
