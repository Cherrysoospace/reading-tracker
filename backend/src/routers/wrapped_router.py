# routers/wrapped_router.py

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any
from datetime import datetime
from ..services.wrapped_service import WrappedService
from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository
from ..core.database import DatabaseConnection

router = APIRouter(prefix="/wrapped", tags=["Wrapped"])

def get_wrapped_service() -> WrappedService:
    """
    Dependency to get WrappedService instance
    """
    db = DatabaseConnection()
    session_repo = SessionRepository(db)
    book_repo = BookRepository(db)
    return WrappedService(session_repo, book_repo)

@router.get("/summary")
async def get_wrapped_summary(
    year: int = Query(default=None, description="Year for wrapped (defaults to current year)"),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get complete Reading Wrapped summary for a specific year
    
    Returns all metrics in a single response for easy consumption
    """
    try:
        # Default to current year if not provided
        if year is None:
            year = datetime.now().year
        
        # Validate year
        if year < 2000 or year > datetime.now().year:
            raise HTTPException(status_code=400, detail="Invalid year")
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return wrapped_data
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_wrapped_summary: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/general-stats")
async def get_general_stats(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get general statistics for the year
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "stats": wrapped_data["general_stats"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/protagonist-book")
async def get_protagonist_book(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get protagonist book statistics
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "protagonist": wrapped_data["protagonist_book"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/authors")
async def get_authors_stats(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get author statistics
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "authors": wrapped_data["authors_stats"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/habits")
async def get_reading_habits(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get reading habits analysis
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "habits": wrapped_data["reading_habits"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/biggest-day")
async def get_biggest_reading_day(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get the biggest reading day of the year (REQUIRED metric)
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "biggest_day": wrapped_data["biggest_reading_day"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_reading_status(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get reading status (started vs finished)
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "status": wrapped_data["reading_status"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/personality")
async def get_reader_personality(
    year: int = Query(default=None),
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get reader personality determination
    """
    try:
        if year is None:
            year = datetime.now().year
        
        wrapped_data = wrapped_service.get_wrapped_data(year)
        
        return {
            "year": year,
            "personality": wrapped_data["reader_personality"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-years")
async def get_available_years(
    wrapped_service: WrappedService = Depends(get_wrapped_service)
) -> Dict[str, Any]:
    """
    Get list of years with reading data available
    """
    try:
        # Get all sessions
        db = DatabaseConnection()
        session_repo = SessionRepository(db)
        all_sessions = session_repo.get_all()
        
        if not all_sessions:
            return {"years": []}
        
        # Extract unique years
        years = set()
        for session in all_sessions:
            try:
                session_date = session.get_date()
                if isinstance(session_date, str):
                    year = datetime.strptime(session_date, "%Y-%m-%d").year
                else:
                    # Already a date object
                    year = session_date.year
                years.add(year)
            except Exception as e:
                print(f"Error extracting year from session: {e}")
                continue
        
        return {"years": sorted(list(years), reverse=True)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
