from typing import List, Optional
from datetime import date, datetime
from fastapi import HTTPException

from ..repositories.BookRepository import BookRepository
from ..repositories.SessionRepository import SessionRepository
from ..models.Book import Book
from ..core.logging import get_logger

logger = get_logger(__name__)


class BookService:
    """
    Service class for managing book business logic.
    
    This class handles validation, business rules, and coordinates between
    repositories for book-related operations in the Reading Tracker application.
    """
    
    def __init__(self, book_repo: BookRepository, session_repo: SessionRepository) -> None:
        """
        Initialize the BookService with required repositories.
        
        Args:
            book_repo: BookRepository instance for book data operations
            session_repo: SessionRepository instance for session-related checks
        """
        self._book_repo = book_repo
        self._session_repo = session_repo
    
    def _parse_date_string(self, date_value: any) -> date:
        """
        Convert string date to date object if needed.
        
        Args:
            date_value: Either a string in YYYY-MM-DD format or a date object
            
        Returns:
            date: Date object
        """
        if isinstance(date_value, str):
            return datetime.strptime(date_value, '%Y-%m-%d').date()
        return date_value
    
    def create_book(self, title: str, author: str, start_date: date) -> Book:
        """
        Create a new book with validation.
        
        Args:
            title: Title of the book (cannot be empty)
            author: Author of the book (can be empty or None)
            start_date: Date when reading started (cannot be in the future)
            
        Returns:
            Book: The newly created Book object with assigned ID
            
        Raises:
            HTTPException: 400 if validation fails (empty title or future date)
        """
        logger.info(f"Creating book: title='{title}', author='{author}', start_date={start_date}")
        
        # Validate title is not empty
        if not title or not title.strip():
            logger.warning("Book creation failed: empty title")
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        # Validate start_date is not in the future
        if start_date > date.today():
            logger.warning(f"Book creation failed: future start_date {start_date}")
            raise HTTPException(status_code=400, detail="Start date cannot be in the future")
        
        # Handle empty author
        if author is None or not author.strip():
            author = None
        
        # Create Book object with status='reading'
        book = Book(
            id=None,
            title=title.strip(),
            author=author,
            start_date=start_date,
            end_date=None,
            status='reading'
        )
        
        # Save to database and get the ID
        book_id = self._book_repo.create(book)
        book.set_id(book_id)
        
        logger.info(f"Book created successfully with ID: {book_id}")
        return book
    
    def get_all_books(self) -> List[Book]:
        """
        Retrieve all books from the database.
        
        Returns:
            List[Book]: List of all Book objects
        """
        return self._book_repo.get_all()
    
    def get_book(self, book_id: int) -> Book:
        """
        Retrieve a single book by its ID.
        
        Args:
            book_id: ID of the book to retrieve
            
        Returns:
            Book: The requested Book object
            
        Raises:
            HTTPException: 404 if book is not found
        """
        logger.debug(f"Getting book with ID: {book_id}")
        book = self._book_repo.get_by_id(book_id)
        
        if book is None:
            logger.warning(f"Book with ID {book_id} not found")
            raise HTTPException(status_code=404, detail="Book not found")
        
        return book
    
    def update_book(
        self,
        book_id: int,
        title: Optional[str] = None,
        author: Optional[str] = None,
        end_date: Optional[date] = None,
        status: Optional[str] = None
    ) -> Book:
        """
        Update book fields with validation.
        
        Args:
            book_id: ID of the book to update
            title: New title (optional)
            author: New author (optional)
            end_date: New end date (optional, must not be before start_date)
            status: New status (optional, must be 'reading' or 'finished')
            
        Returns:
            Book: The updated Book object
            
        Raises:
            HTTPException: 404 if book not found
            HTTPException: 400 if validation fails
        """
        logger.info(f"Updating book {book_id}")
        # Check if book exists
        book = self.get_book(book_id)
        
        # Build update dictionary with only non-None values
        update_data = {}
        
        if title is not None:
            # Validate title is not empty
            if not title.strip():
                logger.warning(f"Book {book_id} update failed: empty title")
                raise HTTPException(status_code=400, detail="Title cannot be empty")
            update_data['title'] = title.strip()
        
        if author is not None:
            update_data['author'] = author.strip() if author.strip() else None
        
        if status is not None:
            # Validate status
            if status not in ['reading', 'finished']:
                logger.warning(f"Book {book_id} update failed: invalid status '{status}'")
                raise HTTPException(
                    status_code=400,
                    detail="Status must be either 'reading' or 'finished'"
                )
            update_data['status'] = status
        
        if end_date is not None:
            # Validate end_date is not before start_date
            book_start_date = self._parse_date_string(book.get_start_date())
            
            if end_date < book_start_date:
                logger.warning(f"Book {book_id} update failed: end_date {end_date} before start_date {book_start_date}")
                raise HTTPException(
                    status_code=400,
                    detail="End date cannot be before start date"
                )
            
            # Convert date to string for database
            update_data['end_date'] = end_date.strftime('%Y-%m-%d')
        
        # Update the book if there are changes
        if update_data:
            self._book_repo.update(book_id, update_data)
            logger.info(f"Book {book_id} updated successfully with fields: {list(update_data.keys())}")
        
        # Retrieve and return the updated book
        return self.get_book(book_id)
    
    def mark_as_finished(self, book_id: int, end_date: date) -> Book:
        """
        Mark a book as finished with an end date.
        
        Args:
            book_id: ID of the book to mark as finished
            end_date: Date when reading was finished
            
        Returns:
            Book: The updated Book object with status='finished'
            
        Raises:
            HTTPException: 404 if book not found
            HTTPException: 400 if end_date is before start_date
        """
        logger.info(f"Marking book {book_id} as finished with end_date: {end_date}")
        # Check if book exists
        book = self.get_book(book_id)
        
        # Validate end_date is not before start_date
        book_start_date = self._parse_date_string(book.get_start_date())
        
        if end_date < book_start_date:
            logger.warning(f"Mark as finished failed for book {book_id}: end_date {end_date} before start_date {book_start_date}")
            raise HTTPException(
                status_code=400,
                detail="End date cannot be before start date"
            )
        
        # Update book with finished status and end_date
        update_data = {
            'status': 'finished',
            'end_date': end_date.strftime('%Y-%m-%d')
        }
        
        self._book_repo.update(book_id, update_data)
        logger.info(f"Book {book_id} marked as finished successfully")
        
        # Retrieve and return the updated book
        return self.get_book(book_id)
    
    def delete_book(self, book_id: int) -> bool:
        """
        Delete a book if it has no associated reading sessions.
        
        Args:
            book_id: ID of the book to delete
            
        Returns:
            bool: True if deletion was successful
            
        Raises:
            HTTPException: 404 if book not found
            HTTPException: 400 if book has reading sessions
        """
        logger.info(f"Attempting to delete book {book_id}")
        # Check if book exists
        book = self.get_book(book_id)
        
        # Check if book has associated sessions (optimized with COUNT query)
        if self._book_repo.has_sessions(book_id):
            logger.warning(f"Book {book_id} deletion failed: has reading sessions")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete book with reading sessions"
            )
        
        # Delete the book
        result = self._book_repo.delete(book_id)
        logger.info(f"Book {book_id} deleted successfully")
        return result
