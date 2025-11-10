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
      devices: {
        Row: {
          id: string
          device_id: string
          name: string
          status: string
          battery_level: number | null
          latitude: number | null
          longitude: number | null
          speed: number | null
          last_seen: string | null
          created_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          device_id: string
          name: string
          status?: string
          battery_level?: number | null
          latitude?: number | null
          longitude?: number | null
          speed?: number | null
          last_seen?: string | null
          created_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          device_id?: string
          name?: string
          status?: string
          battery_level?: number | null
          latitude?: number | null
          longitude?: number | null
          speed?: number | null
          last_seen?: string | null
          created_at?: string | null
          user_id?: string
        }
      }
      assets: {
        Row: {
          id: string
          asset_id: string
          name: string
          type: string
          description: string | null
          status: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          asset_id: string
          name: string
          type?: string
          description?: string | null
          status?: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          asset_id?: string
          name?: string
          type?: string
          description?: string | null
          status?: string
          created_at?: string | null
          user_id?: string
        }
      }
      device_asset_links: {
        Row: {
          id: string
          device_id: string
          asset_id: string
          linked_at: string | null
          unlinked_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          device_id: string
          asset_id: string
          linked_at?: string | null
          unlinked_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          device_id?: string
          asset_id?: string
          linked_at?: string | null
          unlinked_at?: string | null
          user_id?: string
        }
      }
      alerts: {
        Row: {
          id: string
          device_id: string | null
          type: string
          category: string
          message: string
          acknowledged: boolean | null
          created_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          device_id?: string | null
          type?: string
          category?: string
          message: string
          acknowledged?: boolean | null
          created_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          device_id?: string | null
          type?: string
          category?: string
          message?: string
          acknowledged?: boolean | null
          created_at?: string | null
          user_id?: string
        }
      }
      device_history: {
        Row: {
          id: string
          device_id: string
          latitude: number
          longitude: number
          speed: number | null
          battery_level: number | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          device_id: string
          latitude: number
          longitude: number
          speed?: number | null
          battery_level?: number | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          device_id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          battery_level?: number | null
          recorded_at?: string | null
        }
      }
    }
  }
}
