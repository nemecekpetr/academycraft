export type UserRole = 'student' | 'parent' | 'admin'

export interface Profile {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  xp: number
  emeralds: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  parent_id: string | null
  created_at: string
  is_banned: boolean
}

export interface Activity {
  id: string
  name: string
  description: string | null
  xp_reward: number
  emerald_reward: number
  icon: string
  requires_approval: boolean
  requires_score: boolean
  max_score: number | null
  flawless_threshold: number | null
  is_active: boolean
  created_at: string
}

export interface CompletedActivity {
  id: string
  user_id: string
  activity_id: string
  score: number | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  xp_earned: number
  emeralds_earned: number
  is_flawless: boolean
}

export interface ShopItem {
  id: string
  name: string
  description: string | null
  price: number
  icon: string
  is_active: boolean
  min_level: number
  created_by: string
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  item_id: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  purchased_at: string
  fulfilled_at: string | null
  fulfilled_by: string | null
}

export interface MysteryBox {
  id: string
  user_id: string
  reward_type: 'common' | 'rare' | 'legendary'
  reward_description: string
  opened_at: string
  earned_for: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>
      }
      completed_activities: {
        Row: CompletedActivity
        Insert: Omit<CompletedActivity, 'id'>
        Update: Partial<Omit<CompletedActivity, 'id'>>
      }
      shop_items: {
        Row: ShopItem
        Insert: Omit<ShopItem, 'id' | 'created_at'>
        Update: Partial<Omit<ShopItem, 'id' | 'created_at'>>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id'>
        Update: Partial<Omit<Purchase, 'id'>>
      }
      mystery_boxes: {
        Row: MysteryBox
        Insert: Omit<MysteryBox, 'id'>
        Update: Partial<Omit<MysteryBox, 'id'>>
      }
    }
  }
}
