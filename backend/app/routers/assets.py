from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import OfficialAsset, SuspectAsset
from app.services.youtube_service import search_youtube_suspects
import os
import uuid
from datetime import datetime

router = APIRouter()

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/official", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/suspects", exist_ok=True)


@router.post("/official-assets/")
async def create_official_asset(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    owner: str = Form(None),
    event_name: str = Form(None),
    event_date: str = Form(None),
    tags: str = Form(None),
    db: Session = Depends(get_db)
):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"{UPLOAD_DIR}/official/{unique_filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    db_asset = OfficialAsset(
        title=title,
        description=description,
        owner=owner,
        event_name=event_name,
        event_date=event_date,
        tags=tags,
        media_url=f"/uploads/official/{unique_filename}",
        thumbnail_url=f"/uploads/official/{unique_filename}"
    )

    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/official-assets/")
def get_official_assets(db: Session = Depends(get_db)):
    return db.query(OfficialAsset).order_by(OfficialAsset.created_at.desc()).all()


@router.get("/official-assets/{id}")
def get_official_asset(id: int, db: Session = Depends(get_db)):
    asset = db.query(OfficialAsset).filter(OfficialAsset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/suspects/")
def get_suspect_assets(db: Session = Depends(get_db)):
    return db.query(SuspectAsset).order_by(SuspectAsset.created_at.desc()).all()


@router.get("/suspects/{id}")
def get_suspect_asset(id: int, db: Session = Depends(get_db)):
    asset = db.query(SuspectAsset).filter(SuspectAsset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Suspect asset not found")
    return asset


@router.post("/suspects/search")
def search_suspects_online(request: dict, db: Session = Depends(get_db)):
    """
    Search YouTube for real suspect clips matching an official asset.
    Saves new results to the DB (skips duplicates by URL).
    Returns all newly found suspect assets.
    """
    official_id = request.get("official_asset_id")
    if not official_id:
        raise HTTPException(status_code=400, detail="official_asset_id is required")

    official = db.query(OfficialAsset).filter(OfficialAsset.id == official_id).first()
    if not official:
        raise HTTPException(status_code=404, detail="Official asset not found")

    try:
        results = search_youtube_suspects(
            title=official.title,
            event_name=official.event_name,
            max_results=5,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"YouTube search failed: {str(e)}. Check your YOUTUBE_API_KEY."
        )

    saved = []
    for r in results:
        # Skip if this URL is already in the database
        existing = db.query(SuspectAsset).filter(
            SuspectAsset.source_url == r["source_url"]
        ).first()
        if existing:
            saved.append(existing)
            continue

        suspect = SuspectAsset(
            source_platform=r["source_platform"],
            source_url=r["source_url"],
            media_url=r["media_url"],
            thumbnail_url=r["thumbnail_url"],
            title=r["title"],
            uploader=r["uploader"],
            view_count=r["view_count"],
        )
        db.add(suspect)
        db.commit()
        db.refresh(suspect)
        saved.append(suspect)

    return {
        "found": len(results),
        "saved": len(saved),
        "suspects": [
            {
                "id": s.id,
                "title": s.title,
                "source_platform": s.source_platform,
                "source_url": s.source_url,
                "thumbnail_url": s.thumbnail_url,
                "uploader": s.uploader,
                "view_count": s.view_count,
            }
            for s in saved
        ],
    }


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Single endpoint for all dashboard KPI numbers."""
    from app.models import Detection, Case
    return {
        "official_assets": db.query(OfficialAsset).count(),
        "suspect_assets": db.query(SuspectAsset).count(),
        "total_detections": db.query(Detection).count(),
        "open_cases": db.query(Case).filter(Case.status == "OPEN").count(),
        "actioned_cases": db.query(Case).filter(Case.status == "ACTIONED").count(),
        "high_risk_open": db.query(Case).join(Detection).filter(
            Case.status == "OPEN", Detection.risk_level == "HIGH"
        ).count(),
    }
