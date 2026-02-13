# Opus Playback Class Manager

A web-based interface for managing playback classes and distribution settings for music streaming automation. Built for Custom Channels radio automation systems.

## Overview

Opus Playback Class Manager provides an intuitive interface for organizing music tracks into playback classes (A, B, C, and Rest) and configuring target distribution percentages for automated playlist generation. The system maintains proper artist/title separation while respecting your defined class proportions.

## Features

### Class Management
- **Four playback classes**: A, B, C, and Rest
- **Custom labels**: Rename classes per style (e.g., "Power," "Core," "Library")
- **Drag-and-drop track assignment**: Move tracks between classes with visual feedback
- **Bulk operations**: Select and move multiple tracks at once

###  Distribution Control
- **Interactive mix widget**: Drag handles to adjust class proportions
- **Percentage-based targeting**: Set exact distribution goals (totals must equal 100%)
- **Visual feedback**: Color-coded segments show current class mix
- **Auto-save**: Changes persist automatically to Supabase

###  Track Management
- **Search and filter**: Find tracks by title, artist, or album
- **Multiple sort options**: Sort by title, artist, album, year, or move date
- **Track limiting**: Displays first 3,000 tracks per style for performance
- **Style stats**: See assignment progress for each playlist

###  Keyboard Shortcuts
- `Ctrl/Cmd + A`: Select all visible tracks
- `Escape`: Clear selection

###  User Experience
- **Collapsible sidebar**: Hide styles panel for more working space
- **Debounced search**: Smooth performance with large datasets
- **Loading indicators**: Visual feedback on all async operations
- **Toast notifications**: Confirmation messages for successful operations

## Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (Apache, Nginx, or development server)
- Supabase account with configured database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/opus-playback-manager.git
   cd opus-playback-manager
   ```

2. **Configure Supabase**
   
   Update the Supabase credentials in all three HTML files:
   ```javascript
   const SUPABASE_URL = 'your-project-url.supabase.co';
   const SUPABASE_KEY = 'your-anon-public-key';
   ```

3. **Deploy files**
   
   Place all files in your web server directory:
   ```
   /your-web-root/
   ├── index.html
   ├── class-detail.html
   ├── uncategorized-detail.html
   ├── db-helpers.js
   └── class-labels.js
   ```

4. **Verify MIME types**
   
   Ensure your server serves JavaScript files with correct MIME types:
   ```
   .js → application/javascript
   .html → text/html
   ```

## Database Schema

### Required Tables

#### `sim_styles`
Stores playlist/style definitions.
```sql
CREATE TABLE sim_styles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);
```

#### `sim_style_songs`
Links songs to styles with playback duration.
```sql
CREATE TABLE sim_style_songs (
  style_id UUID REFERENCES sim_styles(id),
  library_song_id UUID REFERENCES library_songs(id),
  sim_duration_seconds INTEGER,
  PRIMARY KEY (style_id, library_song_id)
);
```

#### `library_songs`
Master song library with metadata.
```sql
CREATE TABLE library_songs (
  id UUID PRIMARY KEY,
  title TEXT,
  artist TEXT,
  album TEXT,
  peak_year INTEGER,
  run_time_seconds INTEGER,
  styles TEXT
);
```

#### `sim_style_song_classes`
Tracks class assignments per style.
```sql
CREATE TABLE sim_style_song_classes (
  style_id UUID REFERENCES sim_styles(id),
  library_song_id UUID REFERENCES library_songs(id),
  class_code TEXT NOT NULL,
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (style_id, library_song_id)
);
```

#### `sim_style_class_weights`
Stores target distribution percentages.
```sql
CREATE TABLE sim_style_class_weights (
  style_id UUID REFERENCES sim_styles(id),
  class_code TEXT NOT NULL,
  weight_pct INTEGER NOT NULL,
  PRIMARY KEY (style_id, class_code)
);
```

## Usage

### Managing Classes

1. **Select a style** from the left sidebar
2. **View uncategorized tracks** by clicking "View Uncategorized"
3. **Assign tracks** by selecting them and clicking a class button
4. **View class details** by clicking "View songs" next to each class

### Setting Distribution Mix

1. Select a style
2. Use the **Class Mix** widget to set target percentages
3. **Drag handles** between segments or **type exact values**
4. Click **Reset** to return to defaults (A:30%, B:40%, C:30%, Rest:0%)

### Customizing Labels

1. Click **Edit class labels**
2. Enter custom names (e.g., "Power Rotation", "Core Library")
3. Labels are **style-specific** and persist in browser localStorage
4. Click **Reset** to clear all labels

## File Structure

```
.
├── index.html                    # Main manager page
├── class-detail.html             # Individual class view
├── uncategorized-detail.html     # Unassigned tracks view
├── db-helpers.js                 # Shared database utilities
├── class-labels.js               # Label management system
└── README.md                     # This file
```

## Architecture

### Shared Utilities (`db-helpers.js`)

- `DB_HELPERS.fetchStyleSongRows()` - Retrieves songs with metadata
- `DB_HELPERS.fetchAssignments()` - Gets class assignments
- `DB_HELPERS.upsertAssignments()` - Saves class changes
- `DB_HELPERS.deleteAssignments()` - Removes assignments
- `DB_HELPERS.normalizeClassCode()` - Ensures consistent class naming
- `ClassCodes` - Utility object for class code operations
- `CONFIG` - Centralized configuration constants

### Label Management (`class-labels.js`)

- Style-specific label storage in localStorage
- Automatic UI synchronization across all pages
- Modal interface for label editing
- Fallback to class codes when labels not set

### Pages

#### `index.html` - Main Manager
- Overview of all classes and their track counts
- Interactive class mix widget
- Style selection and stats
- Navigation to detail views

#### `class-detail.html` - Class View
- View all tracks in a specific class
- Move tracks to other classes
- Sort and filter tracks
- Track metadata display

#### `uncategorized-detail.html` - Assignment View
- View all unassigned tracks
- Bulk assignment to classes
- Search and filter capabilities
- Track assignment history

## Configuration

### Constants (`CONFIG` in db-helpers.js)

```javascript
const CONFIG = {
  MAX_TRACKS_DISPLAY: 3000,      // Max tracks shown per page
  TOAST_DURATION: 2500,          // Toast notification duration (ms)
  AUTO_SAVE_DELAY: 400,          // Debounce delay for auto-save (ms)
  SEARCH_DEBOUNCE: 300,          // Search input debounce (ms)
  STYLES_TO_EXCLUDE: ['AA Remix'] // Styles hidden from UI
};
```

### Default Class Mix

```javascript
const DEFAULT_WEIGHTS = { 
  A: 30,    // High-priority tracks
  B: 40,    // Core rotation
  C: 30,    // Library depth
  REST: 0   // Rested/on-hold tracks
};
```

## Performance Considerations

- **Track limiting**: Only first 3,000 tracks displayed per style
- **Batch loading**: Style stats load in parallel with Promise.allSettled()
- **Debounced search**: 300ms delay prevents excessive re-renders
- **Optimistic UI**: Immediate visual feedback before database confirmation
- **Lazy loading**: Stats load only when needed

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ IE11 not supported (uses modern JavaScript features)

## Known Limitations

1. **Track cap**: Only first 3,000 tracks shown per style for performance
2. **Browser storage**: Class labels stored in localStorage (per-browser)
3. **Real-time sync**: Changes don't sync across multiple browser tabs
4. **Network requirement**: Requires active internet for Supabase access

## Troubleshooting

### Tracks not loading
- Check browser console for errors
- Verify Supabase credentials are correct
- Confirm database tables exist and have data
- Check network tab for failed API requests

### Labels not persisting
- Ensure localStorage is enabled in browser
- Check browser privacy settings
- Try clearing localStorage and re-entering labels

### Slow performance
- Reduce number of tracks per style (database level)
- Check network connection speed
- Clear browser cache
- Use modern browser version

### Class mix not saving
- Verify Supabase write permissions
- Check console for database errors
- Ensure percentages total exactly 100%

## Development

### Local Development Server

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

### Testing Changes

1. Make changes to HTML/JS files
2. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Check console for errors
4. Test all CRUD operations
5. Verify data persists in Supabase

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for Custom Channels radio automation
- Uses [Supabase](https://supabase.com) for backend database
- Inspired by professional radio programming workflows

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Version**: 2.0.0  
**Last Updated**: February 2026  
**Maintainer**: Custom Channels Development Team
