from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class OfficialAsset(Base):
    __tablename__ = "official_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    owner = Column(String)
    event_name = Column(String)
    event_date = Column(String)
    tags = Column(String)
    media_url = Column(String)
    thumbnail_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    detections = relationship("Detection", back_populates="official_asset")

class SuspectAsset(Base):
    __tablename__ = "suspect_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    source_platform = Column(String)
    source_url = Column(String)
    media_url = Column(String)
    thumbnail_url = Column(String)
    title = Column(String)
    uploader = Column(String)
    view_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    detections = relationship("Detection", back_populates="suspect_asset")

class Detection(Base):
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, index=True)
    official_asset_id = Column(Integer, ForeignKey("official_assets.id"))
    suspect_asset_id = Column(Integer, ForeignKey("suspect_assets.id"))
    similarity_score = Column(Float)
    classification = Column(String)
    risk_level = Column(String)
    confidence = Column(Float)
    ai_explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    official_asset = relationship("OfficialAsset", back_populates="detections")
    suspect_asset = relationship("SuspectAsset", back_populates="detections")
    cases = relationship("Case", back_populates="detection")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"))
    status = Column(String, default="OPEN")
    takedown_draft = Column(Text)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    detection = relationship("Detection", back_populates="cases")
