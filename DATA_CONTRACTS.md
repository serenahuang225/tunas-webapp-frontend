# Frontend Data Contracts

This document describes the TypeScript data contracts, API structure, and recommended pagination/filtering strategies for the Tunas React dashboard.

## Data Shapes

### Swimmer

```typescript
interface Swimmer {
  id: string | null;                    // USA Swimming ID (14 chars, long format)
  id_short: string | null;               // Short format ID
  first_name: string;
  last_name: string;
  full_name: string;
  middle_initial: string | null;
  preferred_first_name: string | null;
  sex: "F" | "M" | "X";                 // Female, Male, or Mixed
  birthday: string | null;               // ISO date string
  birthday_range: BirthdayRange;
  age_range: AgeRange;                   // { min: number, max: number }
  club: Club | null;
  citizenship: string | null;
}
```

### Event/Meet Result

```typescript
interface MeetResult {
  event: string;                         // e.g., "100 Free"
  event_distance: number;                // e.g., 100
  event_stroke: string;                   // e.g., "Free", "Back", "Breast", "Fly"
  event_course: string;                   // "SCY", "SCM", or "LCM"
  time: string;                          // Time string (e.g., "1:23.45")
  session: string;                       // Session identifier
  date: string;                          // ISO date string
  meet: Meet;                            // Meet information
  heat: number | null;
  lane: number | null;
  rank: number | null;                   // Final ranking
  points: number | null;                 // Points scored
  age_class: string | null;
  team_code: string | null;
  lsc: string | null;                    // Local Swimming Committee
  time_standards?: string[] | null;      // Time standard achievements
}
```

### Relay

```typescript
interface Relay {
  event: string;                         // e.g., "4x100 Free Relay"
  distance: number;                       // Total distance
  stroke: string;                         // Relay type
  course: string;                         // "SCY", "SCM", or "LCM"
  total_time: string | null;              // Combined relay time
  time_standards: string[];               // Achieved time standards
  swimmers: Swimmer[];                    // Array of 4 swimmers
  leg_events: string[];                   // Event for each leg
}
```

## Example JSON Responses

### GET /api/swimmers/{swimmer_id}

```json
{
  "swimmer": {
    "id": "12345678901234",
    "id_short": "12345678",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "middle_initial": null,
    "preferred_first_name": null,
    "sex": "M",
    "birthday": "2010-05-15",
    "birthday_range": {
      "min": "2010-05-15",
      "max": "2010-05-15"
    },
    "age_range": {
      "min": 13,
      "max": 13
    },
    "club": {
      "team_code": "SCSC",
      "lsc": "PC",
      "full_name": "Santa Clara Swim Club",
      "abbreviated_name": "SCSC",
      "city": "Santa Clara",
      "state": "CA",
      "country": "USA",
      "club_code": "PC-SCSC"
    },
    "citizenship": "USA"
  }
}
```

### GET /api/swimmers/{swimmer_id}/best-times

```json
{
  "swimmer": {
    "id": "12345678901234",
    "full_name": "John Doe",
    "sex": "M",
    "age_range": { "min": 13, "max": 13 },
    "club": { "full_name": "Santa Clara Swim Club" }
  },
  "best_times": [
    {
      "event": "100 Free",
      "event_distance": 100,
      "event_stroke": "Free",
      "event_course": "SCY",
      "time": "52.34",
      "session": "Prelims",
      "date": "2024-03-15",
      "meet": {
        "name": "Spring Championships",
        "city": "San Jose",
        "state": "CA",
        "start_date": "2024-03-14",
        "end_date": "2024-03-17",
        "course": "SCY",
        "meet_type": "Championship"
      },
      "heat": 3,
      "lane": 4,
      "rank": 5,
      "points": 12.0,
      "age_class": "13-14",
      "team_code": "SCSC",
      "lsc": "PC",
      "time_standards": ["A", "JO"]
    }
  ]
}
```

### GET /api/clubs/{club_code}/swimmers

