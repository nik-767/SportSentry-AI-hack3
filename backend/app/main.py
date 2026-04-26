from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import assets, detections, cases
import os

Base.metadata.create_all(bind=engine)

# Ensure uploads directories exist
os.makedirs("uploads/official", exist_ok=True)
os.makedirs("uploads/suspects", exist_ok=True)

app = FastAPI(title="SportSentry AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static assets
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(assets.router, prefix="/api", tags=["assets"])
app.include_router(detections.router, prefix="/api", tags=["detections"])
app.include_router(cases.router, prefix="/api", tags=["cases"])


@app.get("/")
def read_root():
    return {"message": "SportSentry AI API", "version": "1.0.0", "docs": "/docs"}
