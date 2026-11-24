export type ProfileRow = {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  coins: number;
  completed: number;
  streak: number;
  last_claim: string;
  hearts: number;
  heart_refill_at: string | null;
  campaign_completed_at: string | null;
  updated_at: string;
};

export type LeaderboardRow = Pick<
  ProfileRow,
  "username" | "avatar" | "xp" | "completed" | "updated_at"
>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: LeaderboardRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
