# Tunas Frontend - React Dashboard

A Next.js-based React dashboard for analyzing USA Swimming meet results, tracking swimmer performance, and optimizing relay team compositions.

## Features

- **Swimmer Analysis**: Search swimmers by USA Swimming ID and view best times and full time history
- **Event Results**: Browse club rosters and filter swimmers by various criteria
- **Relay Optimization**: Generate optimal relay teams based on swimmer best times
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Dark Mode Support**: Built-in dark mode styling

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Fetch API** - Native browser API for HTTP requests

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard home
│   │   ├── swimmers/           # Swimmer analysis page
│   │   ├── events/             # Event results page
│   │   └── relays/             # Relay optimization page
│   ├── components/
│   │   └── layout/             # Layout components (Sidebar, Header)
│   ├── contexts/               # React contexts (SidebarContext)
│   ├── lib/
│   │   └── api-client.ts       # API client utilities
│   └── types/
│       └── api.ts               # TypeScript type definitions
├── DATA_CONTRACTS.md          # API data contracts documentation
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:8000)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file (optional):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

### Build

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with the FastAPI backend through a typed API client. See `src/lib/api-client.ts` for available methods:

- `swimmerApi.getSwimmer(id)` - Get swimmer by ID
- `swimmerApi.getBestTimes(id)` - Get swimmer's best times
- `swimmerApi.getTimeHistory(id)` - Get full time history
- `clubApi.getClub(code)` - Get club information
- `clubApi.getClubSwimmers(code)` - Get club roster
- `relayApi.generateRelays(request)` - Generate relay teams
- `statsApi.getStats()` - Get database statistics

## Data Contracts

See [DATA_CONTRACTS.md](./DATA_CONTRACTS.md) for:
- Complete TypeScript type definitions
- Example JSON responses
- Pagination and filtering strategies
- Error handling patterns

## Pages

### Dashboard (`/`)

Overview page showing database statistics and quick action links.

### Swimmer Analysis (`/swimmers`)

- Search swimmers by USA Swimming ID
- View swimmer information
- Browse best times by event
- View complete time history

### Event Results (`/events`)

- Search clubs by club code
- View club information
- Browse club roster
- Filter swimmers by name, ID, or sex

### Relay Optimization (`/relays`)

- Configure relay parameters (club, age range, sex, course, event type)
- Generate optimal relay teams
- View team compositions with swimmer details
- See achieved time standards

## Styling

The project uses Tailwind CSS v4 with custom theme configuration. Key design tokens:

- **Brand Colors**: Blue palette (`brand-500`, `brand-600`, etc.)
- **Gray Scale**: Full gray scale for text and backgrounds
- **Status Colors**: Success (green), Error (red), Warning (orange)
- **Typography**: Outfit font family with custom size scale

## Type Safety

All API responses are typed using TypeScript interfaces defined in `src/types/api.ts`. This ensures:

- Compile-time type checking
- IntelliSense/autocomplete support
- Runtime error prevention

## Error Handling

The API client includes comprehensive error handling:

```typescript
try {
  const data = await swimmerApi.getSwimmer(id);
} catch (error) {
  if (error instanceof ApiClientError) {
    // Handle API error with status code and message
    console.error(error.message, error.status);
  }
}
```

## Future Enhancements

- Server-side pagination support
- Advanced filtering (age range, event type, date range)
- Data visualization charts (time progression, event distribution)
- Export functionality (CSV, PDF)
- Swimmer comparison tools
- Performance trends analysis

## License

See parent directory LICENSE file.
