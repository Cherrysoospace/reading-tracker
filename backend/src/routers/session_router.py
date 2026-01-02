from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import date as DateType

from ..services.SessionService import SessionService
from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository
from ..schemas.session_schemas import SessionCreate, SessionResponse, SessionWithBookResponse
from ..core.database import DatabaseConnection
from ..core.logging import get_logger

logger = get_logger(__name__)

# Create router with prefix and tags
router = APIRouter(prefix="/sessions", tags=["Sessions"])


def get_session_service() -> SessionService:
    """
    Dependency function to create and return a SessionService instance.
    
    Initializes the database connection and required repositories,
    then creates and returns a SessionService instance.
    
    Returns:
        SessionService: Configured SessionService instance
    """
    # Initialize database connection
    db_connection = DatabaseConnection()
    db_connection.initialize_database()
    
    # Initialize repositories
    session_repo = SessionRepository(db_connection)
    book_repo = BookRepository(db_connection)
    
    # Create and return SessionService
    return SessionService(session_repo, book_repo)


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a reading session",
    description="Log a new reading session. Date can be in the past but not in the future."
)
def create_session(
    session: SessionCreate,
    session_service: SessionService = Depends(get_session_service)
) -> SessionResponse:
    """
    Create a new reading session.
    
    Args:
        session: Session data (book_id, date, minutes_read)
        session_service: SessionService dependency
        
    Returns:
        SessionResponse: The created session with assigned ID
        
    Raises:
        HTTPException 404: If book not found
        HTTPException 400: If validation fails (future date, negative minutes)
    """
    logger.info(f"POST /sessions - Creating session for book_id={session.book_id}")
    created_session = session_service.create_session(
        book_id=session.book_id,
        session_date=session.date,
        minutes_read=session.minutes_read
    )
    
    # Convert ReadingSession model to SessionResponse
    return SessionResponse(
        id=created_session.get_id(),
        book_id=created_session.get_book_id(),
        date=created_session.get_date(),
        minutes_read=created_session.get_minutes_read()
    )


@router.get(
    "/",
    response_model=List[SessionResponse],
    summary="Get all reading sessions",
    description="Retrieve all reading sessions ordered by date (most recent first)"
)
def get_all_sessions(
    session_service: SessionService = Depends(get_session_service)
) -> List[SessionResponse]:
    """
    Get all reading sessions.
    
    Args:
        session_service: SessionService dependency
        
    Returns:
        List[SessionResponse]: List of all sessions
    """
    logger.info("GET /sessions - Retrieving all sessions")
    sessions = session_service.get_sessions()
    
    # Convert ReadingSession models to SessionResponse
    return [
        SessionResponse(
            id=session.get_id(),
            book_id=session.get_book_id(),
            date=session.get_date(),
            minutes_read=session.get_minutes_read()
        )
        for session in sessions
    ]


@router.get(
    "/by-date",
    response_model=List[SessionResponse],
    summary="Get sessions by date",
    description="Retrieve all reading sessions for a specific date"
)
def get_sessions_by_date(
    date: DateType = Query(..., description="Date to filter sessions (YYYY-MM-DD format)"),
    session_service: SessionService = Depends(get_session_service)
) -> List[SessionResponse]:
    """
    Get sessions for a specific date.
    
    Args:
        date: Date to filter sessions by
        session_service: SessionService dependency
        
    Returns:
        List[SessionResponse]: List of sessions for the specified date
        
    Example:
        GET /sessions/by-date?date=2024-03-15
    """
    logger.info(f"GET /sessions/by-date?date={date}")
    sessions = session_service.get_sessions_by_date(date)
    
    # Convert ReadingSession models to SessionResponse
    return [
        SessionResponse(
            id=session.get_id(),
            book_id=session.get_book_id(),
            date=session.get_date(),
            minutes_read=session.get_minutes_read()
        )
        for session in sessions
    ]


