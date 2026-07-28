import os
import secrets
import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from functools import wraps
 

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ["RAILWAY_MYSQL_HOST"],
        port=int(os.environ["RAILWAY_MYSQL_PORT"]),
        user=os.environ["RAILWAY_MYSQL_USER"],
        password=os.environ["RAILWAY_MYSQL_PASSWORD"],
        database=os.environ["RAILWAY_MYSQL_DATABASE"],
    )

def create_session(cur, user_id):
    cur.execute("DELETE FROM Sessions WHERE expires_at < NOW()")
    token = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(hours=24)
    cur.execute(
        "INSERT INTO Sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
        (token, user_id, expires_at),
    )
    return token

def get_token_from_header():
    token = request.headers.get("Authorization", "")
    if not token.startswith("Bearer "):
        return None
    return token[len("Bearer "):]

def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"message": "Missing bearer token"}), 401

        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute("SELECT user_id, role FROM Sessions JOIN Users ON Sessions.user_id = Users.id WHERE token = %s AND expires_at > NOW()", (token,))
            current_user = cur.fetchone()
            if not current_user:
                return jsonify({"message": "Invalid or expired token"}), 401
            g.current_user = current_user
            return f(*args, **kwargs)
        finally:
            cur.close()
            conn.close()
    return decorator

def require_role(*allowed_roles):
    #must be used under @auth_required
    def decorator(f):
        @wraps(f)
        def decorator_function(*args, **kwargs):
            if g.current_user["role"] not in allowed_roles:
                return jsonify({"message": "You don't have permission"}), 403
            return f(*args, **kwargs)
        return decorator_function
    return decorator

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM Users WHERE username = %s", (username,))
        if cur.fetchone():
            return jsonify({"message": "Username is already taken"}), 409
        cur.execute("SELECT id FROM Users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"message": "Email is already registered"}), 409

        password_hash = bcrypt.hash(password)
        cur.execute(
            "INSERT INTO Users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, password_hash),
        )
        user_id = cur.lastrowid
        token = create_session(cur, user_id)
        conn.commit()

        cur.execute(
            "SELECT id, username, email, role, created_at FROM Users WHERE id = %s",
            (user_id,),
        )
        user = cur.fetchone()
        user["created_at"] = user["created_at"].isoformat()

        return jsonify({"token": token, "user": user}), 201
    finally:
        cur.close()
        conn.close()


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"message": "Username/email and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT id, username, email, password_hash, role, created_at FROM Users "
            "WHERE username = %s OR email = %s",
            (identifier, identifier),
        )
        user = cur.fetchone()

        if not user or not bcrypt.verify(password, user["password_hash"]):
            return jsonify({"message": "Invalid username/email or password"}), 401

        token = create_session(cur, user["id"])
        conn.commit()

        user.pop("password_hash")
        user["created_at"] = user["created_at"].isoformat()

        return jsonify({"token": token, "user": user}), 200
    finally:
        cur.close()
        conn.close()


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    token = get_token_from_header()
    if not token:
        return jsonify({"message": "Missing bearer token"}), 401

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Sessions WHERE token = %s", (token,))
        conn.commit()
        return jsonify({"message": "Logged out"}), 200
    finally:
        cur.close()
        conn.close()

#Get all albums
#how to implement dynamic queries: https://medium.com/@brksglm/creating-dynamic-queries-with-sql-4a8686993218
@app.route("/api/albums", methods=["GET"])
def get_albums():
    #grab search and genre parameters
    search = request.args.get("search", "")
    genre = request.args.get("genre", "")

    #build the dynamic query components
    conditions = []
    params = []
    if search:
        conditions.append("Albums.title LIKE %s")
        params.append(f"%{search}%")
    if genre:
        conditions.append("Genres.name = %s")
        params.append(genre)
    where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""

    #join the conditions
    query = f"""
        SELECT 
            Albums.*, 
            Genres.name AS genre, 
            Artists.name AS artist, 
            Albums.cover_image_url AS cover_url, 
            (SELECT AVG(score) FROM Ratings WHERE Ratings.album_id = Albums.id) AS avg_score 
        FROM Albums 
        JOIN Genres ON Albums.genre_id = Genres.id 
        JOIN Artists ON Albums.artist_id = Artists.id
        {where_clause}
    """

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        #execute the query with the parameters
        cur.execute(query, params)
        albums = cur.fetchall()
        #format the average scores to rounded integers
        for album in albums:
            if album["avg_score"] is not None:
                album["avg_score"] = round(float(album["avg_score"]))

        return jsonify(albums), 200
    finally:
        cur.close()
        conn.close()

