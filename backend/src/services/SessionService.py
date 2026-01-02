from typing import List, Optional
from datetime import date
from fastapi import HTTPException

from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository
from ..models.ReadingSession import ReadingSession
from ..core.logging import get_logger

logger = get_logger(__name__)


class SessionService:
    """
    Service class for managing reading session business logic.
    
    This class handles validation, business rules, and coordinates between
    repositories for reading session-related operations.
    """
    
    def __init__(self, session_repo: SessionRepository, book_repo: BookRepository) -> None:
        """
        Initialize the SessionService with required repositories.
        
        Args:
            session_repo: SessionRepository instance for session data operations
            book_repo: BookRepository instance for book validation
        """
        self._session_repo = session_repo
        self._book_repo = book_repo
    
    def validate_session_data(self, book_id: int, session_date: date, minutes_read: int) -> None:
        """
        Validate reading session data before creation.
        
        Args:
            book_id: ID of the book to validate
            session_date: Date of the reading session
            minutes_read: Number of minutes read
            
        Raises:
            HTTPException: 404 if book not found
            HTTPException: 400 if validation fails
        """
        logger.debug(f"Validating session data: book_id={book_id}, date={session_date}, minutes={minutes_read}")
        
        # Check if book exists
        book = self._book_repo.get_by_id(book_id)
        if book is None:
            logger.warning(f"Session validation failed: book {book_id} not found")
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Validate minutes_read is positive
        if minutes_read <= 0:
            logger.warning(f"Session validation failed: invalid minutes_read {minutes_read}")
            raise HTTPException(status_code=400, detail="Minutes read must be greater than 0")
        
        # Validate session_date is not in the future
        if session_date > date.today():
            logger.warning(f"Session validation failed: future date {session_date}")
            raise HTTPException(status_code=400, detail="Session date cannot be in the future")
        
        logger.debug("Session data validation passed")
    
    def create_session(self, book_id: int, session_date: date, minutes_read: int) -> ReadingSession:
        """
        Create a new reading session with validation.
        
        Args:
            book_id: ID of the book being read
            session_date: Date of the reading session (can be in the past)
            minutes_read: Number of minutes read (must be positive)
            
        Returns:
            ReadingSession: The newly created ReadingSession object with assigned ID
            
        Raises:
            HTTPException: 404 if book not found
            HTTPException: 400 if validation fails
        """
        logger.info(f"Creating reading session: book_id={book_id}, date={session_date}, minutes={minutes_read}")
        
        # Validate session data
        self.validate_session_data(book_id, session_date, minutes_read)
        
        # Create ReadingSession object
        session = ReadingSession(
            id=None,
            book_id=book_id,
            date=session_date,
            minutes_read=minutes_read
        )
        
        # Save to database and get the ID
        session_id = self._session_repo.create(session)
        session.set_id(session_id)
        
        logger.info(f"Reading session created successfully with ID: {session_id}")
        return session
    
    def get_sessions(self) -> List[ReadingSession]:
        """
        Retrieve all reading sessions.
        
        Returns:
            List[ReadingSession]: List of all ReadingSession objects
        """
        logger.debug("Getting all reading sessions")
        return self._session_repo.get_all()
    
    def get_sessions_by_date(self, session_date: date) -> List[ReadingSession]:
        """
        Retrieve all sessions for a specific date.
        
        Args:
            session_date: Date to retrieve sessions for
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects for the date,
                                 empty list if no sessions found
        """
        logger.debug(f"Getting sessions for date: {session_date}")
        sessions = self._session_repo.get_by_date(session_date)
        logger.info(f"Found {len(sessions)} sessions for date {session_date}")
        return sessions
    
    def get_sessions_by_range(self, start_date: date, end_date: date) -> List[ReadingSession]:
        """
        Retrieve sessions within a date range.
        
        Args:
            start_date: Start date of the range (inclusive)
            end_date: End date of the range (inclusive)
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects within the range,
                                 empty list if no sessions found
            
        Raises:
            HTTPException: 400 if end_date is before start_date
        """
        logger.debug(f"Getting sessions for range: {start_date} to {end_date}")
        
        # Validate date range
        if end_date < start_date:
            logger.warning(f"Invalid date range: end_date {end_date} before start_date {start_date}")
            raise HTTPException(status_code=400, detail="End date cannot be before start date")
        
        sessions = self._session_repo.get_by_date_range(start_date, end_date)
        logger.info(f"Found {len(sessions)} sessions in date range {start_date} to {end_date}")
        return sessions
    
    def get_sessions_by_book(self, book_id: int) -> List[ReadingSession]:
        """
        Retrieve all sessions for a specific book.
        
        Args:
            book_id: ID of the book to retrieve sessions for
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects for the book,
                                 empty list if no sessions found
            
        Raises:
            HTTPException: 404 if book not found
        """
        logger.debug(f"Getting sessions for book: {book_id}")
        
        # Check if book exists
        book = self._book_repo.get_by_id(book_id)
        if book is None:
            logger.warning(f"Book {book_id} not found when retrieving sessions")
            raise HTTPException(status_code=404, detail="Book not found")
        
        sessions = self._session_repo.get_by_book(book_id)
        logger.info(f"Found {len(sessions)} sessions for book {book_id}")
        return sessions
    
    def delete_session(self, session_id: int) -> bool:
        """
        Delete a reading session by ID.
        
        Args:
            session_id: ID of the session to delete
            
        Returns:
            bool: True if deleted successfully
            
        Raises:
            HTTPException: 404 if session not found
        """
        logger.info(f"Attempting to delete session: {session_id}")
        
        # Check if session exists
        session = self._session_repo.get_by_id(session_id)
        if session is None:
            logger.warning(f"Session {session_id} not found for deletion")
            raise HTTPException(status_code=404, detail="Session not found")
        
        result = self._session_repo.delete(session_id)
        logger.info(f"Session {session_id} deleted successfully")
        return result