@router.get(
    "/by-range",
    response_model=List[SessionResponse],
    summary="Get sessions by date range",
    description="Retrieve all reading sessions within a date range (inclusive)"
)
def get_sessions_by_range(
    start_date: DateType = Query(..., description="Start date of the range (YYYY-MM-DD format)"),
    end_date: DateType = Query(..., description="End date of the range (YYYY-MM-DD format)"),
    session_service: SessionService = Depends(get_session_service)
) -> List[SessionResponse]:
    """
    Get sessions within a date range.
    
    Args:
        start_date: Start date of the range (inclusive)
        end_date: End date of the range (inclusive)
        session_service: SessionService dependency
        
    Returns:
        List[SessionResponse]: List of sessions within the date range
        
    Raises:
        HTTPException 400: If end_date is before start_date
        
    Example:
        GET /sessions/by-range?start_date=2024-03-01&end_date=2024-03-31
    """
    logger.info(f"GET /sessions/by-range?start_date={start_date}&end_date={end_date}")
    sessions = session_service.get_sessions_by_range(start_date, end_date)
    
    # Convert ReadingSession models to SessionResponse
    return [
        SessionResponse(
            id=session.get_id(),
            book_id=session.get_book_id(),
            date=session.get_date(),
            minutes_read=session.get_minutes_read()
        )
        for session in sessions
    ]


@router.get(
    "/by-book/{book_id}",
    response_model=List[SessionResponse],
    summary="Get sessions by book",
    description="Retrieve all reading sessions for a specific book"
)
def get_sessions_by_book(
    book_id: int,
    session_service: SessionService = Depends(get_session_service)
) -> List[SessionResponse]:
    """
    Get all sessions for a specific book.
    
    Args:
        book_id: ID of the book to retrieve sessions for
        session_service: SessionService dependency
        
    Returns:
        List[SessionResponse]: List of sessions for the specified book
        
    Raises:
        HTTPException 404: If book not found
    """
    logger.info(f"GET /sessions/by-book/{book_id}")
    sessions = session_service.get_sessions_by_book(book_id)
    
    # Convert ReadingSession models to SessionResponse
    return [
        SessionResponse(
            id=session.get_id(),
            book_id=session.get_book_id(),
            date=session.get_date(),
            minutes_read=session.get_minutes_read()
        )
        for session in sessions
    ]


@router.get(
    "/detailed",
    response_model=List[SessionWithBookResponse],
    summary="Get sessions with book details",
    description="Retrieve all sessions including book title and author information"
)
def get_detailed_sessions(
    session_service: SessionService = Depends(get_session_service)
) -> List[SessionWithBookResponse]:
    """
    Get all sessions with book information included.
    
    Args:
        session_service: SessionService dependency
        
    Returns:
        List[SessionWithBookResponse]: List of sessions with book details
    """
    logger.info("GET /sessions/detailed")
    
    # Get database connection and session repo to access joined data
    db_connection = DatabaseConnection()
    db_connection.initialize_database()
    session_repo = SessionRepository(db_connection)
    
    # Get sessions with book information
    sessions_with_books = session_repo.get_all_sessions_with_books()
    
    # Convert tuples to SessionWithBookResponse
    return [
        SessionWithBookResponse(
            id=session[0],
            book_id=session[1],
            date=session[2],
            minutes_read=session[3],
            book_title=session[4],
            book_author=session[5] or ""
        )
        for session in sessions_with_books
    ]


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a reading session",
    description="Delete a specific reading session by ID"
)
def delete_session(
    session_id: int,
    session_service: SessionService = Depends(get_session_service)
) -> None:
    """
    Delete a reading session.
    
    Args:
        session_id: ID of the session to delete
        session_service: SessionService dependency
        
    Returns:
        None (204 No Content)
    """
    logger.info(f"DELETE /sessions/{session_id}")
    session_service.delete_session(session_id)
    # Return None for 204 No Content response
    return None
