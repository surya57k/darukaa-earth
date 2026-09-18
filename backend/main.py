from fastapi import FastAPI

from database import Base, engine
from app.models import User, Project, Site, SiteAnalytics
from app.api.auth import router as auth_router
from fastapi import Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.api.projects import router as projects_router
from app.api.sites import router as sites_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Darukaa.Earth API",
    description="Geospatial data analytics platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sites_router)

@app.get("/")
def root():
    return {
        "message": "Darukaa.Earth API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected"
    }

@app.get("/protected")
def protected(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "You are authenticated",
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }