import sqlite3
from typing import Optional


class DatabaseConnection:
    """
    Manages SQLite database connection for the Reading Tracker application.
    
    This class handles database connection lifecycle, table creation, and
    ensures proper cleanup of database resources.
    """
    
    def __init__(self, db_path: str = "reading.db") -> None:
        """
        Initialize the DatabaseConnection with a specified database path.
        
        Args:
            db_path: Path to the SQLite database file (default: "reading.db")
        """
        self.db_path = db_path
        self._connection: Optional[sqlite3.Connection] = None
        
    def get_connection(self) -> sqlite3.Connection:
        """
        Get or create a connection to the SQLite database.
        
        Returns:
            sqlite3.Connection: Active database connection object
            
        Raises:
            sqlite3.Error: If connection cannot be established
        """
        try:
            if self._connection is None:
                self._connection = sqlite3.connect(
                    self.db_path,
                    check_same_thread=False  # Allow multi-threaded access for FastAPI
                )
                self._connection.row_factory = sqlite3.Row
            return self._connection
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to connect to database: {e}")
    
    def initialize_database(self) -> None:
        """
        Create database tables if they don't exist.
        
        Creates two tables:
        - books: Stores book information and reading status
        - reading_sessions: Stores individual reading session records
        
        Raises:
            sqlite3.Error: If table creation fails
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create books table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS books (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    author TEXT,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    status TEXT NOT NULL
                )
            """)
            
            # Create reading_sessions table with foreign key constraint
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reading_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    book_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    minutes_read INTEGER NOT NULL,
                    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to initialize database: {e}")
    
    def close(self) -> None:
        """
        Close the database connection if it's open.
        
        This method should be called when the database connection is no longer needed
        to free up resources.
        """
        try:
            if self._connection is not None:
                self._connection.close()
                self._connection = None
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Failed to close database connection: {e}")
    
    def __enter__(self) -> 'DatabaseConnection':
        """
        Context manager entry point.
        
        Allows using DatabaseConnection with 'with' statement to ensure
        proper resource cleanup.
        
        Returns:
            DatabaseConnection: self
        """
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """
        Context manager exit point.
        
        Automatically closes the database connection when exiting the context.
        
        Args:
            exc_type: Exception type if an exception occurred
            exc_val: Exception value if an exception occurred
            exc_tb: Exception traceback if an exception occurred
        """
        self.close()
