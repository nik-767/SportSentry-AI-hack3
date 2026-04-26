from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Detection, Case
from app.services.gemini_service import generate_takedown_draft
import json

router = APIRouter()


def _parse_ai_explanation(raw: str):
    """Safely parse JSON stored as ai_explanation."""
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return {}


@router.post("/cases/{detection_id}/create")
def create_case(detection_id: int, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    # Check if case already exists for this detection
    existing = db.query(Case).filter(Case.detection_id == detection_id).first()
    if existing:
        return existing

    official = detection.official_asset
    suspect = detection.suspect_asset

    ai_data = _parse_ai_explanation(detection.ai_explanation)

    draft = generate_takedown_draft(
        official_title=official.title,
        official_owner=official.owner or "Rights Holder",
        suspect_url=suspect.source_url or "Unknown URL",
        suspect_platform=suspect.source_platform or "Unknown Platform",
        suspect_uploader=suspect.uploader or "Unknown",
        classification=detection.classification,
        risk_level=detection.risk_level,
        similarity_score=detection.similarity_score,
        evidence=ai_data.get("detailed_evidence", []),
    )

    case = Case(
        detection_id=detection_id,
        status="OPEN",
        takedown_draft=draft,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/cases/")
def get_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.last_updated.desc()).all()
    result = []
    for c in cases:
        detection = db.query(Detection).filter(Detection.id == c.detection_id).first()
        official = detection.official_asset if detection else None
        suspect = detection.suspect_asset if detection else None
        result.append({
            "id": c.id,
            "status": c.status,
            "last_updated": c.last_updated,
            "detection_id": c.detection_id,
            "official_title": official.title if official else "Unknown",
            "suspect_platform": suspect.source_platform if suspect else "Unknown",
            "risk_level": detection.risk_level if detection else "UNKNOWN",
            "similarity_score": detection.similarity_score if detection else 0,
            "classification": detection.classification if detection else "UNKNOWN",
        })
    return result


@router.get("/cases/{id}")
def get_case(id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    detection = db.query(Detection).filter(Detection.id == case.detection_id).first()
    official = detection.official_asset if detection else None
    suspect = detection.suspect_asset if detection else None

    ai_data = _parse_ai_explanation(detection.ai_explanation) if detection else {}

    return {
        "id": case.id,
        "status": case.status,
        "takedown_draft": case.takedown_draft,
        "last_updated": case.last_updated,
        "detection": {
            "id": detection.id if detection else None,
            "similarity_score": detection.similarity_score if detection else 0,
            "classification": detection.classification if detection else "",
            "risk_level": detection.risk_level if detection else "",
            "confidence": detection.confidence if detection else 0,
            "short_reason": ai_data.get("short_reason", ""),
            "detailed_evidence": ai_data.get("detailed_evidence", []),
        },
        "official_asset": {
            "id": official.id if official else None,
            "title": official.title if official else "Unknown",
            "owner": official.owner if official else "",
            "event_name": official.event_name if official else "",
            "event_date": official.event_date if official else "",
            "thumbnail_url": official.thumbnail_url if official else "",
            "media_url": official.media_url if official else "",
        } if official else None,
        "suspect_asset": {
            "id": suspect.id if suspect else None,
            "title": suspect.title if suspect else "Unknown",
            "source_platform": suspect.source_platform if suspect else "",
            "source_url": suspect.source_url if suspect else "",
            "uploader": suspect.uploader if suspect else "",
            "view_count": suspect.view_count if suspect else 0,
            "thumbnail_url": suspect.thumbnail_url if suspect else "",
        } if suspect else None,
    }


@router.patch("/cases/{id}")
def update_case(id: int, update: dict, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if update.get("status"):
        case.status = update["status"]
    db.commit()
    db.refresh(case)
    return case
