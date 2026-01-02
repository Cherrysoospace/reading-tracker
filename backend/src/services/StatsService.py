from typing import Dict, List, Optional, Any
from datetime import date, datetime, timedelta
from collections import defaultdict, Counter

from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository
from ..core.logging import get_logger

logger = get_logger(__name__)


class StatsService:
    """
    Service class for calculating reading statistics and analytics.
    
    This class provides various statistical methods to analyze reading habits,
    track progress, and generate summary reports.
    """
    
    def __init__(self, session_repo: SessionRepository, book_repo: BookRepository) -> None:
        """
        Initialize the StatsService with required repositories.
        
        Args:
            session_repo: SessionRepository instance for session data
            book_repo: BookRepository instance for book data
        """
        self._session_repo = session_repo
        self._book_repo = book_repo
    
    def get_total_time_read(self) -> int:
        """
        Calculate total reading time across all sessions.
        
        Returns:
            int: Total minutes read across all sessions, 0 if no sessions
        """
        logger.debug("Calculating total time read")
        sessions = self._session_repo.get_all()
        
        total_minutes = sum(session.get_minutes_read() for session in sessions)
        logger.info(f"Total time read: {total_minutes} minutes from {len(sessions)} sessions")
        return total_minutes
    
    def get_daily_stats(self) -> Dict[str, int]:
        """
        Get reading statistics grouped by date.
        
        Returns:
            Dict[str, int]: Dictionary mapping date strings (YYYY-MM-DD) to total minutes,
                           empty dict if no sessions
        """
        logger.debug("Calculating daily stats")
        sessions = self._session_repo.get_all()
        
        daily_totals = defaultdict(int)
        for session in sessions:
            session_date = session.get_date()
            # Convert to string if it's a date object
            if isinstance(session_date, date):
                date_str = session_date.strftime('%Y-%m-%d')
            else:
                date_str = session_date
            
            daily_totals[date_str] += session.get_minutes_read()
        
        result = dict(daily_totals)
        logger.info(f"Daily stats calculated for {len(result)} days")
        return result
    
    def get_time_by_book(self) -> Dict[str, Dict[str, Any]]:
        """
        Get reading time statistics grouped by book.
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary mapping book_id to book info with total minutes
                                       Format: {book_id: {"title": str, "author": str, "total_minutes": int}}
                                       Empty dict if no sessions
        """
        logger.debug("Calculating time by book")
        sessions_with_books = self._session_repo.get_all_sessions_with_books()
        
        book_stats = defaultdict(lambda: {"title": "", "author": "", "total_minutes": 0})
        
        for session in sessions_with_books:
            # session tuple: (session_id, book_id, date, minutes_read, title, author)
            session_id, book_id, session_date, minutes_read, title, author = session
            
            book_stats[str(book_id)]["title"] = title
            book_stats[str(book_id)]["author"] = author if author else ""
            book_stats[str(book_id)]["total_minutes"] += minutes_read
        
        result = dict(book_stats)
        logger.info(f"Time by book calculated for {len(result)} books")
        return result
    
    def get_most_read_book(self) -> Optional[Dict[str, Any]]:
        """
        Find the book with the most reading time.
        
        Returns:
            Optional[Dict[str, Any]]: Dictionary with book_id, title, author, and total_minutes,
                                     None if no sessions exist
        """
        logger.debug("Finding most read book")
        time_by_book = self.get_time_by_book()
        
        if not time_by_book:
            logger.info("No reading sessions found")
            return None
        
        # Find book with maximum total_minutes
        most_read_book_id = max(time_by_book.keys(), key=lambda k: time_by_book[k]["total_minutes"])
        most_read_data = time_by_book[most_read_book_id]
        
        result = {
            "book_id": int(most_read_book_id),
            "title": most_read_data["title"],
            "author": most_read_data["author"],
            "total_minutes": most_read_data["total_minutes"]
        }
        
        logger.info(f"Most read book: '{result['title']}' with {result['total_minutes']} minutes")
        return result
    
    def get_books_finished_count(self) -> int:
        """
        Count the number of finished books.
        
        Returns:
            int: Number of books with status='finished', 0 if none
        """
        logger.debug("Counting finished books")
        books = self._book_repo.get_all()
        
        finished_count = sum(1 for book in books if book.get_status() == 'finished')
        logger.info(f"Finished books count: {finished_count}")
        return finished_count
    
    def get_books_finished_by_year(self) -> Dict[int, int]:
        """
        Get count of finished books grouped by year.
        
        Returns:
            Dict[int, int]: Dictionary mapping year to count of books finished that year,
                           empty dict if no finished books
        """
        logger.debug("Calculating books finished by year")
        books = self._book_repo.get_all()
        
        year_counts = defaultdict(int)
        
        for book in books:
            if book.get_status() == 'finished' and book.get_end_date():
                end_date = book.get_end_date()
                
                # Parse year from end_date
                if isinstance(end_date, str):
                    # Parse string date (YYYY-MM-DD)
                    year = int(end_date.split('-')[0])
                elif isinstance(end_date, date):
                    year = end_date.year
                else:
                    continue
                
                year_counts[year] += 1
        
        result = dict(year_counts)
        logger.info(f"Books finished by year: {result}")
        return result
    
    def calculate_current_streak(self) -> int:
        """
        Calculate the current reading streak (consecutive days with sessions).
        
        Starts from today and counts backwards until finding a day without sessions.
        
        Returns:
            int: Number of consecutive days with reading sessions from today,
                 0 if no session today or yesterday
        """
        logger.debug("Calculating current reading streak")
        sessions = self._session_repo.get_all()
        
        if not sessions:
            logger.info("No sessions found, current streak is 0")
            return 0
        
        # Extract unique dates from sessions
        unique_dates = set()
        for session in sessions:
            session_date = session.get_date()
            
            # Convert to date object if string
            if isinstance(session_date, str):
                session_date = datetime.strptime(session_date, '%Y-%m-%d').date()
            
            unique_dates.add(session_date)
        
        # Start counting from today backwards
        today = date.today()
        current_date = today
        streak = 0
        
        # Check if there's a session today or yesterday to start counting
        if today not in unique_dates and (today - timedelta(days=1)) not in unique_dates:
            logger.info("No session today or yesterday, current streak is 0")
            return 0
        
        # Count consecutive days
        while current_date in unique_dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        logger.info(f"Current reading streak: {streak} days")
        return streak
    
    def calculate_max_streak(self) -> int:
        """
        Calculate the maximum reading streak ever achieved.
        
        Finds the longest sequence of consecutive days with reading sessions
        in the entire history.
        
        Returns:
            int: Maximum number of consecutive days with sessions, 0 if no sessions
        """
        logger.debug("Calculating maximum reading streak")
        sessions = self._session_repo.get_all()
        
        if not sessions:
            logger.info("No sessions found, max streak is 0")
            return 0
        
        # Extract unique dates from sessions
        unique_dates = set()
        for session in sessions:
            session_date = session.get_date()
            
            # Convert to date object if string
            if isinstance(session_date, str):
                session_date = datetime.strptime(session_date, '%Y-%m-%d').date()
            
            unique_dates.add(session_date)
        
        if not unique_dates:
            return 0
        
        # Sort dates
        sorted_dates = sorted(unique_dates)
        
        max_streak = 1
        current_streak = 1
        
        # Iterate through sorted dates and find longest consecutive sequence
        for i in range(1, len(sorted_dates)):
            days_diff = (sorted_dates[i] - sorted_dates[i - 1]).days
            
            if days_diff == 1:
                # Consecutive days
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                # Gap found, reset current streak
                current_streak = 1
        
        logger.info(f"Maximum reading streak ever: {max_streak} days")
        return max_streak
    
    def get_most_read_author(self) -> Optional[str]:
        """
        Find the author with the most total reading time.
        
        Returns:
            Optional[str]: Author name with most reading minutes,
                          None if no sessions or all authors are empty/null
        """
        logger.debug("Finding most read author")
        sessions_with_books = self._session_repo.get_all_sessions_with_books()
        
        if not sessions_with_books:
            logger.info("No reading sessions found")
            return None
        
        author_totals = defaultdict(int)
        
        for session in sessions_with_books:
            # session tuple: (session_id, book_id, date, minutes_read, title, author)
            session_id, book_id, session_date, minutes_read, title, author = session
            
            # Skip empty/null authors
            if author and author.strip():
                author_totals[author] += minutes_read
        
        if not author_totals:
            logger.info("No authors found with reading time")
            return None
        
        # Find author with maximum minutes
        most_read_author = max(author_totals.keys(), key=lambda a: author_totals[a])
        logger.info(f"Most read author: '{most_read_author}' with {author_totals[most_read_author]} minutes")
        return most_read_author
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive summary of all reading statistics.
        
        Combines all statistical methods into a single comprehensive report
        useful for dashboard displays.
        
        Returns:
            Dict[str, Any]: Dictionary containing all statistics:
                - total_minutes_read: Total reading time
                - books_finished: Count of finished books
                - daily_stats: Reading time by date
                - book_stats: Reading time by book
                - most_read_book: Book with most reading time
                - most_read_author: Author with most reading time
                - books_finished_by_year: Finished books grouped by year
                - current_streak: Current consecutive days streak
                - max_streak: Maximum streak ever achieved
        """
        logger.info("Generating summary statistics")
        
        summary = {
            "total_minutes_read": self.get_total_time_read(),
            "books_finished": self.get_books_finished_count(),
            "daily_stats": self.get_daily_stats(),
            "book_stats": self.get_time_by_book(),
            "most_read_book": self.get_most_read_book(),
            "most_read_author": self.get_most_read_author(),
            "books_finished_by_year": self.get_books_finished_by_year(),
            "current_streak": self.calculate_current_streak(),
            "max_streak": self.calculate_max_streak()
        }
        
        logger.info("Summary statistics generated successfully")
        return summary
