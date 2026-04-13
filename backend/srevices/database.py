import os
from pathlib import Path

# This file sets up the connection to MongoDB and provides a helper function to access the collection.
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import ConfigurationError
import dns.resolver

# Load .env from the backend root so startup works from any working directory.
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env")

MONGO_URI = os.getenv("MONGO_URI") or "mongodb://localhost:27017"
if not os.getenv("MONGO_URI"):
    print(f"[startup-warning] MONGO_URI not set, defaulting to {MONGO_URI}")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME") or "DocuAgent"

class DatabaseUnavailableError(RuntimeError):
    pass


def _build_client(uri: str) -> MongoClient:
    # Keep failure detection quick during startup.
    return MongoClient(uri, serverSelectionTimeoutMS=2500, connectTimeoutMS=2500)


def _connect_with_dns_fallback(uri: str) -> MongoClient:
    try:
        client = _build_client(uri)
        client.admin.command("ping")
        return client
    except ConfigurationError as exc:
        msg = str(exc).lower()
        if "dns" not in msg and "resolution lifetime expired" not in msg and "timed out" not in msg:
            raise

    # Router DNS can fail for mongodb+srv lookups; retry with public DNS.
    resolver = dns.resolver.get_default_resolver()
    resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
    resolver.lifetime = 6.0
    resolver.timeout = 3.0

    client = _build_client(uri)
    client.admin.command("ping")
    return client

_client: MongoClient | None = None
_db = None


def _get_db():
    global _client, _db
    if _db is not None:
        return _db
    try:
        _client = _connect_with_dns_fallback(MONGO_URI)
        _db = _client[MONGO_DB_NAME]
        return _db
    except Exception as exc:
        raise DatabaseUnavailableError(
            f"MongoDB is unreachable for MONGO_URI={MONGO_URI!r}. "
            f"Using database {MONGO_DB_NAME!r}. "
            "If using localhost, ensure MongoDB service is running. "
            "If using Atlas, verify URI, credentials, and Network Access allowlist."
        ) from exc


def get_collection() -> Collection:
    return _get_db()["Results"]


def get_users_collection() -> Collection:
    return _get_db()["Users"]


def get_system_collection() -> Collection:
    return _get_db()["SystemConfig"]
