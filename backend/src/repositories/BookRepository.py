import sqlite3
from typing import List, Optional
from datetime import datetime

from ..core.database import DatabaseConnection
from ..core.logging import get_logger
from ..models.Book import Book

logger = get_logger(__name__)


class BookRepository:
    """
    Repository class for managing Book entities in the database.
    
    This class handles all CRUD operations for books and provides methods
    to interact with the books table in the SQLite database.
    """
    
    def __init__(self, db_connection: DatabaseConnection) -> None:
        """
        Initialize the BookRepository with a database connection.
        
        Args:
            db_connection: DatabaseConnection instance for database operations
        """
        self._db_connection = db_connection
    
    def create(self, book: Book) -> int:
        """
        Insert a new book into the database.
        
        Args:
            book: Book object to insert into the database
            
        Returns:
            int: ID of the newly created book
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.info(f"Creating book: {book.get_title()}")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO books (title, author, start_date, status)
                VALUES (?, ?, ?, ?)
            """, (
                book.get_title(),
                book.get_author(),
                book.get_start_date().strftime('%Y-%m-%d') if isinstance(book.get_start_date(), datetime) else book.get_start_date(),
                book.get_status()
            ))
            
            conn.commit()
            book_id = cursor.lastrowid
            logger.info(f"Book created successfully with ID: {book_id}")
            return book_id
        except sqlite3.Error as e:
            logger.error(f"Failed to create book '{book.get_title()}': {e}")
            raise sqlite3.Error(f"Failed to create book: {e}")
    
    def get_all(self) -> List[Book]:
        """
        Retrieve all books from the database.
        
        Returns:
            List[Book]: List of all Book objects, empty list if no books found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.debug("Retrieving all books")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, title, author, start_date, end_date, status FROM books")
            rows = cursor.fetchall()
            
            books = []
            for row in rows:
                book = Book(
                    id=row['id'],
                    title=row['title'],
                    author=row['author'],
                    start_date=row['start_date'],
                    end_date=row['end_date'],
                    status=row['status']
                )
                books.append(book)
            
            logger.info(f"Retrieved {len(books)} books")
            return books
        except sqlite3.Error as e:
            logger.error(f"Failed to retrieve books: {e}")
            raise sqlite3.Error(f"Failed to retrieve books: {e}")
    
    def get_by_id(self, book_id: int) -> Optional[Book]:
        """
        Retrieve a single book by its ID.
        
        Args:
            book_id: ID of the book to retrieve
            
        Returns:
            Optional[Book]: Book object if found, None if not found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.debug(f"Retrieving book with ID: {book_id}")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, title, author, start_date, end_date, status 
                FROM books 
                WHERE id = ?
            """, (book_id,))
            
            row = cursor.fetchone()
            
            if row is None:
                logger.warning(f"Book with ID {book_id} not found")
                return None
            
            logger.info(f"Book with ID {book_id} retrieved successfully")
            return Book(
                id=row['id'],
                title=row['title'],
                author=row['author'],
                start_date=row['start_date'],
                end_date=row['end_date'],
                status=row['status']
            )
        except sqlite3.Error as e:
            logger.error(f"Failed to retrieve book with ID {book_id}: {e}")
            raise sqlite3.Error(f"Failed to retrieve book with ID {book_id}: {e}")
    
    def update(self, book_id: int, data: dict) -> bool:
        """
        Update book fields dynamically based on provided data dictionary.
        
        Args:
            book_id: ID of the book to update
            data: Dictionary containing fields to update (title, author, start_date, end_date, status)
            
        Returns:
            bool: True if update successful, False otherwise
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            if not data:
                logger.warning(f"Update called for book {book_id} with no data")
                return False
            
            # Build UPDATE query dynamically based on data keys
            allowed_fields = {'title', 'author', 'start_date', 'end_date', 'status'}
            update_fields = {k: v for k, v in data.items() if k in allowed_fields}
            
            if not update_fields:
                logger.warning(f"Update called for book {book_id} with no valid fields")
                return False
            
            logger.info(f"Updating book {book_id} with fields: {list(update_fields.keys())}")
            
            # Create SET clause and values
            set_clause = ', '.join([f"{field} = ?" for field in update_fields.keys()])
            values = list(update_fields.values())
            values.append(book_id)  # Add book_id for WHERE clause
            
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            query = f"UPDATE books SET {set_clause} WHERE id = ?"
            cursor.execute(query, values)
            
            conn.commit()
            success = cursor.rowcount > 0
            if success:
                logger.info(f"Book {book_id} updated successfully")
            else:
                logger.warning(f"Book {book_id} not found for update")
            return success
        except sqlite3.Error as e:
            logger.error(f"Failed to update book with ID {book_id}: {e}")
            raise sqlite3.Error(f"Failed to update book with ID {book_id}: {e}")
    
    def delete(self, book_id: int) -> bool:
        """
        Delete a book by its ID.
        
        Args:
            book_id: ID of the book to delete
            
        Returns:
            bool: True if deleted successfully, False if not found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.info(f"Deleting book with ID: {book_id}")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
            
            conn.commit()
            success = cursor.rowcount > 0
            if success:
                logger.info(f"Book {book_id} deleted successfully")
            else:
                logger.warning(f"Book {book_id} not found for deletion")
            return success
        except sqlite3.Error as e:
            logger.error(f"Failed to delete book with ID {book_id}: {e}")
            raise sqlite3.Error(f"Failed to delete book with ID {book_id}: {e}")
    
    def has_sessions(self, book_id: int) -> bool:
        """
        Check if a book has associated reading sessions.
        
        Args:
            book_id: ID of the book to check
            
        Returns:
            bool: True if book has reading sessions, False otherwise
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) as session_count 
                FROM reading_sessions 
                WHERE book_id = ?
            """, (book_id,))
            
            row = cursor.fetchone()
            return row['session_count'] > 0
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to check sessions for book with ID {book_id}: {e}")
