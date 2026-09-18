from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geometry

from database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    name = Column(String(150), nullable=False)

    description = Column(Text)

    area = Column(Float)

    geometry = Column(
        Geometry(
            geometry_type="POLYGON",
            srid=4326
        ),
        nullable=False
    )

    status = Column(
        String(50),
        default="active",
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )