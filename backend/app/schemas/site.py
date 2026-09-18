from datetime import datetime
from typing import Optional, List, Tuple

from pydantic import BaseModel, Field, ConfigDict


class PolygonGeometry(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [80.6000, 16.5000],
                        [80.6100, 16.5000],
                        [80.6100, 16.5100],
                        [80.6000, 16.5100],
                        [80.6000, 16.5000]
                    ]
                ]
            }
        }
    )

    type: str = Field(
        default="Polygon",
        description="GeoJSON geometry type",
        examples=["Polygon"]
    )

    coordinates: List[List[Tuple[float, float]]] = Field(
        ...,
        description="GeoJSON Polygon coordinates as [longitude, latitude] pairs"
    )


class SiteCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    area: Optional[float] = None
    geometry: PolygonGeometry
    status: str = "active"


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[float] = None
    geometry: Optional[PolygonGeometry] = None
    status: Optional[str] = None


class SiteResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str]
    area: Optional[float]
    geometry: PolygonGeometry
    status: str
    created_at: Optional[datetime]