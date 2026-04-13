from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

try:
    from backend.auth import get_current_user, is_admin_role
    from backend.database import get_collection
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.database", "backend.auth"}:
        raise
    from auth import get_current_user, is_admin_role
    from database import get_collection

router = APIRouter(prefix="/api", tags=["documents"])


def _flatten_from_analysis(document: dict) -> dict:
    analysis = document.get("analysis") or {}
    metadata = analysis.get("metadata") or {}

    return {
        "id": str(document["_id"]),
        "filename": document.get("filename"),
        "content_length": document.get("content_length"),
        "uploaded_at": document.get("uploaded_at"),
        "created_at": document.get("created_at"),
        "title": analysis.get("title", "Unknown"),
        "document_type": analysis.get("document_type") or metadata.get("document_type", "Unknown"),
        "author": analysis.get("author", "Unknown"),
        "date": analysis.get("date", ""),
        "summary": analysis.get("summary", ""),
        "detailed_summary": analysis.get("detailed_summary", ""),
        "metadata": metadata,
        "key_clauses": analysis.get("key_clauses", []),
        "obligations": analysis.get("obligations", []),
        "risks": analysis.get("risks", []),
        "risk_types": analysis.get("risk_types", []),
        "compliance_issues": analysis.get("compliance_issues", []),
        "overall_risk_level": analysis.get("overall_risk_level", "Unknown"),
    }


def _sort_documents_latest_first(docs: list[dict]) -> list[dict]:
    def key(doc: dict):
        return (
            doc.get("uploaded_at") or doc.get("created_at") or 0,
            doc.get("_id"),
        )

    return sorted(docs, key=key, reverse=True)


@router.get("/documents")
def get_all_documents(current_user: dict = Depends(get_current_user)):
    collection = get_collection()
    is_admin = is_admin_role(current_user.get("role"))
    query = {}
    if not is_admin:
        query = {"uploaded_by": current_user.get("_id")}
    docs = _sort_documents_latest_first(
        list(
            collection.find(
                query,
                {
                    "_id": 1,
                    "filename": 1,
                    "analysis.title": 1,
                    "analysis.document_type": 1,
                    "analysis.overall_risk_level": 1,
                    "uploaded_at": 1,
                    "created_at": 1,
                },
            )
        )
    )

    results = []
    for doc in docs:
        analysis = doc.get("analysis") or {}
        risk_level = analysis.get("overall_risk_level", "Unknown")

        results.append(
            {
                "id": str(doc["_id"]),
                "filename": doc.get("filename"),
                "title": analysis.get("title", "Unknown"),
                "document_type": analysis.get("document_type", "Unknown"),
                "overall_risk_level": risk_level,
                "uploaded_at": doc.get("uploaded_at"),
                "created_at": doc.get("created_at"),
            }
        )

    return results


@router.get("/documents/{doc_id}")
def get_document_by_id(doc_id: str, current_user: dict = Depends(get_current_user)):
    try:
        object_id = ObjectId(doc_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid document ID") from exc

    collection = get_collection()
    is_admin = is_admin_role(current_user.get("role"))
    query = {"_id": object_id}
    if not is_admin:
        query["uploaded_by"] = current_user.get("_id")
    document = collection.find_one(query)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return _flatten_from_analysis(document)


@router.delete("/documents/{doc_id}")
def delete_document_by_id(doc_id: str, current_user: dict = Depends(get_current_user)):
    try:
        object_id = ObjectId(doc_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid document ID") from exc

    collection = get_collection()
    is_admin = is_admin_role(current_user.get("role"))
    query = {"_id": object_id}
    if not is_admin:
        query["uploaded_by"] = current_user.get("_id")
    deleted = collection.delete_one(query)
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted successfully", "document_id": doc_id}
