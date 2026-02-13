// ═══════════════════════════════════════════════════════════
// SHARED DATABASE HELPERS
// ═══════════════════════════════════════════════════════════

const CONFIG = {
  MAX_TRACKS_DISPLAY: 3000,
  TOAST_DURATION: 2500,
  AUTO_SAVE_DELAY: 400,
  SEARCH_DEBOUNCE: 300,
  STYLES_TO_EXCLUDE: ['AA Remix']
};

const DB_HELPERS = {
  async fetchStyleSongRows(styleId) {
    const { data, error } = await window.db
      .from('sim_style_songs')
      .select('library_song_id, sim_duration_seconds, library_songs(id, artist, title, album, peak_year, run_time_seconds, styles)')
      .eq('style_id', styleId);

    if (error) throw error;

    return (data || [])
      .filter(r => r && r.library_song_id)
      .map(r => {
        const s = r.library_songs || null;
        return {
          song_id: r.library_song_id,
          sim_duration_seconds: r.sim_duration_seconds ?? null,
          song: s ? {
            id: s.id ?? null,
            artist: s.artist ?? '',
            title: s.title ?? '',
            album: s.album ?? '',
            year: s.peak_year ?? '',
            run_time_seconds: s.run_time_seconds ?? 0,
            styles: s.styles ?? ''
          } : null
        };
      });
  },

  async fetchAssignments(styleId) {
    const { data, error } = await window.db
      .from('sim_style_song_classes')
      .select('library_song_id, class_code, moved_at')
      .eq('style_id', styleId);

    if (error) throw error;

    const m = {};
    (data || []).forEach(r => {
      if (!r.library_song_id) return;
      m[r.library_song_id] = {
        class_code: r.class_code,
        moved_at: r.moved_at
      };
    });
    return m;
  },

  async upsertAssignments(rows) {
    const payload = (rows || [])
      .filter(r => r && r.song_id && r.style_id)
      .map(r => ({
        style_id: r.style_id,
        class_code: r.class_code,
        library_song_id: r.song_id
      }));

    return await window.db
      .from('sim_style_song_classes')
      .upsert(payload, { onConflict: 'library_song_id,style_id' });
  },

  async deleteAssignments(styleId, songIds) {
    return await window.db
      .from('sim_style_song_classes')
      .delete()
      .eq('style_id', styleId)
      .in('library_song_id', songIds);
  },

  normalizeClassCode(rawClass) {
    if (!rawClass) return null;
    return String(rawClass).toLowerCase() === 'rest' 
      ? 'REST' 
      : String(rawClass).toUpperCase();
  }
};

const ClassCodes = {
  ALL: ['A', 'B', 'C', 'REST'],
  
  normalize(code) {
    if (!code) return null;
    return String(code).toLowerCase() === 'rest' ? 'REST' : String(code).toUpperCase();
  },
  
  isValid(code) {
    return this.ALL.includes(this.normalize(code));
  },
  
  getDisplayName(code, labels = {}) {
    const normalized = this.normalize(code);
    if (!normalized) return 'Uncategorized';
    const label = labels[normalized];
    const baseName = normalized === 'REST' ? 'Rest' : normalized;
    return label ? `${baseName} — ${label}` : baseName;
  }
};

// Utility functions
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function safeExecute(fn, errorMessage) {
  try {
    return await fn();
  } catch (err) {
    console.error(errorMessage, err);
    if (typeof showToast === 'function') {
      showToast(`❌ ${errorMessage}: ${err.message}`);
    }
    return null;
  }
}
