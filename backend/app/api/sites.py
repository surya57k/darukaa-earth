from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape, mapping

from database import get_db

from app.models.site import Site
from app.models.project import Project
from app.models.user import User

from app.schemas.site import (
    SiteCreate,
    SiteUpdate,
    SiteResponse
)

from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


def site_to_response(site: Site):
    geometry = mapping(to_shape(site.geometry))

    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "description": site.description,
        "area": site.area,
        "geometry": geometry,
        "status": site.status,
        "created_at": site.created_at
    }


@router.post(
    "",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED
)
def create_site(
    site_data: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check whether project exists
    project = (
        db.query(Project)
        .filter(
            Project.id == site_data.project_id,
            Project.created_by == current_user.id
        )
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    try:
        # Convert GeoJSON -> Shapely geometry
        polygon = shape(site_data.geometry.model_dump())

        # Only Polygon is allowed
        if polygon.geom_type != "Polygon":
            raise ValueError(
                "Geometry must be a Polygon"
            )

        # Validate polygon
        if not polygon.is_valid:
            raise ValueError(
                "Invalid polygon geometry"
            )

        site = Site(
            project_id=site_data.project_id,
            name=site_data.name,
            description=site_data.description,
            area=site_data.area,

            geometry=from_shape(
                polygon,
                srid=4326
            ),

            status=site_data.status
        )

        db.add(site)
        db.commit()
        db.refresh(site)

        return site_to_response(site)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "",
    response_model=List[SiteResponse]
)
def get_sites(
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(Site)
        .join(Project)
        .filter(
            Project.created_by == current_user.id
        )
    )

    if project_id is not None:
        query = query.filter(
            Site.project_id == project_id
        )

    sites = (
        query
        .order_by(Site.id.desc())
        .all()
    )

    return [
        site_to_response(site)
        for site in sites
    ]


@router.get(
    "/{site_id}",
    response_model=SiteResponse
)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = (
        db.query(Site)
        .join(Project)
        .filter(
            Site.id == site_id,
            Project.created_by == current_user.id
        )
        .first()
    )

    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )

    return site_to_response(site)


@router.put(
    "/{site_id}",
    response_model=SiteResponse
)
def update_site(
    site_id: int,
    site_data: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = (
        db.query(Site)
        .join(Project)
        .filter(
            Site.id == site_id,
            Project.created_by == current_user.id
        )
        .first()
    )

    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )

    update_data = site_data.model_dump(
        exclude_unset=True
    )

    # Update geometry if provided
    if "geometry" in update_data:

        geometry_data = update_data.pop("geometry")

        try:
            polygon = shape(geometry_data)

            if polygon.geom_type != "Polygon":
                raise ValueError(
                    "Geometry must be a Polygon"
                )

            if not polygon.is_valid:
                raise ValueError(
                    "Invalid polygon geometry"
                )

            site.geometry = from_shape(
                polygon,
                srid=4326
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    # Update other fields
    for key, value in update_data.items():
        setattr(site, key, value)

    db.commit()
    db.refresh(site)

    return site_to_response(site)


@router.delete(
    "/{site_id}"
)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = (
        db.query(Site)
        .join(Project)
        .filter(
            Site.id == site_id,
            Project.created_by == current_user.id
        )
        .first()
    )

    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )

    db.delete(site)
    db.commit()

    return {
        "message": "Site deleted successfully"
    }