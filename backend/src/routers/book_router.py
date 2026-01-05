from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from datetime import date

from ..services.BookService import BookService
from ..repositories.BookRepository import BookRepository
from ..repositories.SessionRepository import SessionRepository
from ..schemas.book_schemas import BookCreate, BookUpdate, BookResponse
from ..core.database import DatabaseConnection
from ..core.logging import get_logger

logger = get_logger(__name__)

# Create router with prefix and tags
router = APIRouter(prefix="/books", tags=["Books"])


def get_book_service():
    """
    Dependency function to create and return a BookService instance.
    
    Uses context manager to ensure database connections are properly closed
    after each request, preventing memory leaks.
    
    Yields:
        BookService: Configured BookService instance
    """
    # Use context manager to ensure connection is closed
    with DatabaseConnection() as db_connection:
        db_connection.initialize_database()
        
        # Initialize repositories
        book_repo = BookRepository(db_connection)
        session_repo = SessionRepository(db_connection)
        
        # Create and yield BookService
        yield BookService(book_repo, session_repo)


@router.post(
    "/",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new book",
    description="Add a new book to start tracking reading sessions"
)
def create_book(
    book: BookCreate,
    book_service: BookService = Depends(get_book_service)
) -> BookResponse:
    """
    Create a new book in the reading tracker.
    
    Args:
        book: Book data (title, author, start_date)
        book_service: BookService dependency
        
    Returns:
        BookResponse: The created book with assigned ID
        
    Raises:
        HTTPException 400: If validation fails (empty title, future date)
    """
    logger.info(f"POST /books - Creating book: {book.title}")
    created_book = book_service.create_book(
        title=book.title,
        author=book.author,
        start_date=book.start_date
    )
    
    # Convert Book model to BookResponse
    return BookResponse(
        id=created_book.get_id(),
        title=created_book.get_title(),
        author=created_book.get_author() or "",
        start_date=created_book.get_start_date(),
        end_date=created_book.get_end_date(),
        status=created_book.get_status()
    )


@router.get(
    "/",
    response_model=List[BookResponse],
    summary="Get all books",
    description="Retrieve all books in the reading tracker"
)
def get_all_books(
    book_service: BookService = Depends(get_book_service)
) -> List[BookResponse]:
    """
    Get all books from the reading tracker.
    
    Args:
        book_service: BookService dependency
        
    Returns:
        List[BookResponse]: List of all books
    """
    logger.info("GET /books - Retrieving all books")
    books = book_service.get_all_books()
    
    # Convert Book models to BookResponse
    return [
        BookResponse(
            id=book.get_id(),
            title=book.get_title(),
            author=book.get_author() or "",
            start_date=book.get_start_date(),
            end_date=book.get_end_date(),
            status=book.get_status()
        )
        for book in books
    ]


@router.get(
    "/{book_id}",
    response_model=BookResponse,
    summary="Get book by ID",
    description="Retrieve a specific book by its ID"
)
def get_book(
    book_id: int,
    book_service: BookService = Depends(get_book_service)
) -> BookResponse:
    """
    Get a specific book by its ID.
    
    Args:
        book_id: ID of the book to retrieve
        book_service: BookService dependency
        
    Returns:
        BookResponse: The requested book
        
    Raises:
        HTTPException 404: If book not found
    """
    logger.info(f"GET /books/{book_id}")
    book = book_service.get_book(book_id)
    
    # Convert Book model to BookResponse
    return BookResponse(
        id=book.get_id(),
        title=book.get_title(),
        author=book.get_author() or "",
        start_date=book.get_start_date(),
        end_date=book.get_end_date(),
        status=book.get_status()
    )


@router.put(
    "/{book_id}",
    response_model=BookResponse,
    summary="Update a book",
    description="Update book information. All fields are optional."
)
def update_book(
    book_id: int,
    book: BookUpdate,
    book_service: BookService = Depends(get_book_service)
) -> BookResponse:
    """
    Update a book's information.
    
    Args:
        book_id: ID of the book to update
        book: Book update data (all fields optional)
        book_service: BookService dependency
        
    Returns:
        BookResponse: The updated book
        
    Raises:
        HTTPException 404: If book not found
        HTTPException 400: If validation fails
    """
    logger.info(f"PUT /books/{book_id}")
    
    # Call service with individual fields (handles None values)
    updated_book = book_service.update_book(
        book_id=book_id,
        title=book.title,
        author=book.author,
        start_date=book.start_date,
        end_date=book.end_date,
        status=book.status
    )
    
    # Convert Book model to BookResponse
    return BookResponse(
        id=updated_book.get_id(),
        title=updated_book.get_title(),
        author=updated_book.get_author() or "",
        start_date=updated_book.get_start_date(),
        end_date=updated_book.get_end_date(),
        status=updated_book.get_status()
    )


@router.patch(
    "/{book_id}/finish",
    response_model=BookResponse,
    summary="Mark book as finished",
    description="Mark a book as finished with an optional end date (defaults to today)"
)
def mark_book_as_finished(
    book_id: int,
    end_date: date = Query(default=None, description="Date when reading finished (defaults to today)"),
    book_service: BookService = Depends(get_book_service)
) -> BookResponse:
    """
    Mark a book as finished.
    
    Args:
        book_id: ID of the book to mark as finished
        end_date: Date when reading finished (defaults to today if not provided)
        book_service: BookService dependency
        
    Returns:
        BookResponse: The updated book with status='finished'
        
    Raises:
        HTTPException 404: If book not found
        HTTPException 400: If end_date is before start_date
    """
    # Use today's date if end_date not provided
    if end_date is None:
        end_date = date.today()
    
    logger.info(f"PATCH /books/{book_id}/finish - end_date={end_date}")
    
    finished_book = book_service.mark_as_finished(book_id, end_date)
    
    # Convert Book model to BookResponse
    return BookResponse(
        id=finished_book.get_id(),
        title=finished_book.get_title(),
        author=finished_book.get_author() or "",
        start_date=finished_book.get_start_date(),
        end_date=finished_book.get_end_date(),
        status=finished_book.get_status()
    )


@router.delete(
    "/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a book",
    description="Delete a book. Cannot delete books with reading sessions."
)
def delete_book(
    book_id: int,
    book_service: BookService = Depends(get_book_service)
) -> None:
    """
    Delete a book from the reading tracker.
    
    Args:
        book_id: ID of the book to delete
        book_service: BookService dependency
        
    Returns:
        None (204 No Content)
        
    Raises:
        HTTPException 404: If book not found
        HTTPException 400: If book has reading sessions
    """
    logger.info(f"DELETE /books/{book_id}")
    book_service.delete_book(book_id)
    # Return None for 204 No Content response
    return None
