# Soundex

A music discovery platform for browsing albums, rating releases, and writing reviews.

## Prerequisites

Install Docker Desktop, or Docker Engine with the Docker Compose plugin. Verify that Compose is available:

```sh
docker compose version
```

Node.js, Python, and MySQL do not need to be installed on the host.

## Run with Docker Compose

1. Create a `.env` file in the repository root:

   ```dotenv
   MYSQL_ROOT_PASSWORD=choose-a-root-password
   MYSQL_DATABASE=soundex
   MYSQL_USER=soundex
   MYSQL_PASSWORD=choose-an-app-password
   ```

Use non-empty passwords and keep this file private. Docker Compose passes the application credentials to the backend and sets its database host to the`mysql` service automatically.


2. Build and start MySQL, the Flask backend, and the Vite frontend:

   ```sh
   docker compose up --build -d
   ```

3. After MySQL finishes starting, initialize the database tables:

   ```sh
   docker compose exec backend python setup_db.py
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The backend API is available at
[http://localhost:5001](http://localhost:5001).

### Common commands

View service status:

```sh
docker compose ps
```

Follow logs from all services:

```sh
docker compose logs -f
```

Start the existing containers again:

```sh
docker compose up -d
```

Rebuild after changing application code or dependencies:

```sh
docker compose up --build -d
```

Stop and remove the containers while preserving MySQL data:

```sh
docker compose down
```

To also delete the database volume and start with an empty database, run
`docker compose down -v`, then repeat the startup and database initialization
steps above.

## Importing album metadata

Like RateYourMusic (RYM) and Album of the Year (AOTY), Soundex reads album metadata from its own MySQL database. It does not fetch or enrich releases through a third-party API.

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
