import os
import secrets
import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from passlib.hash import bcrypt

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
    )

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

        token = secrets.token_hex(32)
        cur.execute(
            "INSERT INTO Sessions (token, user_id) VALUES (%s, %s)",
            (token, user_id),
        )
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

        token = secrets.token_hex(32)
        cur.execute(
            "INSERT INTO Sessions (token, user_id) VALUES (%s, %s)",
            (token, user["id"]),
        )
        conn.commit()

        user.pop("password_hash")
        user["created_at"] = user["created_at"].isoformat()

        return jsonify({"token": token, "user": user}), 200
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, port = 5001)
