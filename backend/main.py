# This file starts the backend server.
# It creates the FastAPI app and connects all route files.
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse

import os
import traceback

# Import API route modules.
# Prefer the package layout used by this repo, but keep a fallback for
# direct execution from within the backend directory.
try:
    from backend.auth import ensure_admin_user
    from backend.database import DatabaseUnavailableError
    from backend.routes import auth, dashboard, documents, upload, users
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.auth", "backend.database", "backend.routes"}:
        raise
    from auth import ensure_admin_user
    from database import DatabaseUnavailableError
    from routes import auth, dashboard, documents, upload, users


_BACKEND_ROOT = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_ROOT.parent


def _frontend_roots() -> list[Path]:
    # Look in the module tree first, then the current working directory.
    # This keeps the app resilient when Uvicorn is started from a sibling checkout
    # or from a different app directory.
    roots: list[Path] = []
    seen: set[Path] = set()
    for anchor in (Path(__file__).resolve().parent, Path.cwd().resolve()):
        for root in (anchor, *anchor.parents):
            if root in seen:
                continue
            seen.add(root)
            roots.append(root)
    return roots


def _get_frontend_dist() -> Path | None:
    for root in _frontend_roots():
        for candidate in (root / "frontend" / "dist", root / "dist"):
            if candidate.is_dir():
                return candidate
    return None


def _is_db_unavailable(exc: Exception) -> bool:
    if isinstance(exc, DatabaseUnavailableError):
        return True
    message = str(exc).lower()
    return "mongodb is unreachable" in message or "database unavailable" in message


def _database_unavailable_payload() -> dict[str, str]:
    message = "Database unavailable. Please check internet/DNS and MongoDB connectivity."
    return {"detail": message, "error": message}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Ensure the unique admin account exists if configured via env.
    try:
        ensure_admin_user()
    except Exception as exc:
        # Allow API process to start even when DB is temporarily unreachable.
        print(f"[startup-warning] ensure_admin_user skipped: {exc}")
    yield


# Basic app details shown in API docs.
app = FastAPI(title="DocuAgent Backend", version="1.0.0", lifespan=lifespan)


# Healthcheck API: confirms backend is running.
@app.get("/api/health")
def healthcheck():
    return {"status": "ok", "service": "DocuAgent Backend"}


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception as exc:
        if _is_db_unavailable(exc):
            return JSONResponse(status_code=503, content=_database_unavailable_payload())
        raise
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "same-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return response


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    if _is_db_unavailable(exc):
        return JSONResponse(status_code=503, content=_database_unavailable_payload())

    # If SHOW_TRACEBACK=true, include full traceback in error response.
    show_trace = os.getenv("SHOW_TRACEBACK", "false").lower() == "true"
    content = {"detail": str(exc), "error": str(exc)}
    if show_trace:
        content["trace"] = traceback.format_exc()
    return JSONResponse(status_code=500, content=content)


# Attach all routers to this app.
# These routers are defined in separate files in the routes/ directory.
app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(users.router)


def _frontend_build_missing() -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "service": "DocuAgent Backend",
            "message": "Frontend bundle not found. The checked-in build should live in frontend/dist.",
        },
    )


@app.get("/", include_in_schema=False)
@app.get("/{path_name:path}", include_in_schema=False)
def frontend_spa(path_name: str = ""):
    frontend_dist = _get_frontend_dist()
    if frontend_dist is None:
        return _frontend_build_missing()

    if path_name:
        candidate = (frontend_dist / path_name).resolve()
        try:
            candidate.relative_to(frontend_dist.resolve())
        except ValueError:
            candidate = None

        if candidate is not None and candidate.is_file():
            return FileResponse(candidate)

    index_file = frontend_dist / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return _frontend_build_missing()
