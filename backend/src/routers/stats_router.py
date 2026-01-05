from fastapi import APIRouter, Depends, Query
from typing import Dict, List, Any, Optional

from ..services.StatsService import StatsService
from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository
from ..schemas.stats_schemas import (
    SummaryStatsResponse,
    BasicStatsResponse,
    StreakStatsResponse,
    BookStatsResponse,
    DailyStatsResponse,
    YearlyBooksResponse,
    WrappedStatsResponse
)
from ..core.database import DatabaseConnection
from ..core.logging import get_logger

logger = get_logger(__name__)

# Create router with prefix and tags
router = APIRouter(prefix="/stats", tags=["Statistics"])


def get_stats_service():
    """
    Dependency function to create and return a StatsService instance.
    
    Uses context manager to ensure database connections are properly closed
    after each request, preventing memory leaks.
    
    Yields:
        StatsService: Configured StatsService instance
    """
    # Use context manager to ensure connection is closed
    with DatabaseConnection() as db_connection:
        db_connection.initialize_database()
        
        # Initialize repositories
        session_repo = SessionRepository(db_connection)
        book_repo = BookRepository(db_connection)
        
        # Create and yield StatsService
        yield StatsService(session_repo, book_repo)


def format_daily_stats(stats_dict: Dict[str, int]) -> List[DailyStatsResponse]:
    """
    Convert daily stats dictionary to list of response objects.
    
    Args:
        stats_dict: Dictionary mapping date strings to total minutes
        
    Returns:
        List[DailyStatsResponse]: List sorted by date (most recent first)
    """
    return [
        DailyStatsResponse(date=date_str, total_minutes=minutes)
        for date_str, minutes in sorted(stats_dict.items(), reverse=True)
    ]


def format_book_stats(stats_dict: Dict[str, Dict[str, Any]]) -> List[BookStatsResponse]:
    """
    Convert book stats dictionary to list of response objects.
    
    Args:
        stats_dict: Dictionary mapping book_id to book stats
        
    Returns:
        List[BookStatsResponse]: List sorted by total minutes (descending)
    """
    result = [
        BookStatsResponse(
            book_id=int(book_id),
            title=book_data["title"],
            author=book_data["author"],
            total_minutes=book_data["total_minutes"]
        )
        for book_id, book_data in stats_dict.items()
    ]
    return sorted(result, key=lambda x: x.total_minutes, reverse=True)


