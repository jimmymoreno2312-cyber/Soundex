Soundex
=======

<<<<<<< HEAD
## Metadata helpers
Album/artist metadata comes from MusicBrainz and the Cover Art Archive, but only through our Flask backend (`backend/`) — the frontend never calls musicbrainz.org or coverartarchive.org directly. `src/api/albums.js` calls our own `/api/albums` routes.

## WHAT WE NEED HERE

* A description of the problem you are trying to solve.
* Any details regarding instructions for the user interface that is beyond the obvious.
* A list of libraries you are using.
* A list of other resources.
* Descriptions of any extra features implemented (beyond the project proposal)
* Include a description of the separation of work (who was responsible for what pieces
of the program).
=======
A music discovery platform for browsing albums, rating releases, and writing reviews.

Prerequisites
-------------

Ensure you have the following installed:

- Node.js 20.19+ or 22.12+
- Python 3
- MySQL

Installation
------------

1. Install the frontend dependencies

From the Soundex project directory, run:

    npm install

2. Install the backend dependencies

Create and activate a Python virtual environment, then install the required packages:

    python3 -m venv .venv
    source .venv/bin/activate
    python3 -m pip install -r backend/requirements.txt

3. Configure the database

Copy the example environment file:

    cp backend/.env.example backend/.env

Update backend/.env with your MySQL credentials. Create the database specified by
MYSQL_DATABASE, then initialize its tables:

    python3 backend/setup_db.py

4. Start the application

Start the backend:

    source .venv/bin/activate
    python3 backend/app.py

In another terminal, start the frontend:

    npm run dev
>>>>>>> 252a8d1 (Updated README (removed references to MusicBrainz and included installation instructions); added backend dependencies)