```json
{
  "club": {
    "team_code": "SCSC",
    "lsc": "PC",
    "full_name": "Santa Clara Swim Club",
    "abbreviated_name": "SCSC",
    "city": "Santa Clara",
    "state": "CA",
    "country": "USA",
    "club_code": "PC-SCSC"
  },
  "swimmers": [
    {
      "id": "12345678901234",
      "full_name": "John Doe",
      "sex": "M",
      "age_range": { "min": 13, "max": 13 },
      "club": { "full_name": "Santa Clara Swim Club" }
    }
  ]
}
```

### POST /api/relays/generate

**Request:**
```json
{
  "club_code": "SCSC",
  "age_range": [13, 14],
  "sex": "F",
  "course": "SCY",
  "relay_date": "2024-06-01",
  "num_relays": 2,
  "event_type": "4x100_FREE",
  "excluded_swimmer_ids": []
}
```

**Response:**
```json
{
  "relays": [
    {
      "event": "4x100 Free Relay",
      "distance": 400,
      "stroke": "Free",
      "course": "SCY",
      "total_time": "3:45.23",
      "time_standards": ["A", "JO"],
      "swimmers": [
        {
          "id": "11111111111111",
          "full_name": "Jane Smith",
          "sex": "F",
          "age_range": { "min": 13, "max": 13 }
        }
      ],
      "leg_events": ["100 Free", "100 Free", "100 Free", "100 Free"]
    }
  ],
  "settings": {
    "club_code": "SCSC",
    "age_range": [13, 14],
    "sex": "F",
    "course": "SCY"
  }
}
```

## Pagination Strategy

### Current Implementation

The backend API does not currently support pagination. All endpoints return complete datasets. For large datasets (e.g., club swimmers, time history), the frontend implements client-side filtering and pagination.

### Recommended Approach

For future backend enhancements, implement server-side pagination:

```typescript
interface PaginationParams {
  page?: number;        // 1-indexed page number
  page_size?: number;   // Items per page (default: 20, max: 100)
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

**Example:**
```
GET /api/clubs/{club_code}/swimmers?page=1&page_size=50
GET /api/swimmers/{swimmer_id}/times?page=2&page_size=100
```

### Client-Side Filtering

The frontend currently implements:

1. **Search filtering**: Text search across swimmer names and IDs
2. **Sex filtering**: Filter by F, M, or X
3. **Age filtering**: Filter by age range (future enhancement)
4. **Event filtering**: Filter by event type, course, distance (future enhancement)

**Example Filter State:**
```typescript
interface SwimmerFilters {
  club_code?: string;
  sex?: "F" | "M" | "X";
  min_age?: number;
  max_age?: number;
  search?: string;
}
```

## Filtering Strategy

### Swimmer Analysis Page

- **Search by ID**: Direct lookup via USA Swimming ID
- **Best Times Tab**: Shows all best times per event
- **Time History Tab**: Shows all meet results (client-side pagination recommended for large datasets)

### Event Results Page

- **Club-based search**: Enter club code to view all swimmers
- **Real-time filtering**: 
  - Text search (name, ID)
  - Sex filter (dropdown)
  - Future: Age range slider, event type filter

### Relay Optimization Page

- **Form-based filtering**: All filters applied before API call
- **No client-side filtering needed**: Backend returns optimal teams

## Error Handling

All API calls use consistent error handling:

```typescript
interface ApiError {
  detail: string;      // Human-readable error message
  error?: string;      // Optional error code
}
```

**Example Error Response:**
```json
{
  "detail": "Swimmer not found with ID: 12345678901234"
}
```

## API Client Usage

```typescript
import { swimmerApi, clubApi, relayApi } from "@/lib/api-client";

// Get swimmer
const swimmer = await swimmerApi.getSwimmer("12345678901234");

// Get best times
const bestTimes = await swimmerApi.getBestTimes("12345678901234");

// Get time history
const history = await swimmerApi.getTimeHistory("12345678901234");

// Get club swimmers
const clubSwimmers = await clubApi.getClubSwimmers("SCSC");

// Generate relay teams
const relays = await relayApi.generateRelays({
  club_code: "SCSC",
  age_range: [13, 14],
  sex: "F",
  course: "SCY",
  relay_date: "2024-06-01",
  num_relays: 2,
  event_type: "4x100_FREE"
});
```

## Environment Configuration

Set the API base URL via environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Defaults to `http://localhost:8000` if not set.

