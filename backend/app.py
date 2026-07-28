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
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
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
    # Must be stacked under @auth_required (applied above it in source, so
    # it runs after) — relies on current_user_id already being resolved.
    def decorator(f):
        @wraps(f)
        def decorator_function(*args, **kwargs):
            if not hasattr(g, "current_user"):
                return jsonify({"message": "Login required"}), 401
            user = g.current_user
            if user["role"] not in allowed_roles:
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
@app.route("/api/albums", methods=["GET"])
def get_albums():
 conn = get_db_connection()
 cur = conn.cursor(dictionary=True)
 try:
     #Select them all
     cur.execute("SELECT * FROM Albums")
     albums = cur.fetchall()

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
     #get album where album id matches
     cur.execute("SELECT * FROM Albums WHERE id = %s", (album_id,))
     album = cur.fetchone()

     #if album doesn't exist
     if not album:
         return jsonify({"message": "Album not found"}), 404

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

#for adding albums
@app.route("/api/albums", methods=["POST"])
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
 
  conn = get_db_connection()
  cur = conn.cursor(Dictionary=True)

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
    
     #For genre (same process
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
        release_date = f"{year}-01-01"

        #put it all together and insert it
        cur.execute("INSERT INTO Albums(title, artist_id, genre_id, release_date)
                     VALUES (%s, %s, %s, %s)", (title, artist_id, genre_id, release_date))

        conn.commit()
        return jsonify({"message": "Album added"}), 201

    finally:
        cur.close()
        conn.close()
                                   

if __name__ == "__main__":
    app.run(host="0.0.0.0", port = 5001, debug = True)