#get one album
@app.route("/api/albums/<int:album_id>", methods=["GET"])
def get_album(album_id):
  conn = get_db_connection()
  cur = conn.cursor(dictionary=True)

  try:
     #get album, with artist/genre names, cover_url, and average score computed live from Ratings
     cur.execute(
         "SELECT Albums.*, Genres.name AS genre, Artists.name AS artist, "
         "Albums.cover_image_url AS cover_url, "
         "(SELECT AVG(score) FROM Ratings WHERE Ratings.album_id = Albums.id) AS avg_score "
         "FROM Albums "
         "JOIN Genres ON Albums.genre_id = Genres.id "
         "JOIN Artists ON Albums.artist_id = Artists.id "
         "WHERE Albums.id = %s",
         (album_id,),
     )
     album = cur.fetchone()

     #if album doesn't exist
     if not album:
         return jsonify({"message": "Album not found"}), 404

     if album["avg_score"] is not None:
         album["avg_score"] = round(float(album["avg_score"]))

     #otherwise
     return jsonify(album), 200
  finally:
     cur.close()
     conn.close()

#ratings
@app.route("/api/albums/<int:album_id>/ratings", methods=["GET"])
def get_ratings(album_id):
   conn = get_db_connection()
   cur = conn.cursor(dictionary=True)

   try:
       #same as above, just get the ratings instead
       cur.execute("SELECT * FROM Ratings WHERE album_id = %s", (album_id,))

       ratings = cur.fetchall()
       return jsonify(ratings), 200
   finally:
      cur.close()
      conn.close()


