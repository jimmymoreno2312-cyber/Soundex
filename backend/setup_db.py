import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.environ["MYSQL_HOST"],
    user=os.environ["MYSQL_USER"],
    password=os.environ["MYSQL_PASSWORD"],
    database=os.environ["MYSQL_DATABASE"],
)
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS Genres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Artists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NULL
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist_id INT NOT NULL,
        genre_id INT NOT NULL,
        release_date DATE,
        cover_image_url VARCHAR(500),
        FOREIGN KEY (artist_id) REFERENCES Artists(id),
        FOREIGN KEY (genre_id) REFERENCES Genres(id)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Songs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist_id INT NOT NULL,
        album_id INT NOT NULL,
        duration INT,
        audio_url VARCHAR(500),
        position INT NOT NULL,
        FOREIGN KEY (artist_id) REFERENCES Artists(id),
        FOREIGN KEY (album_id) REFERENCES Albums(id)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS SongFeatures (
        song_id INT NOT NULL,
        artist_id INT NOT NULL,
        PRIMARY KEY (song_id, artist_id),
        FOREIGN KEY (song_id) REFERENCES Songs(id),
        FOREIGN KEY (artist_id) REFERENCES Artists(id)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Sessions (
        token VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        album_id INT NOT NULL,
        score INT NOT NULL,
        body TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (user_id, album_id),
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (album_id) REFERENCES Albums(id),
        CHECK (score BETWEEN 0 AND 100)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS Lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS ListItems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        list_id INT NOT NULL,
        album_id INT NOT NULL,
        position INT NOT NULL,
        UNIQUE (list_id, album_id),
        FOREIGN KEY (list_id) REFERENCES Lists(id),
        FOREIGN KEY (album_id) REFERENCES Albums(id)
    )
""")

conn.commit()
cur.close()
conn.close()
print("Tables created")
