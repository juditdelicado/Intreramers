#!/usr/bin/env python3

import hashlib
import html
import mimetypes
import os
import secrets
import sqlite3
import smtplib
import ssl
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("RESET_DB_PATH", ROOT / "password-reset.sqlite3"))
APP_URL = os.getenv("APP_URL", "http://localhost:4173").rstrip("/")
FROM_EMAIL = os.getenv("SMTP_FROM", "noreply@intreramers.cat")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
RESET_TTL_MINUTES = int(os.getenv("RESET_TTL_MINUTES", "30"))


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            password_hash TEXT,
            expires_at INTEGER NOT NULL,
            used_at INTEGER DEFAULT NULL,
            created_at INTEGER NOT NULL
        )
        """
    )
    return connection


def json_response(handler, status, payload):
    import json

    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler):
    import json

    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0 or length > 10_000:
        return None
    try:
        return json.loads(handler.rfile.read(length).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def valid_email(email):
    return isinstance(email, str) and email.lower().endswith("@campus.eram.cat")


def send_reset_email(email, reset_url):
    if not SMTP_HOST:
        raise RuntimeError("SMTP_HOST is not configured")

    message = EmailMessage()
    message["From"] = FROM_EMAIL
    message["To"] = email
    message["Subject"] = "Intreramers — Restabliment de contrasenya"
    safe_url = html.escape(reset_url)

    message.set_content(
        "Hola,\n\n"
        "Hem rebut una sol·licitud per restablir la contrasenya del teu compte Intreramers.\n"
        f"Obre aquest enllaç dins dels propers {RESET_TTL_MINUTES} minuts:\n\n"
        f"{reset_url}\n\n"
        "Si no has sol·licitat aquest canvi, ignora aquest correu.\n"
    )
    message.add_alternative(
        f"""
        <!doctype html>
        <html lang="ca">
          <body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;">
              <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px;">
                  <tr><td>
                    <h1 style="margin:0 0 12px;font-size:24px;color:#161616;">Restabliment de contrasenya</h1>
                    <p style="margin:0 0 24px;color:#5c5c5c;line-height:1.6;">
                      Hem rebut una sol·licitud per restablir la teva contrasenya.
                    </p>
                    <a href="{safe_url}" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:600;">
                      Restablir contrasenya
                    </a>
                    <p style="margin:24px 0 0;color:#8a8a8a;font-size:12px;line-height:1.5;">
                      Aquest enllaç caduca en {RESET_TTL_MINUTES} minuts.
                      Si no has fet aquesta sol·licitud, pots ignorar aquest correu.
                    </p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
        """,
        subtype="html",
    )

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)


class IntreramersHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/password-reset/request":
            self.handle_reset_request()
            return
        if parsed.path == "/api/password-reset/confirm":
            self.handle_reset_confirm()
            return
        json_response(self, 404, {"error": "Endpoint desconegut"})

    def handle_reset_request(self):
        data = read_json(self)
        email = data.get("email", "").strip().lower() if data else ""

        if not valid_email(email):
            json_response(self, 400, {"error": "Correu institucional invàlid"})
            return

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        import time

        now = int(time.time())
        expires = now + RESET_TTL_MINUTES * 60
        with get_db() as db:
            db.execute(
                "INSERT INTO password_resets (email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (email, token_hash, expires, now),
            )

        reset_url = f"{APP_URL}/?reset={secrets.token_urlsafe(8)}.{token}#password-reset"
        reset_url = reset_url.replace("://", "://")

        try:
            send_reset_email(email, reset_url)
        except Exception as exc:
            print(f"Password reset email failed: {exc}")

        json_response(
            self,
            200,
            {"ok": True, "message": "Si el compte existeix, rebràs un correu de recuperació."},
        )

    def handle_reset_confirm(self):
        data = read_json(self)
        if not data:
            json_response(self, 400, {"error": "Dades invàlides"})
            return

        token = data.get("token", "")
        password_hash = data.get("passwordHash", "")
        if not token or not password_hash:
            json_response(self, 400, {"error": "Dades incompletes"})
            return

        token_value = token.rsplit(".", 1)[-1]
        token_hash = hashlib.sha256(token_value.encode("utf-8")).hexdigest()
        import time

        with get_db() as db:
            row = db.execute(
                "SELECT id, expires_at, used_at FROM password_resets WHERE token_hash = ?",
                (token_hash,),
            ).fetchone()
            now = int(time.time())
            if not row or row["used_at"] or row["expires_at"] < now:
                json_response(self, 400, {"error": "Enllaç invàlid o caducat"})
                return
            db.execute(
                "UPDATE password_resets SET used_at = ?, password_hash = ? WHERE id = ?",
                (now, password_hash, row["id"]),
            )

        json_response(self, 200, {"ok": True, "message": "Contrasenya actualitzada."})

    def guess_mime_type(self, path):
        return mimetypes.guess_type(path)[0] or "application/octet-stream"

    def send_head(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            return super().send_head()
        if parsed.path.startswith("/api/"):
            json_response(self, 404, {"error": "Endpoint desconegut"})
            return None
        return super().send_head()


if __name__ == "__main__":
    get_db()
    port = int(os.getenv("PORT", "4173"))
    server = ThreadingHTTPServer(("0.0.0.0", port), IntreramersHandler)
    print(f"Intreramers running on http://0.0.0.0:{port}")
    server.serve_forever()
