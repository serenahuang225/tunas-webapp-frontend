/**
 * TypeScript data contracts for Tunas API
 * Based on FastAPI backend models
 */

// Club Types
export interface Club {
  team_code: string | null;
  lsc: string | null;
  full_name: string;
  abbreviated_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  club_code: string | null;
}

// Swimmer Types
export interface AgeRange {
  min: number;
  max: number;
}

export interface BirthdayRange {
  min: string; // ISO date string
  max: string; // ISO date string
}

export interface Swimmer {
  id: string | null;
  id_short: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  middle_initial: string | null;
  preferred_first_name: string | null;
  sex: "F" | "M" | "X";
  birthday: string | null; // ISO date string
  birthday_range: BirthdayRange;
  age_range: AgeRange;
  club: Club | null;
  citizenship: string | null;
}

// Meet Types
export interface Meet {
  name: string;
  city: string;
  state: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  course: "SCY" | "SCM" | "LCM" | null;
  meet_type: string | null;
}

// Event/Meet Result Types
export interface MeetResult {
  event: string;
  event_distance: number;
  event_stroke: string;
  event_course: string;
  time: string; // Time string format (e.g., "1:23.45")
  session: string;
  date: string; // ISO date string
  meet: Meet;
  heat: number | null;
  lane: number | null;
  rank: number | null;
  points: number | null;
  age_class: string | null;
  team_code: string | null;
  lsc: string | null;
  time_standards?: string[] | null;
}

// API Response Types
export interface SwimmerResponse {
  swimmer: Swimmer;
}

export interface SwimmerBestTimesResponse {
  swimmer: Swimmer;
  best_times: MeetResult[];
}

export interface SwimmerTimeHistoryResponse {
  swimmer: Swimmer;
  meet_results: MeetResult[];
}

export interface ClubResponse {
  team_code: string | null;
  lsc: string | null;
  full_name: string;
  abbreviated_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  club_code: string | null;
}

export interface ClubSwimmersResponse {
  club: ClubResponse;
  swimmers: Swimmer[];
}

export interface DatabaseStatsResponse {
  num_clubs: number;
  num_swimmers: number;
  num_meets: number;
  num_meet_results: number;
}

// Relay Types
export interface RelaySwimmer extends Swimmer {
  best_time: string | null;
  age_at_relay: number | AgeRange;
}

export interface Relay {
  event: string;
  distance: number;
  stroke: string;
  course: string;
  total_time: string | null;
  time_standards: string[];
  swimmers: Swimmer[];
  leg_events: string[];
}

export interface RelayGenerationRequest {
  club_code: string;
  age_range: [number, number];
  sex: "F" | "M" | "X";
  course: "SCY" | "SCM" | "LCM";
  relay_date: string; // ISO date string (YYYY-MM-DD)
  num_relays?: number;
  excluded_swimmer_ids?: string[];
  event_type:
    | "4x50_FREE"
    | "4x50_MEDLEY"
    | "4x100_FREE"
    | "4x100_MEDLEY"
    | "4x200_FREE";
}

export interface RelayGenerationResponse {
  relays: Relay[];
  settings: Record<string, any>;
}

// Error Types
export interface ApiError {
  detail: string;
  error?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Filter Types
export interface SwimmerFilters {
  club_code?: string;
  sex?: "F" | "M" | "X";
  min_age?: number;
  max_age?: number;
  search?: string;
}

export interface EventFilters {
  event_distance?: number;
  event_stroke?: string;
  event_course?: "SCY" | "SCM" | "LCM";
  min_date?: string;
  max_date?: string;
  meet_name?: string;
}

