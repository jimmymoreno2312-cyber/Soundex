# Soundex
A music database and tracking platform for discovering albums, rating music, and writing reviews.

## Metadata helpers
Album/artist metadata comes from MusicBrainz and the Cover Art Archive, but only through our Flask backend (`backend/`) — the frontend never calls musicbrainz.org or coverartarchive.org directly. `src/api/albums.js` calls our own `/api/albums` routes.
