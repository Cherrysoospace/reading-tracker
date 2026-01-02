import sqlite3
from typing import List, Optional, Tuple
from datetime import date

from ..core.database import DatabaseConnection
from ..core.logging import get_logger
from ..models.ReadingSession import ReadingSession

logger = get_logger(__name__)


class SessionRepository:
    """
    Repository class for managing ReadingSession entities in the database.
    
    This class handles all CRUD operations for reading sessions and provides
    methods to interact with the reading_sessions table in the SQLite database.
    """
    
    def __init__(self, db_connection: DatabaseConnection) -> None:
        """
        Initialize the SessionRepository with a database connection.
        
        Args:
            db_connection: DatabaseConnection instance for database operations
        """
        self._db_connection = db_connection
    
    def create(self, session: ReadingSession) -> int:
        """
        Insert a new reading session into the database.
        
        Args:
            session: ReadingSession object to insert into the database
            
        Returns:
            int: ID of the newly created session
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.info(f"Creating reading session for book {session.get_book_id()}")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            # Convert date to string format if needed
            session_date = session.get_date()
            if isinstance(session_date, date):
                session_date = session_date.strftime('%Y-%m-%d')
            
            cursor.execute("""
                INSERT INTO reading_sessions (book_id, date, minutes_read)
                VALUES (?, ?, ?)
            """, (
                session.get_book_id(),
                session_date,
                session.get_minutes_read()
            ))
            
            conn.commit()
            session_id = cursor.lastrowid
            logger.info(f"Reading session created successfully with ID: {session_id}")
            return session_id
        except sqlite3.Error as e:
            logger.error(f"Failed to create reading session for book {session.get_book_id()}: {e}")
            raise sqlite3.Error(f"Failed to create reading session: {e}")
    
    def get_all(self) -> List[ReadingSession]:
        """
        Retrieve all reading sessions from the database.
        
        Returns:
            List[ReadingSession]: List of all ReadingSession objects ordered by date DESC,
                                 empty list if no sessions found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.debug("Retrieving all reading sessions")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                ORDER BY date DESC
            """)
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                session = ReadingSession(
                    id=row['id'],
                    book_id=row['book_id'],
                    date=row['date'],
                    minutes_read=row['minutes_read']
                )
                sessions.append(session)
            
            logger.info(f"Retrieved {len(sessions)} reading sessions")
            return sessions
        except sqlite3.Error as e:
            logger.error(f"Failed to retrieve reading sessions: {e}")
            raise sqlite3.Error(f"Failed to retrieve reading sessions: {e}")
    
    def get_by_date(self, date: date) -> List[ReadingSession]:
        """
        Retrieve all sessions for a specific date.
        
        Args:
            date: Date object for which to retrieve sessions
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects for the specified date,
                                 empty list if no sessions found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            # Convert date to string format
            date_str = date.strftime('%Y-%m-%d')
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                WHERE date = ?
                ORDER BY id
            """, (date_str,))
            
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                session = ReadingSession(
                    id=row['id'],
                    book_id=row['book_id'],
                    date=row['date'],
                    minutes_read=row['minutes_read']
                )
                sessions.append(session)
            
            return sessions
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve sessions for date {date}: {e}")
    
    def get_by_date_range(self, start_date: date, end_date: date) -> List[ReadingSession]:
        """
        Retrieve sessions between two dates (inclusive).
        
        Args:
            start_date: Start date of the range
            end_date: End date of the range
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects within the date range
                                 ordered by date, empty list if no sessions found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            # Convert dates to string format
            start_date_str = start_date.strftime('%Y-%m-%d')
            end_date_str = end_date.strftime('%Y-%m-%d')
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                WHERE date >= ? AND date <= ?
                ORDER BY date
            """, (start_date_str, end_date_str))
            
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                session = ReadingSession(
                    id=row['id'],
                    book_id=row['book_id'],
                    date=row['date'],
                    minutes_read=row['minutes_read']
                )
                sessions.append(session)
            
            return sessions
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve sessions for date range {start_date} to {end_date}: {e}")
    
    def get_by_book(self, book_id: int) -> List[ReadingSession]:
        """
        Retrieve all sessions for a specific book.
        
        Args:
            book_id: ID of the book to retrieve sessions for
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects for the specified book
                                 ordered by date DESC, empty list if no sessions found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                WHERE book_id = ?
                ORDER BY date DESC
            """, (book_id,))
            
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                session = ReadingSession(
                    id=row['id'],
                    book_id=row['book_id'],
                    date=row['date'],
                    minutes_read=row['minutes_read']
                )
                sessions.append(session)
            
            return sessions
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve sessions for book ID {book_id}: {e}")
    
    def delete(self, session_id: int) -> bool:
        """
        Delete a session by its ID.
        
        Args:
            session_id: ID of the session to delete
            
        Returns:
            bool: True if deleted successfully, False if not found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            logger.info(f"Deleting reading session with ID: {session_id}")
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM reading_sessions WHERE id = ?", (session_id,))
            
            conn.commit()
            success = cursor.rowcount > 0
            if success:
                logger.info(f"Reading session {session_id} deleted successfully")
            else:
                logger.warning(f"Reading session {session_id} not found for deletion")
            return success
        except sqlite3.Error as e:
            logger.error(f"Failed to delete session with ID {session_id}: {e}")
            raise sqlite3.Error(f"Failed to delete session with ID {session_id}: {e}")
    
    def get_by_id(self, session_id: int) -> Optional[ReadingSession]:
        """
        Retrieve a single session by its ID.
        
        Args:
            session_id: ID of the session to retrieve
            
        Returns:
            Optional[ReadingSession]: ReadingSession object if found, None if not found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                WHERE id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            
            if row is None:
                return None
            
            return ReadingSession(
                id=row['id'],
                book_id=row['book_id'],
                date=row['date'],
                minutes_read=row['minutes_read']
            )
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve session with ID {session_id}: {e}")
    
    def get_all_sessions_with_books(self) -> List[Tuple]:
        """
        Retrieve all sessions with their associated book information.
        
        Performs a JOIN between reading_sessions and books tables to get
        comprehensive session data including book details.
        
        Returns:
            List[Tuple]: List of tuples containing (session_id, book_id, date, 
                        minutes_read, title, author), empty list if no sessions
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    rs.id,
                    rs.book_id,
                    rs.date,
                    rs.minutes_read,
                    b.title,
                    b.author
                FROM reading_sessions rs
                INNER JOIN books b ON rs.book_id = b.id
                ORDER BY rs.date DESC
            """)
            
            rows = cursor.fetchall()
            
            # Convert rows to tuples
            result = []
            for row in rows:
                result.append((
                    row['id'],
                    row['book_id'],
                    row['date'],
                    row['minutes_read'],
                    row['title'],
                    row['author']
                ))
            
            return result
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve sessions with book information: {e}")
    
    def get_by_year(self, year: int) -> List[ReadingSession]:
        """
        Retrieve all sessions for a specific year.
        
        Args:
            year: Year to filter sessions (e.g., 2025)
            
        Returns:
            List[ReadingSession]: List of ReadingSession objects for the specified year,
                                 empty list if no sessions found
            
        Raises:
            sqlite3.Error: If database operation fails
        """
        try:
            conn = self._db_connection.get_connection()
            cursor = conn.cursor()
            
            # Filter by year using LIKE pattern (YYYY%)
            year_pattern = f"{year}%"
            
            cursor.execute("""
                SELECT id, book_id, date, minutes_read 
                FROM reading_sessions 
                WHERE date LIKE ?
                ORDER BY date DESC
            """, (year_pattern,))
            
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                session = ReadingSession(
                    id=row['id'],
                    book_id=row['book_id'],
                    date=row['date'],
                    minutes_read=row['minutes_read']
                )
                sessions.append(session)
            
            return sessions
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to retrieve sessions for year {year}: {e}")
