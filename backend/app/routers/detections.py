from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import OfficialAsset, SuspectAsset, Detection
from app.services.gemini_service import compare_media
import json

router = APIRouter()


@router.post("/detections/analyze")
def analyze_detection(request: dict, db: Session = Depends(get_db)):
    official = db.query(OfficialAsset).filter(OfficialAsset.id == request.get("official_asset_id")).first()
    suspect = db.query(SuspectAsset).filter(SuspectAsset.id == request.get("suspect_asset_id")).first()

    if not official or not suspect:
        raise HTTPException(status_code=404, detail="One or both assets not found")

    # Call AI service — pass full objects so service has all metadata
    result = compare_media(official, suspect)

    detection = Detection(
        official_asset_id=request.get("official_asset_id"),
        suspect_asset_id=request.get("suspect_asset_id"),
        similarity_score=result.get("similarity_score", 0.0),
        classification=result.get("classification", "FAN_CONTENT"),
        risk_level=result.get("risk_level", "MEDIUM"),
        confidence=result.get("confidence", 0.0),
        ai_explanation=json.dumps(result),   # Store as JSON string, not eval()-able
    )

    db.add(detection)
    db.commit()
    db.refresh(detection)

    return {"id": detection.id, **result}


@router.get("/detections/")
def get_detections(db: Session = Depends(get_db)):
    detections = db.query(Detection).order_by(Detection.created_at.desc()).all()
    result = []
    for d in detections:
        official = db.query(OfficialAsset).filter(OfficialAsset.id == d.official_asset_id).first()
        suspect = db.query(SuspectAsset).filter(SuspectAsset.id == d.suspect_asset_id).first()
        result.append({
            "id": d.id,
            "similarity_score": d.similarity_score,
            "classification": d.classification,
            "risk_level": d.risk_level,
            "confidence": d.confidence,
            "created_at": d.created_at,
            "official_asset": {
                "id": official.id if official else None,
                "title": official.title if official else "Unknown",
                "owner": official.owner if official else "",
            },
            "suspect_asset": {
                "id": suspect.id if suspect else None,
                "title": suspect.title if suspect else "Unknown",
                "source_platform": suspect.source_platform if suspect else "Unknown",
                "uploader": suspect.uploader if suspect else "",
                "view_count": suspect.view_count if suspect else 0,
            },
        })
    return result


@router.get("/detections/{id}")
def get_detection(id: int, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    official = db.query(OfficialAsset).filter(OfficialAsset.id == detection.official_asset_id).first()
    suspect = db.query(SuspectAsset).filter(SuspectAsset.id == detection.suspect_asset_id).first()

    try:
        ai_data = json.loads(detection.ai_explanation) if detection.ai_explanation else {}
    except Exception:
        ai_data = {}

    return {
        "id": detection.id,
        "similarity_score": detection.similarity_score,
        "classification": detection.classification,
        "risk_level": detection.risk_level,
        "confidence": detection.confidence,
        "created_at": detection.created_at,
        "short_reason": ai_data.get("short_reason", ""),
        "detailed_evidence": ai_data.get("detailed_evidence", []),
        "suggested_action": ai_data.get("suggested_action", ""),
        "official_asset": official,
        "suspect_asset": suspect,
    }
