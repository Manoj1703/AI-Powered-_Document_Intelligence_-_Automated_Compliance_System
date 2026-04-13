from __future__ import annotations

from importlib import import_module
import sys

_MODULE_ALIASES = {
    "app.auth": "backend.auth",
    "app.database": "backend.database",
    "app.main": "backend.main",
    "app.routes": "backend.routes",
    "app.routes.auth": "backend.routes.auth",
    "app.routes.dashboard": "backend.routes.dashboard",
    "app.routes.documents": "backend.routes.documents",
    "app.routes.upload": "backend.routes.upload",
    "app.routes.users": "backend.routes.users",
    "app.routes.pdfinternals": "backend.routes.pdfinternals",
}

for alias, target in _MODULE_ALIASES.items():
    sys.modules.setdefault(alias, import_module(target))

