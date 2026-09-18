from sqlalchemy import Column, Integer, Float, Date, ForeignKey

from database import Base


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id = Column(Integer, primary_key=True, index=True)

    site_id = Column(
        Integer,
        ForeignKey("sites.id"),
        nullable=False
    )

    recorded_date = Column(Date, nullable=False)

    carbon_value = Column(Float, nullable=False)

    biodiversity_index = Column(Float, nullable=False)