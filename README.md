# Soundex

A music discovery platform for browsing albums, rating releases, and writing reviews.

## Prerequisites

Ensure you have the following installed:

- Node.js 20.19+ or 22.12+
- Python 3
- MySQL

## Installation

1. Install the frontend dependencies

   ```sh
   npm install
   ```

2. Install the backend dependencies

   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   python3 -m pip install -r backend/requirements.txt
   ```

3. Configure the database

   Copy the example environment file and update it with your MySQL credentials:

   ```sh
   cp backend/.env.example backend/.env
   ```

   Create the database named by `MYSQL_DATABASE`, then initialize its tables:

   ```sh
   python3 backend/setup_db.py
   ```

4. Start the application

   Start the backend:

   ```sh
   source .venv/bin/activate
   python3 backend/app.py
   ```

   In another terminal, start the frontend:

   ```sh
   npm run dev
   ```

## Importing album metadata

Soundex reads album metadata from its own MySQL database. It does not fetch or
enrich releases through MusicBrainz.

The repository includes a curated starter file at
`backend/seed_data/albums.json`. Validate it without touching the database:

```sh
python3 backend/seed_db.py --dry-run
```

After running `backend/setup_db.py`, import the starter data:

```sh
python3 backend/seed_db.py
```

The importer is safe to rerun. It reuses artists and genres, updates an existing
album with the same title and artist, and inserts or updates optional tracks by
their position. Every import runs in one transaction and is rolled back if a
record fails.

To import another curated file:

```sh
python3 backend/seed_db.py --file /absolute/path/to/albums.json
```

Each album requires `title`, `artist`, and `genre`. `release_date` must be a
complete `YYYY-MM-DD` value or `null`; `cover_image_url` must be an HTTP(S) URL
or `null`. Tracks are optional:

```json
{
  "albums": [
    {
      "title": "Example Album",
      "artist": "Example Artist",
      "genre": "Rock",
      "release_date": "2026-07-28",
      "cover_image_url": "https://example.com/cover.jpg",
      "tracks": [
        {
          "position": 1,
          "title": "Opening Track",
          "duration": 215,
          "audio_url": null
        }
      ]
    }
  ]
}
```
