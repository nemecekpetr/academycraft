export type UserRole = 'student' | 'parent' | 'admin'

// Mastery levels for Skill Constellations (Motivation 3.0)
export type MasteryLevel = 'exploring' | 'growing' | 'confident' | 'teaching'

// Recognition types (Now-That instead of If-Then)
export type RecognitionType = 'parent_note' | 'effort_spotlight' | 'surprise_celebration' | 'milestone'

// Learning rhythm milestones
export type RhythmMilestone = 'found_rhythm' | 'regular_student' | 'learning_is_life' | null

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
  // Motivation 3.0 fields
  adventure_points: number
  weekly_goal_days: number
  preferred_learning_time: string | null
  learning_rhythm_milestone: RhythmMilestone
  theme?: string | null
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
  // Motivation 3.0 fields
  skill_area_id: string | null
  adventure_points: number
  purpose_message: string | null
  // Family scoping
  family_id: string | null
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
  activity_date: string | null
}

// Extended type with joined activity data
export interface CompletedActivityWithDetails extends CompletedActivity {
  activity?: Activity
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
  // Family scoping
  family_id: string | null
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

// Pending parent-child link verification
export interface PendingParentLink {
  id: string
  parent_id: string
  child_id: string
  verification_code: string
  expires_at: string
  created_at: string
}

// Extended type with joined parent profile data
export interface PendingParentLinkWithParent extends PendingParentLink {
  parent?: Profile
}

// =====================================================
// Motivation 3.0 Types
// =====================================================

export interface SkillArea {
  id: string
  name: string
  name_en: string | null
  description: string | null
  icon: string
  color: string
  display_order: number
  created_at: string
}

export interface SkillProgress {
  id: string
  user_id: string
  skill_area_id: string
  mastery_level: MasteryLevel
  activities_completed: number
  last_activity_at: string | null
  created_at: string
}

// Extended type with joined skill area data
export interface SkillProgressWithArea extends SkillProgress {
  skill_area?: SkillArea
}

export interface LearningDay {
  id: string
  user_id: string
  learning_date: string
  activities_count: number
  reflection_note: string | null
  created_at: string
}

export interface FamilyAdventure {
  id: string
  family_id: string
  name: string
  description: string | null
  points_needed: number
  points_current: number
  icon: string
  status: 'active' | 'achieved' | 'archived'
  achieved_at: string | null
  created_by: string | null
  created_at: string
}

export interface AdventureContribution {
  id: string
  adventure_id: string
  user_id: string
  activity_id: string | null
  points_contributed: number
  contributed_at: string
}

// Extended type with joined data
export interface AdventureContributionWithDetails extends AdventureContribution {
  user?: Profile
  activity?: CompletedActivity
}

export interface Recognition {
  id: string
  user_id: string
  recognition_type: RecognitionType
  title: string | null
  message: string
  related_activity_id: string | null
  created_by: string | null
  created_at: string
  viewed_at: string | null
}

export interface WeeklyReflection {
  id: string
  user_id: string
  week_start: string
  what_learned: string | null
  what_challenged: string | null
  what_enjoyed: string | null
  weekly_goal: string | null
  goal_met: boolean | null
  parent_note: string | null
  parent_responded_at: string | null
  created_at: string
}

export interface AdventureTemplate {
  id: string
  name: string
  description: string | null
  suggested_points: number
  icon: string
  category: string
}

// Požadavky na odměny - Motivation 3.0
export interface RewardRequest {
  id: string
  user_id: string
  template_id: string
  reward_name: string
  reward_description: string | null
  points_spent: number
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  fulfilled_at: string | null
}

// Časová kapsle - Motivation 3.0
export interface TimeCapsule {
  id: string
  user_id: string
  message: string
  goals: string | null
  fears: string | null
  excitement: string | null
  created_at: string
  unlock_date: string
  unlocked_at: string | null
  is_locked: boolean
  reflection: string | null
}

// Mastery level display info
export const MASTERY_LEVELS: Record<MasteryLevel, { name: string; nameEn: string; description: string; color: string; icon: string }> = {
  exploring: {
    name: 'Zkoumám',
    nameEn: 'Exploring',
    description: 'Začínám, zkouším',
    color: '#AAAAAA',
    icon: '🔍',
  },
  growing: {
    name: 'Rostu',
    nameEn: 'Growing',
    description: 'Vidím zlepšení, učím se z chyb',
    color: '#5D8C3E',
    icon: '🌱',
  },
  confident: {
    name: 'Věřím si',
    nameEn: 'Confident',
    description: 'Konzistentní porozumění',
    color: '#4AEDD9',
    icon: '💪',
  },
  teaching: {
    name: 'Můžu učit',
    nameEn: 'Teaching',
    description: 'Hluboké mistrovství',
    color: '#FCEE4B',
    icon: '⭐',
  },
}

// Rhythm milestone display info
export const RHYTHM_MILESTONES: Record<NonNullable<RhythmMilestone>, { name: string; description: string; icon: string }> = {
  found_rhythm: {
    name: 'Našla jsem svůj rytmus',
    description: '3+ dny učení tento týden',
    icon: '🎵',
  },
  regular_student: {
    name: 'Pravidelná studentka',
    description: '4 týdny pravidelného učení',
    icon: '📚',
  },
  learning_is_life: {
    name: 'Učení je součást mého života',
    description: '8 týdnů pravidelného učení',
    icon: '✨',
  },
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>
        Relationships: []
      }
      completed_activities: {
        Row: CompletedActivity
        Insert: Omit<CompletedActivity, 'id'>
        Update: Partial<Omit<CompletedActivity, 'id'>>
        Relationships: []
      }
      shop_items: {
        Row: ShopItem
        Insert: Omit<ShopItem, 'id' | 'created_at'>
        Update: Partial<Omit<ShopItem, 'id' | 'created_at'>>
        Relationships: []
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id'>
        Update: Partial<Omit<Purchase, 'id'>>
        Relationships: []
      }
      mystery_boxes: {
        Row: MysteryBox
        Insert: Omit<MysteryBox, 'id'>
        Update: Partial<Omit<MysteryBox, 'id'>>
        Relationships: []
      }
      // Motivation 3.0 tables
      skill_areas: {
        Row: SkillArea
        Insert: Omit<SkillArea, 'id' | 'created_at'>
        Update: Partial<Omit<SkillArea, 'id' | 'created_at'>>
        Relationships: []
      }
      skill_progress: {
        Row: SkillProgress
        Insert: Omit<SkillProgress, 'id' | 'created_at'>
        Update: Partial<Omit<SkillProgress, 'id' | 'created_at'>>
        Relationships: []
      }
      learning_days: {
        Row: LearningDay
        Insert: Omit<LearningDay, 'id' | 'created_at'>
        Update: Partial<Omit<LearningDay, 'id' | 'created_at'>>
        Relationships: []
      }
      family_adventures: {
        Row: FamilyAdventure
        Insert: Omit<FamilyAdventure, 'id' | 'created_at'>
        Update: Partial<Omit<FamilyAdventure, 'id' | 'created_at'>>
        Relationships: []
      }
      adventure_contributions: {
        Row: AdventureContribution
        Insert: Omit<AdventureContribution, 'id'>
        Update: Partial<Omit<AdventureContribution, 'id'>>
        Relationships: []
      }
      recognitions: {
        Row: Recognition
        Insert: Omit<Recognition, 'id'>
        Update: Partial<Omit<Recognition, 'id'>>
        Relationships: []
      }
      weekly_reflections: {
        Row: WeeklyReflection
        Insert: Omit<WeeklyReflection, 'id'>
        Update: Partial<Omit<WeeklyReflection, 'id'>>
        Relationships: []
      }
      adventure_templates: {
        Row: AdventureTemplate
        Insert: Omit<AdventureTemplate, 'id'>
        Update: Partial<Omit<AdventureTemplate, 'id'>>
        Relationships: []
      }
      pending_parent_links: {
        Row: PendingParentLink
        Insert: Omit<PendingParentLink, 'id' | 'created_at'>
        Update: Partial<Omit<PendingParentLink, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
