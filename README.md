# Soundex
A music database and tracking platform for discovering albums, rating music, and writing reviews.

## Metadata helpers
Album/artist metadata comes from MusicBrainz and the Cover Art Archive, but only through our Flask backend (`backend/`) — the frontend never calls musicbrainz.org or coverartarchive.org directly. `src/api/albums.js` calls our own `/api/albums` routes.

## WHAT WE NEED HERE

* A description of the problem you are trying to solve.
∗ Any details regarding instructions for the user interface that is beyond the obvious.
∗ A list of libraries you are using.
∗ A list of other resources.
∗ Descriptions of any extra features implemented (beyond the project proposal)
* Include a description of the separation of work (who was responsible for what pieces
of the program).