@router.get(
    "/summary",
    response_model=SummaryStatsResponse,
    summary="Get complete statistics summary",
    description="Retrieve all reading statistics including totals, streaks, books, and daily data. Optionally filter by year."
)
def get_summary_stats(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> SummaryStatsResponse:
    """
    Get comprehensive summary of all reading statistics.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        SummaryStatsResponse: Complete statistics summary
    """
    logger.info(f"GET /stats/summary{f'?year={year}' if year else ''}")
    summary = stats_service.get_summary_stats(year)
    
    # Convert nested dicts to proper response objects
    daily_stats = format_daily_stats(summary["daily_stats"])
    book_stats = format_book_stats(summary["book_stats"])
    
    # Convert yearly stats dict to list of response objects
    yearly_stats = [
        YearlyBooksResponse(year=year, books_finished=count)
        for year, count in sorted(summary["books_finished_by_year"].items(), reverse=True)
    ]
    
    # Convert most_read_book dict to response object if exists
    most_read_book = None
    if summary["most_read_book"]:
        most_read_book = BookStatsResponse(**summary["most_read_book"])
    
    return SummaryStatsResponse(
        total_minutes_read=summary["total_minutes_read"],
        books_finished=summary["books_finished"],
        current_streak=summary["current_streak"],
        max_streak=summary["max_streak"],
        most_read_book=most_read_book,
        most_read_author=summary["most_read_author"],
        daily_stats=daily_stats,
        book_stats=book_stats,
        books_finished_by_year=yearly_stats
    )


@router.get(
    "/basic",
    response_model=BasicStatsResponse,
    summary="Get basic statistics",
    description="Quick overview of key reading statistics for dashboard widgets. Optionally filter by year."
)
def get_basic_stats(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> BasicStatsResponse:
    """
    Get basic reading statistics for quick overview.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        BasicStatsResponse: Essential statistics
    """
    logger.info(f"GET /stats/basic{f'?year={year}' if year else ''}")
    
    return BasicStatsResponse(
        total_minutes_read=stats_service.get_total_time_read(year),
        books_finished=stats_service.get_books_finished_count(year),
        current_streak=stats_service.calculate_current_streak(),
        most_read_author=stats_service.get_most_read_author(year)
    )


@router.get(
    "/daily",
    response_model=List[DailyStatsResponse],
    summary="Get daily reading statistics",
    description="Get total minutes read for each day. Optionally filter by year."
)
def get_daily_stats(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> List[DailyStatsResponse]:
    """
    Get daily reading statistics.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        List[DailyStatsResponse]: Daily statistics sorted by date (most recent first)
    """
    logger.info(f"GET /stats/daily{f'?year={year}' if year else ''}")
    daily_stats_dict = stats_service.get_daily_stats(year)
    return format_daily_stats(daily_stats_dict)


@router.get(
    "/books",
    response_model=List[BookStatsResponse],
    summary="Get reading statistics by book",
    description="Get total minutes read for each book, sorted by reading time. Optionally filter by year."
)
def get_book_stats(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> List[BookStatsResponse]:
    """
    Get reading statistics by book.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        List[BookStatsResponse]: Book statistics sorted by total minutes (descending)
    """
    logger.info(f"GET /stats/books{f'?year={year}' if year else ''}")
    book_stats_dict = stats_service.get_time_by_book(year)
    return format_book_stats(book_stats_dict)


@router.get(
    "/streaks",
    response_model=StreakStatsResponse,
    summary="Get reading streak statistics",
    description="Get current and maximum reading streaks (consecutive days)"
)
def get_streak_stats(
    stats_service: StatsService = Depends(get_stats_service)
) -> StreakStatsResponse:
    """
    Get reading streak statistics.
    
    Args:
        stats_service: StatsService dependency
        
    Returns:
        StreakStatsResponse: Current and maximum streak information
    """
    logger.info("GET /stats/streaks")
    
    return StreakStatsResponse(
        current_streak=stats_service.calculate_current_streak(),
        max_streak=stats_service.calculate_max_streak()
    )


@router.get(
    "/most-read-book",
    response_model=Optional[BookStatsResponse],
    summary="Get most read book",
    description="Get the book with the most reading time. Optionally filter by year."
)
def get_most_read_book(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> Optional[BookStatsResponse]:
    """
    Get the book with most reading time.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        Optional[BookStatsResponse]: Most read book or None if no sessions
    """
    logger.info(f"GET /stats/most-read-book{f'?year={year}' if year else ''}")
    most_read = stats_service.get_most_read_book(year)
    
    if most_read is None:
        return None
    
    return BookStatsResponse(**most_read)


@router.get(
    "/most-read-author",
    response_model=Dict[str, Optional[str]],
    summary="Get most read author",
    description="Get the author with the most total reading time. Optionally filter by year."
)
def get_most_read_author(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> Dict[str, Optional[str]]:
    """
    Get the author with most total reading time.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        Dict[str, Optional[str]]: Dictionary with author name or None
    """
    logger.info(f"GET /stats/most-read-author{f'?year={year}' if year else ''}")
    author = stats_service.get_most_read_author(year)
    return {"author": author}


@router.get(
    "/books-finished",
    response_model=Dict[str, int],
    summary="Get total books finished",
    description="Get the total number of books marked as finished. Optionally filter by year."
)
def get_books_finished(
    year: Optional[int] = Query(None, description="Filter by year (e.g., 2025). If not provided, returns all finished books."),
    stats_service: StatsService = Depends(get_stats_service)
) -> Dict[str, int]:
    """
    Get count of finished books.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        Dict[str, int]: Dictionary with books_finished count
    """
    logger.info(f"GET /stats/books-finished{f'?year={year}' if year else ''}")
    count = stats_service.get_books_finished_count(year)
    return {"books_finished": count}


@router.get(
    "/books-finished-by-year",
    response_model=List[YearlyBooksResponse],
    summary="Get books finished by year",
    description="Get the number of books finished grouped by year"
)
def get_books_finished_by_year(
    stats_service: StatsService = Depends(get_stats_service)
) -> List[YearlyBooksResponse]:
    """
    Get books finished grouped by year.
    
    Args:
        stats_service: StatsService dependency
        
    Returns:
        List[YearlyBooksResponse]: Books finished per year, sorted by year (descending)
    """
    logger.info("GET /stats/books-finished-by-year")
    yearly_dict = stats_service.get_books_finished_by_year()
    
    # Convert dict to list of response objects, sorted by year (most recent first)
    result = [
        YearlyBooksResponse(year=year, books_finished=count)
        for year, count in yearly_dict.items()
    ]
    return sorted(result, key=lambda x: x.year, reverse=True)


@router.get(
    "/total-time",
    response_model=Dict[str, Any],
    summary="Get total reading time",
    description="Get total time spent reading across all sessions. Optionally filter by year."
)
def get_total_time(
    year: Optional[int] = Query(None, description="Filter statistics by year (e.g., 2025). If not provided, returns all data."),
    stats_service: StatsService = Depends(get_stats_service)
) -> Dict[str, Any]:
    """
    Get total reading time in minutes and hours.
    
    Args:
        year: Optional year to filter statistics
        stats_service: StatsService dependency
        
    Returns:
        Dict[str, Any]: Total minutes and hours
    """
    logger.info(f"GET /stats/total-time{f'?year={year}' if year else ''}")
    total_minutes = stats_service.get_total_time_read(year)
    total_hours = round(total_minutes / 60, 2)
    
    return {
        "total_minutes": total_minutes,
        "total_hours": total_hours
    }


@router.get(
    "/books-read-in-year/{year}",
    response_model=Dict[str, int],
    summary="Get count of books read in a specific year",
    description="Count unique books that had at least one reading session in the specified year (regardless of whether they were finished)"
)
def get_books_read_in_year(
    year: int,
    stats_service: StatsService = Depends(get_stats_service)
) -> Dict[str, int]:
    """
    Get count of unique books read in a specific year.
    
    This counts any book that had reading activity in the year,
    different from books-finished which only counts completed books.
    
    Args:
        year: Year to count books for (e.g., 2025)
        stats_service: StatsService dependency
        
    Returns:
        Dict[str, int]: Dictionary with books_read count and year
    """
    logger.info(f"GET /stats/books-read-in-year/{year}")
    count = stats_service.get_books_read_in_year(year)
    
    return {
        "year": year,
        "books_read": count
    }


@router.get(
    "/wrapped/{year}",
    response_model=WrappedStatsResponse,
    summary="Get Spotify Wrapped style annual summary",
    description="Get comprehensive reading statistics for a specific year in a Spotify Wrapped style format. Perfect for annual reading recaps!"
)
def get_wrapped_stats(
    year: int,
    stats_service: StatsService = Depends(get_stats_service)
) -> WrappedStatsResponse:
    """
    Get comprehensive "Spotify Wrapped" style summary for a specific year.
    
    Returns all key reading metrics for the year including:
    - Total time read
    - Books read and finished
    - Reading streaks and patterns
    - Top books and authors
    - Reading habits analysis
    
    Args:
        year: Year to generate wrapped summary for (e.g., 2025)
        stats_service: StatsService dependency
        
    Returns:
        WrappedStatsResponse: Comprehensive annual reading summary
    """
    logger.info(f"GET /stats/wrapped/{year}")
    wrapped_data = stats_service.get_wrapped_stats(year)
    
    # Convert most_read_book dict to response object if exists
    most_read_book = None
    if wrapped_data["most_read_book"]:
        most_read_book = BookStatsResponse(**wrapped_data["most_read_book"])
    
    # Convert top_books list to response objects
    top_books = [
        BookStatsResponse(**book_data)
        for book_data in wrapped_data["top_books"]
    ]
    
    return WrappedStatsResponse(
        year=wrapped_data["year"],
        total_minutes_read=wrapped_data["total_minutes_read"],
        total_hours_read=wrapped_data["total_hours_read"],
        books_read=wrapped_data["books_read"],
        books_finished_in_year=wrapped_data["books_finished_in_year"],
        days_read=wrapped_data["days_read"],
        average_minutes_per_day=wrapped_data["average_minutes_per_day"],
        most_read_book=most_read_book,
        most_read_author=wrapped_data["most_read_author"],
        longest_session=wrapped_data["longest_session"],
        current_streak=wrapped_data["current_streak"],
        top_books=top_books
    )
