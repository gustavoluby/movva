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
      badges: {
        Row: {
          created_at: string | null
          criteria_type: string | null
          criteria_value: number | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          criteria_type?: string | null
          criteria_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          criteria_type?: string | null
          criteria_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_cents: number
          checked_in_at: string | null
          coupon_code: string | null
          created_at: string | null
          discount_cents: number | null
          event_id: string
          id: string
          mp_status: string | null
          mp_status_detail: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          reminder_sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          checked_in_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_cents?: number | null
          event_id: string
          id?: string
          mp_status?: string | null
          mp_status_detail?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          checked_in_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_cents?: number | null
          event_id?: string
          id?: string
          mp_status?: string | null
          mp_status_detail?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          booking_id: string
          coupon_code: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          coupon_code: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          coupon_code?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "coupon_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          first_purchase_only: boolean | null
          is_active: boolean | null
          max_uses: number | null
          min_amount_cents: number | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          event_id?: string | null
          first_purchase_only?: boolean | null
          is_active?: boolean | null
          max_uses?: number | null
          min_amount_cents?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          first_purchase_only?: boolean | null
          is_active?: boolean | null
          max_uses?: number | null
          min_amount_cents?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_activities: {
        Row: {
          duration: string | null
          event_id: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          duration?: string | null
          event_id?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          duration?: string | null
          event_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_hosts: {
        Row: {
          event_id: string
          host_id: string
          role: string | null
        }
        Insert: {
          event_id: string
          host_id: string
          role?: string | null
        }
        Update: {
          event_id?: string
          host_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          cat_tag: string | null
          category: string | null
          commission_type: string
          commission_value: number | null
          created_at: string | null
          description: string | null
          duration: string | null
          event_date: string
          event_time: string | null
          going_count: number | null
          host_photo_url: string | null
          host_summary: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_recurring: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string
          location_short: string | null
          owner_id: string | null
          price_cents: number
          price_tier2_cents: number | null
          recurrence_rule: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          show_what_to_bring: boolean
          slug: string
          status: string | null
          submitted_at: string | null
          subtitle: string | null
          tag: string | null
          tag_style: string | null
          thumb_url: string | null
          tier1_capacity: number | null
          title: string
          updated_at: string | null
          what_to_bring: string | null
        }
        Insert: {
          capacity: number
          cat_tag?: string | null
          category?: string | null
          commission_type?: string
          commission_value?: number | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date: string
          event_time?: string | null
          going_count?: number | null
          host_photo_url?: string | null
          host_summary?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name: string
          location_short?: string | null
          owner_id?: string | null
          price_cents: number
          price_tier2_cents?: number | null
          recurrence_rule?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          show_what_to_bring?: boolean
          slug: string
          status?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          tag?: string | null
          tag_style?: string | null
          thumb_url?: string | null
          tier1_capacity?: number | null
          title: string
          updated_at?: string | null
          what_to_bring?: string | null
        }
        Update: {
          capacity?: number
          cat_tag?: string | null
          category?: string | null
          commission_type?: string
          commission_value?: number | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string
          event_time?: string | null
          going_count?: number | null
          host_photo_url?: string | null
          host_summary?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string
          location_short?: string | null
          owner_id?: string | null
          price_cents?: number
          price_tier2_cents?: number | null
          recurrence_rule?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          show_what_to_bring?: boolean
          slug?: string
          status?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          tag?: string | null
          tag_style?: string | null
          thumb_url?: string | null
          tier1_capacity?: number | null
          title?: string
          updated_at?: string | null
          what_to_bring?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          comments_count: number | null
          created_at: string | null
          event_id: string | null
          id: string
          likes_count: number | null
          location_name: string | null
          photo_url: string | null
          rating: number | null
          status: string | null
          text: string | null
          tribe_id: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          likes_count?: number | null
          location_name?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: string | null
          text?: string | null
          tribe_id?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          likes_count?: number | null
          location_name?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: string | null
          text?: string | null
          tribe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          met_at_event_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          met_at_event_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          met_at_event_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_met_at_event_id_fkey"
            columns: ["met_at_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          bio: string | null
          contact_email: string | null
          contact_whatsapp: string | null
          created_at: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          name: string
          photo_url: string | null
          profile_id: string | null
          rating: number | null
          total_events: number | null
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          name: string
          photo_url?: string | null
          profile_id?: string | null
          rating?: number | null
          total_events?: number | null
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          name?: string
          photo_url?: string | null
          profile_id?: string | null
          rating?: number | null
          total_events?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hosts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_comments: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_likes: {
        Row: {
          created_at: string | null
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_likes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          avatar_emoji: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          status: string | null
          tag: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          status?: string | null
          tag?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          status?: string | null
          tag?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_applications: {
        Row: {
          about: string | null
          admin_note: string | null
          created_at: string | null
          event_idea: string
          id: string
          instagram: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          about?: string | null
          admin_note?: string | null
          created_at?: string | null
          event_idea: string
          id?: string
          instagram?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          about?: string | null
          admin_note?: string | null
          created_at?: string | null
          event_idea?: string
          id?: string
          instagram?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_indications: {
        Row: {
          created_at: string | null
          professional_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          professional_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          professional_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_indications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_indications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_portfolio: {
        Row: {
          created_at: string | null
          id: string
          photo_url: string
          professional_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_url: string
          professional_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_url?: string
          professional_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_portfolio_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_reviews: {
        Row: {
          created_at: string | null
          id: string
          professional_id: string | null
          rating: number
          text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          professional_id?: string | null
          rating: number
          text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          professional_id?: string | null
          rating?: number
          text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          duration: string | null
          id: string
          name: string
          price_cents: number
          professional_id: string | null
          sort_order: number | null
        }
        Insert: {
          duration?: string | null
          id?: string
          name: string
          price_cents: number
          professional_id?: string | null
          sort_order?: number | null
        }
        Update: {
          duration?: string | null
          id?: string
          name?: string
          price_cents?: number
          professional_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          at_domicile: boolean | null
          bio: string | null
          categories: string[] | null
          cover_url: string | null
          created_at: string | null
          handle: string | null
          id: string
          indications_count: number | null
          is_featured: boolean | null
          is_verified: boolean | null
          location_full: string | null
          location_lat: number | null
          location_lng: number | null
          location_short: string | null
          name: string
          photo_url: string | null
          price_from_cents: number | null
          primary_category: string
          rating: number | null
          review_count: number | null
          slug: string
          status: string | null
          studio_name: string
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          at_domicile?: boolean | null
          bio?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          indications_count?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location_full?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_short?: string | null
          name: string
          photo_url?: string | null
          price_from_cents?: number | null
          primary_category: string
          rating?: number | null
          review_count?: number | null
          slug: string
          status?: string | null
          studio_name: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          at_domicile?: boolean | null
          bio?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          indications_count?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location_full?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_short?: string | null
          name?: string
          photo_url?: string | null
          price_from_cents?: number | null
          primary_category?: string
          rating?: number | null
          review_count?: number | null
          slug?: string
          status?: string | null
          studio_name?: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          city: string | null
          created_at: string | null
          full_name: string
          handle: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_verified: boolean | null
          neighborhood: string | null
          phone: string | null
          role: string
          total_badges: number | null
          total_experiences: number | null
          total_friends: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          full_name: string
          handle?: string | null
          id: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          role?: string
          total_badges?: number | null
          total_experiences?: number | null
          total_friends?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string
          handle?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          role?: string
          total_badges?: number | null
          total_experiences?: number | null
          total_friends?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_members: {
        Row: {
          joined_at: string | null
          tribe_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          tribe_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          tribe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_members_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribe_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tribes: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          member_count: number | null
          name: string
          slug: string
          type: string
          type_label: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name: string
          slug: string
          type: string
          type_label?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name?: string
          slug?: string
          type?: string
          type_label?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_coupon_use: { Args: { p_code: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
