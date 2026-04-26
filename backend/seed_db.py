from app.database import SessionLocal, engine, Base
from app.models import SuspectAsset
from datetime import datetime

def seed_suspects():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if suspects already exist
    existing = db.query(SuspectAsset).first()
    if existing:
        print("Suspect assets already seeded.")
        return
    
    suspects = [
        SuspectAsset(
            source_platform="YouTube",
            source_url="https://youtube.com/watch?v=example1",
            media_url="https://example.com/video1.mp4",
            thumbnail_url="https://example.com/thumb1.jpg",
            title="Full Match Highlights - Unauthorized",
            uploader="SportsFan123",
            view_count=45000
        ),
        SuspectAsset(
            source_platform="TikTok",
            source_url="https://tiktok.com/@user/video2",
            media_url="https://example.com/video2.mp4",
            thumbnail_url="https://example.com/thumb2.jpg",
            title="Best Goals Compilation",
            uploader="GoalMaster",
            view_count=120000
        ),
        SuspectAsset(
            source_platform="Twitter",
            source_url="https://twitter.com/user/status/123",
            media_url="https://example.com/video3.mp4",
            thumbnail_url="https://example.com/thumb3.jpg",
            title="Live Stream Clip",
            uploader="SportsClips",
            view_count=25000
        ),
        SuspectAsset(
            source_platform="Instagram",
            source_url="https://instagram.com/p/abc123",
            media_url="https://example.com/video4.mp4",
            thumbnail_url="https://example.com/thumb4.jpg",
            title="Match Reel",
            uploader="FootballDaily",
            view_count=89000
        ),
        SuspectAsset(
            source_platform="YouTube",
            source_url="https://youtube.com/watch?v=example5",
            media_url="https://example.com/video5.mp4",
            thumbnail_url="https://example.com/thumb5.jpg",
            title="Full Game Replay",
            uploader="WatchSportsFree",
            view_count=156000
        )
    ]
    
    for suspect in suspects:
        db.add(suspect)
    
    db.commit()
    print(f"Seeded {len(suspects)} suspect assets.")

if __name__ == "__main__":
    seed_suspects()
