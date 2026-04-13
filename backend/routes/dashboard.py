from fastapi import APIRouter, Depends

# Import collection accessor with fallback for alternate execution paths.
try:
    from backend.auth import get_current_user, is_admin_role
    from backend.database import get_collection
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.database", "backend.auth"}:
        raise
    from auth import get_current_user, is_admin_role
    from database import get_collection

# Dashboard endpoints are grouped under /api/dashboard.
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# Helper to count documents by risk level.
# Supports both legacy top-level and nested analysis structure.
def _count_by_level(collection, level: str, base_query: dict) -> int:
    return collection.count_documents(
        {
            "$and": [
                base_query,
                {
                    "$or": [
                        {"overall_risk_level": level},
                        {"analysis.overall_risk_level": level},
                    ]
                },
            ]
        }
    )


@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Fetch MongoDB collection once for all dashboard queries.
    collection = get_collection()
    is_admin = is_admin_role(current_user.get("role"))
    base_query = {}
    if not is_admin:
        base_query = {"uploaded_by": current_user.get("_id")}

    # Overall document count.
    total_documents = collection.count_documents(base_query)

    # Risk distribution counts used by dashboard charts/cards.
    high_risk = _count_by_level(collection, "High", base_query)
    medium_risk = _count_by_level(collection, "Medium", base_query)
    low_risk = _count_by_level(collection, "Low", base_query)

    return {
        "total_documents": total_documents,
        "risk_breakdown": {"high": high_risk, "medium": medium_risk, "low": low_risk},
        "scope": "global" if is_admin else "personal",
    }
