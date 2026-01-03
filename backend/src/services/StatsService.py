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
    
    def get_total_time_read(self, year: Optional[int] = None) -> int:
        """
        Calculate total reading time across all sessions or for a specific year.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, returns total for all years.
        
        Returns:
            int: Total minutes read across filtered sessions, 0 if no sessions
        """
        logger.debug(f"Calculating total time read{f' for year {year}' if year else ''}")
        
        if year is not None:
            sessions = self._session_repo.get_by_year(year)
        else:
            sessions = self._session_repo.get_all()
        
        total_minutes = sum(session.get_minutes_read() for session in sessions)
        logger.info(f"Total time read: {total_minutes} minutes from {len(sessions)} sessions")
        return total_minutes
    
    def get_daily_stats(self, year: Optional[int] = None) -> Dict[str, int]:
        """
        Get reading statistics grouped by date, optionally filtered by year.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, returns stats for all years.
        
        Returns:
            Dict[str, int]: Dictionary mapping date strings (YYYY-MM-DD) to total minutes,
                           empty dict if no sessions
        """
        logger.debug(f"Calculating daily stats{f' for year {year}' if year else ''}")
        
        if year is not None:
            sessions = self._session_repo.get_by_year(year)
        else:
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
    
    def get_time_by_book(self, year: Optional[int] = None) -> Dict[str, Dict[str, Any]]:
        """
        Get reading time statistics grouped by book, optionally filtered by year.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, returns stats for all years.
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary mapping book_id to book info with total minutes
                                       Format: {book_id: {"title": str, "author": str, "total_minutes": int}}
                                       Empty dict if no sessions
        """
        logger.debug(f"Calculating time by book{f' for year {year}' if year else ''}")
        sessions_with_books = self._session_repo.get_all_sessions_with_books()
        
        book_stats = defaultdict(lambda: {"title": "", "author": "", "total_minutes": 0})
        
        for session in sessions_with_books:
            # session tuple: (session_id, book_id, date, minutes_read, title, author)
            session_id, book_id, session_date, minutes_read, title, author = session
            
            # Filter by year if specified
            if year is not None:
                if isinstance(session_date, str):
                    if not session_date.startswith(str(year)):
                        continue
                elif isinstance(session_date, date):
                    if session_date.year != year:
                        continue
            
            book_stats[str(book_id)]["title"] = title
            book_stats[str(book_id)]["author"] = author if author else ""
            book_stats[str(book_id)]["total_minutes"] += minutes_read
        
        result = dict(book_stats)
        logger.info(f"Time by book calculated for {len(result)} books")
        return result
    
    def get_most_read_book(self, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Find the book with the most reading time, optionally filtered by year.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, considers all years.
        
        Returns:
            Optional[Dict[str, Any]]: Dictionary with book_id, title, author, and total_minutes,
                                     None if no sessions exist
        """
        logger.debug(f"Finding most read book{f' for year {year}' if year else ''}")
        time_by_book = self.get_time_by_book(year)
        
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
    
    def get_books_read_in_year(self, year: int) -> int:
        """
        Count the number of unique books that were read (had at least one session) in a specific year.
        
        This is different from get_books_finished_count() which only counts books with status='finished'.
        This function counts any book that had reading activity in the specified year,
        regardless of whether it was finished or not.
        
        Args:
            year: Year to count books for (e.g., 2025)
        
        Returns:
            int: Number of unique books with reading sessions in the specified year, 0 if none
        """
        logger.debug(f"Counting unique books read in year {year}")
        sessions_with_books = self._session_repo.get_all_sessions_with_books()
        
        if not sessions_with_books:
            logger.info("No reading sessions found")
            return 0
        
        # Use a set to store unique book IDs that were read in the specified year
        books_read = set()
        
        for session in sessions_with_books:
            # session tuple: (session_id, book_id, date, minutes_read, title, author)
            session_id, book_id, session_date, minutes_read, title, author = session
            
            # Filter by year
            if isinstance(session_date, str):
                if session_date.startswith(str(year)):
                    books_read.add(book_id)
            elif isinstance(session_date, date):
                if session_date.year == year:
                    books_read.add(book_id)
        
        count = len(books_read)
        logger.info(f"Books read in {year}: {count} unique books")
        return count
    
    def calculate_current_streak(self) -> int:
        """
        Calculate the current active reading streak (consecutive days with sessions).
        
        This function implements Duolingo-style streak logic:
        - If you read today or yesterday, the streak continues (you have today to maintain it)
        - If the last reading session was 2+ days ago, the streak is broken (resets to 0)
        - Counts backwards from the most recent session until finding a gap
        
        Returns:
            int: Number of consecutive days with reading sessions in the current active streak,
                 0 if streak is broken (last session was 2+ days ago)
        """
        logger.debug("Calculating current reading streak (Duolingo-style)")
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
        
        if not unique_dates:
            logger.info("No valid dates found, current streak is 0")
            return 0
        
        # Find the most recent session date
        most_recent_date = max(unique_dates)
        today = date.today()
        
        # Calculate days since last session
        days_since_last_session = (today - most_recent_date).days
        
        # Streak is broken if last session was more than 1 day ago
        # (Today = 0 days, Yesterday = 1 day is still valid)
        if days_since_last_session > 1:
            logger.info(f"Streak broken: last session was {days_since_last_session} days ago on {most_recent_date}")
            return 0
        
        # Count consecutive days backwards from the most recent session
        streak = 0
        current_date = most_recent_date
        
        while current_date in unique_dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        logger.info(f"Current reading streak: {streak} days (last session: {most_recent_date})")
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
    
    def get_most_read_author(self, year: Optional[int] = None) -> Optional[str]:
        """
        Find the author with the most total reading time, optionally filtered by year.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, considers all years.
        
        Returns:
            Optional[str]: Author name with most reading minutes,
                          None if no sessions or all authors are empty/null
        """
        logger.debug(f"Finding most read author{f' for year {year}' if year else ''}")
        sessions_with_books = self._session_repo.get_all_sessions_with_books()
        
        if not sessions_with_books:
            logger.info("No reading sessions found")
            return None
        
        author_totals = defaultdict(int)
        
        for session in sessions_with_books:
            # session tuple: (session_id, book_id, date, minutes_read, title, author)
            session_id, book_id, session_date, minutes_read, title, author = session
            
            # Filter by year if specified
            if year is not None:
                if isinstance(session_date, str):
                    if not session_date.startswith(str(year)):
                        continue
                elif isinstance(session_date, date):
                    if session_date.year != year:
                        continue
            
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
    
    def get_summary_stats(self, year: Optional[int] = None) -> Dict[str, Any]:
        """
        Get comprehensive summary of all reading statistics, optionally filtered by year.
        
        Combines all statistical methods into a single comprehensive report
        useful for dashboard displays.
        
        Args:
            year: Optional year to filter sessions (e.g., 2025). If None, returns stats for all years.
        
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
        logger.info(f"Generating summary statistics{f' for year {year}' if year else ''}")
        
        summary = {
            "total_minutes_read": self.get_total_time_read(year),
            "books_finished": self.get_books_finished_count(),
            "books_read_in_year": self.get_books_read_in_year(year) if year else None,
            "daily_stats": self.get_daily_stats(year),
            "book_stats": self.get_time_by_book(year),
            "most_read_book": self.get_most_read_book(year),
            "most_read_author": self.get_most_read_author(year),
            "books_finished_by_year": self.get_books_finished_by_year(),
            "current_streak": self.calculate_current_streak(),
            "max_streak": self.calculate_max_streak()
        }
        
        logger.info("Summary statistics generated successfully")
        return summary
    
    def get_wrapped_stats(self, year: int) -> Dict[str, Any]:
        """
        Generate a comprehensive "Spotify Wrapped" style summary for a specific year.
        
        This method provides all key metrics for the year in a format optimized
        for displaying an annual reading summary similar to Spotify Wrapped.
        
        Args:
            year: Year to generate wrapped stats for (e.g., 2025)
        
        Returns:
            Dict[str, Any]: Dictionary containing comprehensive year statistics:
                - year: The year for this wrapped summary
                - total_minutes_read: Total reading time in the year
                - total_hours_read: Total reading time converted to hours
                - books_read: Number of unique books read in the year
                - books_finished_in_year: Number of books finished in the year
                - days_read: Number of unique days with reading sessions
                - average_minutes_per_day: Average reading time per active day
                - most_read_book: Book with most reading time in the year
                - most_read_author: Author with most reading time in the year
                - longest_session: Longest single reading session in the year
                - current_streak: Current active reading streak (if applicable)
                - top_books: Top 5 books by reading time in the year
        """
        logger.info(f"Generating Wrapped statistics for year {year}")
        
        # Get basic metrics filtered by year
        total_minutes = self.get_total_time_read(year)
        books_read = self.get_books_read_in_year(year)
        most_read_book = self.get_most_read_book(year)
        most_read_author = self.get_most_read_author(year)
        daily_stats = self.get_daily_stats(year)
        book_stats = self.get_time_by_book(year)
        
        # Calculate books finished in this specific year
        books_finished_by_year = self.get_books_finished_by_year()
        books_finished_in_year = books_finished_by_year.get(year, 0)
        
        # Calculate days read (unique days with sessions)
        days_read = len(daily_stats)
        
        # Calculate average minutes per active reading day
        average_minutes_per_day = round(total_minutes / days_read, 1) if days_read > 0 else 0
        
        # Find longest single reading session in the year
        sessions = self._session_repo.get_by_year(year)
        longest_session = max((session.get_minutes_read() for session in sessions), default=0)
        
        # Get top 5 books by reading time
        top_books = []
        if book_stats:
            sorted_books = sorted(
                book_stats.items(),
                key=lambda x: x[1]["total_minutes"],
                reverse=True
            )[:5]
            
            top_books = [
                {
                    "book_id": int(book_id),
                    "title": book_data["title"],
                    "author": book_data["author"],
                    "total_minutes": book_data["total_minutes"]
                }
                for book_id, book_data in sorted_books
            ]
        
        # Get current streak (only if still active)
        current_streak = self.calculate_current_streak()
        
        wrapped_stats = {
            "year": year,
            "total_minutes_read": total_minutes,
            "total_hours_read": round(total_minutes / 60, 1),
            "books_read": books_read,
            "books_finished_in_year": books_finished_in_year,
            "days_read": days_read,
            "average_minutes_per_day": average_minutes_per_day,
            "most_read_book": most_read_book,
            "most_read_author": most_read_author,
            "longest_session": longest_session,
            "current_streak": current_streak,
            "top_books": top_books
        }
        
        logger.info(f"Wrapped statistics for {year} generated successfully")
        return wrapped_stats
