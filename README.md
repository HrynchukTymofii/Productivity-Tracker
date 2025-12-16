# Productivity Tracker

A comprehensive React Native Expo time tracking application with a Google Calendar-style day planner, customizable color palettes, multi-language support, and detailed statistics.

## Features

### Core Features

- **Task Management**: Create and edit tasks with automatic color assignment
- **Timer Controls**: Start, pause, resume, and stop time tracking with second-level accuracy
- **Single Active Timer**: Only one task can be tracked at a time; switching tasks auto-pauses the current one
- **Persistent Timer**: Timer state survives app restarts and background mode

### Google Calendar-Style Day Planner

The main view of the app displays a beautiful day planner with:
- Vertical hour labels (00:00 - 23:59)
- Colored time slots proportional to actual duration
- Current time indicator line
- Day navigation (swipe or tap arrows)
- Tap slots to view details

### Full-Screen Horizontal Timer

A distraction-free timer view featuring:
- Landscape orientation
- Large time display (HH:MM:SS)
- Task name display
- Pause/Resume and Stop controls
- Exit button to return to main app

### Statistics & Charts

Comprehensive analytics including:
- **Bar Chart**: Daily focus time visualization
- **Pie Chart**: Task distribution breakdown
- **Heatmap**: Productivity by hour and day of week
- **Summary Cards**: Total time, average daily, sessions count, etc.

### Data Export

Export your data in two formats:
- **PDF**: Professional formatted reports with charts and statistics
- **CSV**: Detailed time entries for spreadsheet analysis

### Customization

- **15 Color Palettes**: Ocean Breeze, Sunset Vibes, Forest Fresh, and more
- **Dark Mode**: Full dark theme support
- **15 Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese (Simplified & Traditional), Arabic (with RTL), Hindi, Turkish, Dutch

### Local Storage

All data stored locally using Expo SQLite:
- Complete offline functionality
- No internet required
- Permanent time entry history

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Productivity-Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
# or
npx expo start
```

4. Run on a device or emulator:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical devices

## Project Structure

```
/src
  /components
    /timer          # Timer-related components (TimerDisplay, TaskItem)
    /planner        # Day planner components (DayPlanner)
    /charts         # Chart components
    /ui             # Reusable UI components (Button, Card, Input, etc.)
  /screens
    TodayScreen.tsx        # Main day planner view
    TimerScreen.tsx        # Task list and timer controls
    StatisticsScreen.tsx   # Charts and analytics
    SettingsScreen.tsx     # App settings
    FullScreenTimerScreen.tsx  # Landscape timer
  /database
    schema.ts       # SQLite database setup
    queries.ts      # All database queries
  /utils
    timeFormatter.ts   # Time formatting utilities
    dateHelpers.ts     # Date manipulation utilities
    exportHelpers.ts   # PDF/CSV export functionality
  /contexts
    ThemeContext.tsx    # Theme and color palette management
    LanguageContext.tsx # i18n and language management
    TimerContext.tsx    # Timer state management
  /constants
    colors.ts       # 15 color palettes
    languages.ts    # Language definitions
  /locales
    en.json, es.json, fr.json, etc.  # Translation files
  /types
    index.ts        # TypeScript type definitions
  /navigation
    index.tsx       # Navigation configuration
```

## Database Schema

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| task_name | TEXT | Task name |
| color | TEXT | Hex color code |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### time_entries
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| task_id | INTEGER | Foreign key to tasks |
| start_time | DATETIME | Entry start time |
| end_time | DATETIME | Entry end time (null if active) |
| duration_seconds | INTEGER | Total duration |
| is_paused | BOOLEAN | Pause state |
| paused_at | DATETIME | Pause timestamp |
| accumulated_seconds | INTEGER | Time before pause |
| date | DATE | Date for querying |

### settings
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (always 1) |
| color_palette | TEXT | Selected palette ID |
| language | TEXT | Language code |
| dark_mode | BOOLEAN | Dark mode state |

## Adding New Languages

1. Create a new JSON file in `/src/locales/` (e.g., `sv.json` for Swedish)

2. Copy the structure from `en.json` and translate all strings

3. Add the language to `/src/constants/languages.ts`:
```typescript
{
  code: 'sv',
  name: 'Swedish',
  nativeName: 'Svenska',
  flag: '🇸🇪',
  rtl: false,
}
```

4. Import and add to `LanguageContext.tsx`:
```typescript
import sv from '../locales/sv.json';

// In resources object:
sv: { translation: sv },
```

## Adding New Color Palettes

Add to `/src/constants/colors.ts`:

```typescript
{
  id: 'my_palette',
  name: 'My Custom Palette',
  colors: [
    '#FF0000', // Color 1
    '#00FF00', // Color 2
    '#0000FF', // Color 3
    // Add 5-8 colors
  ],
  preview: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
}
```

## Available Color Palettes

1. **Ocean Breeze** - Blues and teals
2. **Sunset Vibes** - Oranges, pinks, purples
3. **Forest Fresh** - Greens and earth tones
4. **Lavender Dreams** - Purples and soft pinks
5. **Citrus Pop** - Yellows, oranges, limes
6. **Berry Blend** - Reds, purples, pinks
7. **Pastel Paradise** - Soft pastels
8. **Neon Nights** - Bright neon colors
9. **Professional** - Blues, grays, subtle colors
10. **Monochrome+** - Grays with accent color
11. **Autumn Harvest** - Browns, oranges, reds
12. **Candy Shop** - Bright pinks, blues, yellows
13. **Nordic Cool** - Grays, blues, minimal
14. **Tropical Punch** - Bright tropical colors
15. **Earth Tones** - Browns, beiges, muted greens

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Arabic (ar) - RTL support
- Hindi (hi)
- Turkish (tr)
- Dutch (nl)

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Database**: Expo SQLite
- **Internationalization**: i18next / react-i18next
- **Charts**: react-native-chart-kit
- **Date Handling**: date-fns
- **Export**: expo-print, expo-file-system, expo-sharing

## Troubleshooting

### Timer Not Updating
- Ensure the app has proper permissions
- Check if another task's timer is active
- Restart the app to restore timer state

### Charts Not Displaying
- Make sure you have time entries for the selected period
- Try switching between Week/Month views

### Export Not Working
- Ensure the app has storage permissions
- Check available device storage

### Language Not Changing
- Some changes may require app restart
- RTL languages may need additional configuration

### Database Issues
- Clear app data and restart
- Check for database initialization errors in console

## Performance Tips

- The app uses memoization for expensive calculations
- Timer updates are optimized to prevent full re-renders
- Database queries use indexes for fast lookups
- Lazy loading is implemented for large datasets

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and feature requests, please open a GitHub issue.
