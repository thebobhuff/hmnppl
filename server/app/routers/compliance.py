"""Compliance API routes - multi-layer jurisdiction support."""

import logging
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.config import Settings, get_settings
from app.core.security import validate_api_key
from app.services.compliance_engine import compliance_engine

router = APIRouter(
    prefix="/compliance",
    tags=["compliance"],
    dependencies=[Depends(validate_api_key)],
)

logger = logging.getLogger(__name__)


@router.get("/rules")
async def get_merged_rules(
    country: str = Query("US", description="Country code"),
    state: Optional[str] = Query(None, description="State code (e.g. CA, TX, NY)"),
    county: Optional[str] = Query(None, description="County name"),
    city: Optional[str] = Query(None, description="City name"),
    settings: Settings = Depends(get_settings),
):
    """Get merged compliance rules for a jurisdiction. Most specific layer wins."""
    return compliance_engine.get_merged_rules(country, state, county, city)


@router.get("/termination-requirements")
async def get_termination_requirements(
    country: str = Query("US"),
    state: Optional[str] = Query(None),
    county: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    settings: Settings = Depends(get_settings),
):
    """Get termination-specific requirements for a jurisdiction."""
    return compliance_engine.get_termination_requirements(country, state, county, city)


@router.get("/minimum-wage")
async def get_minimum_wage(
    country: str = Query("US"),
    state: Optional[str] = Query(None),
    county: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    settings: Settings = Depends(get_settings),
):
    """Get applicable minimum wage for a jurisdiction."""
    return compliance_engine.get_minimum_wage(country, state, county, city)


@router.get("/protected-classes")
async def get_protected_classes(
    country: str = Query("US"),
    state: Optional[str] = Query(None),
    county: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    settings: Settings = Depends(get_settings),
):
    """Get all applicable protected classes for a jurisdiction."""
    return compliance_engine.get_protected_classes(country, state, county, city)


@router.get("/jurisdictions")
async def get_supported_jurisdictions(
    settings: Settings = Depends(get_settings),
):
    """List all supported jurisdiction layers."""
    return compliance_engine.get_supported_jurisdictions()