#for adding ratings
@app.route("/api/albums/<int:album_id>/ratings", methods=["POST"])
@auth_required
def add_rating(album_id):
    data = request.get_json()
    score = data.get("score")
    body = data.get("body")

    if not isinstance(score, int) or not (0 <= score <= 100):
        return jsonify({"message": "Score must be an integer between 0 and 100"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            "INSERT INTO Ratings (user_id, album_id, score, body) VALUES (%s, %s, %s, %s) "
            "ON DUPLICATE KEY UPDATE score = VALUES(score), body = VALUES(body)",
            (g.current_user["user_id"], album_id, score, body),
        )
        conn.commit()
        return jsonify({"message": "Rating added"}), 201
    finally:
        cur.close()
        conn.close()

#for adding albums
@app.route("/api/albums", methods=["POST"])
@auth_required
@require_role("moderator")
def add_album():
 
  #get data that was input
  data = request.get_json()

  title = data.get("title")
  artist_name = data.get("artist")
  genre_name = data.get("genre")
  year = data.get("year")

 #contingency
  if not title or not artist_name or not genre_name or not year:
     return jsonify({"message": "All fields are required"}), 400

  #error handling
  try:
     year = int(year)
  except (TypeError, ValueError):
     return jsonify({"message": "Release year must be a number (e.g. 1994)"}), 400

  if not (1900 <= year <= 2100):
     return jsonify({"message": "Release year must be between 1900 and 2100"}), 400
  
  conn = get_db_connection()
  cur = conn.cursor(dictionary=True)

  try:
   #find artist
   cur.execute("SELECT id FROM Artists WHERE name=%s", (artist_name,))
   artist=cur.fetchone()

   #if artist exists, pull, else add it
   if artist:
      artist_id = artist["id"]
   else:
     cur.execute("INSERT INTO Artists (name) VALUES (%s)", (artist_name,))
     artist_id = cur.lastrowid
   
   cur.execute("SELECT id FROM Genres WHERE name = %s", (genre_name,))
   genre = cur.fetchone()

   #if exists, pull, else add
   if genre:
       genre_id = genre["id"]
   else:
       cur.execute("INSERT INTO Genres (name) VALUES (%s)",(genre_name,))
       genre_id = cur.lastrowid

   #Add album
   #need release date here though
   release_date = year

   #put it all together and insert it
   cur.execute("INSERT INTO Albums(title, artist_id, genre_id, release_date) VALUES (%s, %s, %s, %s)", (title, artist_id, genre_id, release_date))

   conn.commit()
   return jsonify({"message": "Album added"}), 201

  finally:
     cur.close()
     conn.close()

# Get all of the user's lists
@app.route("/api/lists", methods=["GET"])
@auth_required
def get_lists():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        # Get this user's lists
        cur.execute(
            "SELECT * FROM Lists WHERE user_id = %s",
            (g.current_user["user_id"],),
        )
        lists = cur.fetchall()

        # Send the lists
        return jsonify(lists), 200
    finally:
        cur.close()
        conn.close()


# Get one list
@app.route("/api/lists/<int:list_id>", methods=["GET"])
@auth_required
def get_list(list_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        # Get this user's list
        cur.execute(
            "SELECT * FROM Lists WHERE id = %s AND user_id = %s",
            (list_id, g.current_user["user_id"]),
        )
        list_details = cur.fetchone()

        if not list_details:
            return jsonify({"message": "List not found"}), 404

        # Get albums in the list
        cur.execute(
            "SELECT Albums.id, Albums.title, Artists.name AS artist, "
            "Genres.name AS genre, Albums.release_date, "
            "Albums.cover_image_url AS cover_url, ListItems.position "
            "FROM ListItems "
            "JOIN Albums ON ListItems.album_id = Albums.id "
            "JOIN Artists ON Albums.artist_id = Artists.id "
            "JOIN Genres ON Albums.genre_id = Genres.id "
            "WHERE ListItems.list_id = %s "
            "ORDER BY ListItems.position",
            (list_id,),
        )

        # Add albums to the list details
        list_details["albums"] = cur.fetchall()

        return jsonify(list_details), 200
    finally:
        cur.close()
        conn.close()

# Edit a list
@app.route("/api/lists/<int:list_id>", methods=["PATCH"])
@auth_required
def update_list(list_id):
    # Read the changes
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            "SELECT * FROM Lists WHERE id = %s AND user_id = %s",
            (list_id, g.current_user["user_id"]),
        )
        list_details = cur.fetchone()

        if not list_details:
            return jsonify({"message": "List not found"}), 404

        # Use old value if a field was not sent
        title = data.get("title", list_details["title"])
        description = data.get("description", list_details["description"])

        if not title:
            return jsonify({"message": "Title is required"}), 400

        cur.execute(
            "UPDATE Lists SET title = %s, description = %s WHERE id = %s",
            (title, description, list_id),
        )
        conn.commit()

        # Return the updated list
        cur.execute("SELECT * FROM Lists WHERE id = %s", (list_id,))
        updated_list = cur.fetchone()

        return jsonify(updated_list), 200
    finally:
        cur.close()
        conn.close()

# Delete a list
@app.route("/api/lists/<int:list_id>", methods=["DELETE"])
@auth_required
def delete_list(list_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            "SELECT id FROM Lists WHERE id = %s AND user_id = %s",
            (list_id, g.current_user["user_id"]),
        )
        list_details = cur.fetchone()

        if not list_details:
            return jsonify({"message": "List not found"}), 404

        # Delete the list
        cur.execute("DELETE FROM Lists WHERE id = %s", (list_id,))
        conn.commit()

        return jsonify({"message": "List deleted"}), 200
    finally:
        cur.close()
        conn.close()


# Add an album to list
@app.route("/api/lists/<int:list_id>/items", methods=["POST"])
@auth_required
def add_list_item(list_id):
    # Read the album ID
    data = request.get_json()
    album_id = data.get("album_id")

    if not album_id:
        return jsonify({"message": "Album ID is required"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            "SELECT id FROM Lists WHERE id = %s AND user_id = %s",
            (list_id, g.current_user["user_id"]),
        )
        list_details = cur.fetchone()

        if not list_details:
            return jsonify({"message": "List not found"}), 404

        # Find the album
        cur.execute("SELECT id FROM Albums WHERE id = %s", (album_id,))
        album = cur.fetchone()

        if not album:
            return jsonify({"message": "Album not found"}), 404

        # Do not add the same album twice
        cur.execute(
            "SELECT id FROM ListItems WHERE list_id = %s AND album_id = %s",
            (list_id, album_id),
        )
        if cur.fetchone():
            return jsonify({"message": "Album is already in this list"}), 409

        # Put the album at the end of the list
        cur.execute(
            "SELECT COALESCE(MAX(position), 0) AS last_position "
            "FROM ListItems WHERE list_id = %s",
            (list_id,),
        )
        last_position = cur.fetchone()["last_position"]
        position = last_position + 1

        cur.execute(
            "INSERT INTO ListItems (list_id, album_id, position) "
            "VALUES (%s, %s, %s)",
            (list_id, album_id, position),
        )
        item_id = cur.lastrowid
        conn.commit()

        return jsonify({
            "id": item_id,
            "list_id": list_id,
            "album_id": album_id,
            "position": position,
        }), 201
    finally:
        cur.close()
        conn.close()


# Remove an album from a list
@app.route(
    "/api/lists/<int:list_id>/items/<int:album_id>",
    methods=["DELETE"],
)
@auth_required
def remove_list_item(list_id, album_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            "SELECT id FROM Lists WHERE id = %s AND user_id = %s",
            (list_id, g.current_user["user_id"]),
        )
        list_details = cur.fetchone()

        if not list_details:
            return jsonify({"message": "List not found"}), 404

        # Find the album in the list
        cur.execute(
            "SELECT id FROM ListItems WHERE list_id = %s AND album_id = %s",
            (list_id, album_id),
        )
        list_item = cur.fetchone()

        if not list_item:
            return jsonify({"message": "Album is not in this list"}), 404

        # Remove the album from the list
        cur.execute(
            "DELETE FROM ListItems WHERE list_id = %s AND album_id = %s",
            (list_id, album_id),
        )
        conn.commit()

        return jsonify({"message": "Album removed from list"}), 200
    finally:
        cur.close()
        conn.close()


# Create a list
@app.route("/api/lists", methods=["POST"])
@auth_required
def create_list():
    # Read the list details
    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")

    if not title:
        return jsonify({"message": "Title is required"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        # Save the list
        cur.execute(
            "INSERT INTO Lists (user_id, title, description) VALUES (%s, %s, %s)",
            (g.current_user["user_id"], title, description),
        )
        list_id = cur.lastrowid
        conn.commit()

        # Return the saved list
        cur.execute(
            "SELECT * FROM Lists WHERE id = %s",
            (list_id,),
        )
        new_list = cur.fetchone()

        return jsonify(new_list), 201
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port = 5001, debug = True)
