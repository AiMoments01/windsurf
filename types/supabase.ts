export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string | null
          full_name: string | null
          role: 'admin' | 'therapist' | 'patient'
          phone: string | null
          insurance_provider: string | null
          insurance_number: string | null
          notes: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'therapist' | 'patient'
          phone?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'therapist' | 'patient'
          phone?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          notes?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          max_participants: number
          therapist_id: string | null
          location: string | null
          recurring: boolean
          start_date: string
          end_date: string | null
          weekday: number | null
          start_time: string
          duration: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          max_participants?: number
          therapist_id?: string | null
          location?: string | null
          recurring?: boolean
          start_date: string
          end_date?: string | null
          weekday?: number | null
          start_time: string
          duration: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          max_participants?: number
          therapist_id?: string | null
          location?: string | null
          recurring?: boolean
          start_date?: string
          end_date?: string | null
          weekday?: number | null
          start_time?: string
          duration?: number
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          course_id: string
          session_date: string
          start_time: string
          duration: number
          notes: string | null
          cancelled: boolean
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          course_id: string
          session_date: string
          start_time: string
          duration: number
          notes?: string | null
          cancelled?: boolean
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          course_id?: string
          session_date?: string
          start_time?: string
          duration?: number
          notes?: string | null
          cancelled?: boolean
          cancellation_reason?: string | null
        }
      }
      prescriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          diagnosis: string
          prescribed_sessions: number
          remaining_sessions: number | null
          start_date: string
          end_date: string
          status: 'pending' | 'approved' | 'completed' | 'cancelled'
          insurance_provider: string | null
          insurance_number: string | null
          doctor_name: string | null
          prescription_date: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id: string
          diagnosis: string
          prescribed_sessions: number
          remaining_sessions?: number | null
          start_date: string
          end_date: string
          status?: 'pending' | 'approved' | 'completed' | 'cancelled'
          insurance_provider?: string | null
          insurance_number?: string | null
          doctor_name?: string | null
          prescription_date?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string
          diagnosis?: string
          prescribed_sessions?: number
          remaining_sessions?: number | null
          start_date?: string
          end_date?: string
          status?: 'pending' | 'approved' | 'completed' | 'cancelled'
          insurance_provider?: string | null
          insurance_number?: string | null
          doctor_name?: string | null
          prescription_date?: string | null
          notes?: string | null
        }
      }
      course_participants: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          course_id: string
          patient_id: string
          prescription_id: string | null
          joined_date: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          course_id: string
          patient_id: string
          prescription_id?: string | null
          joined_date?: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          course_id?: string
          patient_id?: string
          prescription_id?: string | null
          joined_date?: string
          status?: string
          notes?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          created_at: string
          session_id: string
          patient_id: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          session_id: string
          patient_id: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          session_id?: string
          patient_id?: string
          status?: string
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrease_remaining_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      prescription_status: 'pending' | 'approved' | 'completed' | 'cancelled'
      user_role: 'admin' | 'therapist' | 'patient'
    }
  }
}
