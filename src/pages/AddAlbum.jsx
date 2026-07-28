//generated with help from Claude. Frontend stuff.

import { useState } from 'react';
import { addAlbum } from '../api/albums';

export default function AddAlbum() {
  const [album, setAlbum] = useState({
    title: '',
    artist: '',
    genre: '',
    year: '',
  });

  function handleChange(e) {
    setAlbum({
      ...album,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
  e.preventDefault();

  try {
    await addAlbum({
      title: album.title,
      artist: album.artist,
      genre: album.genre,
      year: album.year,
    });

    alert("Album added!");

    setAlbum({
      title: '',
      artist: '',
      genre: '',
      year: '',
    });

  } catch (err) {
    alert(err.message || "Failed to add album");
  }
}

  return (
    <div className="add-album-page">
      <h1>Add Album</h1>

      <form onSubmit={handleSubmit} className="album-form">

        <label>
          Album Title
          <input
            type="text"
            name="title"
            value={album.title}
            onChange={handleChange}
          />
        </label>

        <label>
          Artist
          <input
            type="text"
            name="artist"
            value={album.artist}
            onChange={handleChange}
          />
        </label>

        <label>
          Genre
          <input
            type="text"
            name="genre"
            value={album.genre}
            onChange={handleChange}
          />
        </label>

        <label>
          Release Year
          <input
            type="number"
            name="year"
            value={album.year}
            onChange={handleChange}
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Add Album
        </button>

      </form>
    </div>
  );
}
