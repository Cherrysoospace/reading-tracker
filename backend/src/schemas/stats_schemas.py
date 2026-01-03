from pydantic import BaseModel, Field, computed_field
from typing import Dict, List, Optional, Any


class BookStatsResponse(BaseModel):
    """
    Schema for individual book reading statistics.
    
    Contains aggregated reading time for a specific book.
    """
    book_id: int = Field(..., description="Unique identifier of the book")
    title: str = Field(..., description="Title of the book")
    author: str = Field(..., description="Author of the book")
    total_minutes: int = Field(..., ge=0, description="Total minutes read for this book")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "book_id": 1,
                "title": "The Pragmatic Programmer",
                "author": "Andrew Hunt",
                "total_minutes": 450
            }
        }
    }


class DailyStatsResponse(BaseModel):
    """
    Schema for daily reading statistics.
    
    Contains total reading time for a specific date.
    """
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    total_minutes: int = Field(..., ge=0, description="Total minutes read on this date")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "date": "2024-03-15",
                "total_minutes": 60
            }
        }
    }


class StreakStatsResponse(BaseModel):
    """
    Schema for reading streak statistics.
    
    Contains current and maximum reading streaks.
    """
    current_streak: int = Field(..., ge=0, description="Current consecutive days with reading sessions")
    max_streak: int = Field(..., ge=0, description="Maximum consecutive days streak ever achieved")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "current_streak": 7,
                "max_streak": 15
            }
        }
    }


class YearlyBooksResponse(BaseModel):
    """
    Schema for books finished by year.
    
    Contains count of books finished in a specific year.
    """
    year: int = Field(..., description="Year")
    books_finished: int = Field(..., ge=0, description="Number of books finished in this year")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2024,
                "books_finished": 12
            }
        }
    }


class SummaryStatsResponse(BaseModel):
    """
    Schema for comprehensive reading statistics summary.
    
    Contains all statistics including totals, streaks, top books/authors, and detailed breakdowns.
    This is the main response schema for the statistics endpoint.
    """
    total_minutes_read: int = Field(..., ge=0, description="Total minutes read across all sessions")
    books_finished: int = Field(..., ge=0, description="Total number of books finished")
    current_streak: int = Field(..., ge=0, description="Current consecutive days with reading sessions")
    max_streak: int = Field(..., ge=0, description="Maximum consecutive days streak ever achieved")
    most_read_book: Optional[BookStatsResponse] = Field(None, description="Book with most reading time")
    most_read_author: Optional[str] = Field(None, description="Author with most total reading time")
    daily_stats: List[DailyStatsResponse] = Field(default_factory=list, description="Reading statistics by date")
    book_stats: List[BookStatsResponse] = Field(default_factory=list, description="Reading statistics by book")
    books_finished_by_year: List[YearlyBooksResponse] = Field(default_factory=list, description="Books finished grouped by year")
    
    @computed_field
    @property
    def total_hours_read(self) -> float:
        """
        Computed field: Total hours read (derived from total_minutes_read).
        
        Returns:
            float: Total reading time in hours, rounded to 2 decimal places
        """
        return round(self.total_minutes_read / 60, 2)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_minutes_read": 2400,
                "total_hours_read": 40.0,
                "books_finished": 5,
                "books_read_in_year": 8,
                "current_streak": 7,
                "max_streak": 15,
                "most_read_book": {
                    "book_id": 1,
                    "title": "The Pragmatic Programmer",
                    "author": "Andrew Hunt",
                    "total_minutes": 450
                },
                "most_read_author": "Andrew Hunt",
                "daily_stats": [
                    {"date": "2024-03-15", "total_minutes": 60},
                    {"date": "2024-03-14", "total_minutes": 45}
                ],
                "book_stats": [
                    {
                        "book_id": 1,
                        "title": "The Pragmatic Programmer",
                        "author": "Andrew Hunt",
                        "total_minutes": 450
                    }
                ],
                "books_finished_by_year": [
                    {"year": 2024, "books_finished": 5},
                    {"year": 2023, "books_finished": 8}
                ]
            }
        }
    }


class BasicStatsResponse(BaseModel):
    """
    Schema for simplified reading statistics.
    
    Contains essential statistics for quick overview or dashboard widgets.
    This is a lighter version of SummaryStatsResponse.
    """
    total_minutes_read: int = Field(..., ge=0, description="Total minutes read across all sessions")
    books_finished: int = Field(..., ge=0, description="Total number of books finished")
    current_streak: int = Field(..., ge=0, description="Current consecutive days with reading sessions")
    most_read_author: Optional[str] = Field(None, description="Author with most total reading time")
    
    @computed_field
    @property
    def total_hours_read(self) -> float:
        """
        Computed field: Total hours read (derived from total_minutes_read).
        
        Returns:
            float: Total reading time in hours, rounded to 2 decimal places
        """
        return round(self.total_minutes_read / 60, 2)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_minutes_read": 2400,
                "total_hours_read": 40.0,
                "books_finished": 5,
                "current_streak": 7,
                "most_read_author": "Andrew Hunt"
            }
        }
    }


class WrappedStatsResponse(BaseModel):
    """
    Schema for "Spotify Wrapped" style annual reading summary.
    
    Contains comprehensive statistics for a specific year optimized
    for displaying an engaging annual reading recap.
    """
    year: int = Field(..., description="Year for this wrapped summary")
    total_minutes_read: int = Field(..., ge=0, description="Total minutes read in the year")
    total_hours_read: float = Field(..., ge=0, description="Total hours read in the year")
    books_read: int = Field(..., ge=0, description="Number of unique books read in the year")
    books_finished_in_year: int = Field(..., ge=0, description="Number of books finished in the year")
    days_read: int = Field(..., ge=0, description="Number of unique days with reading sessions")
    average_minutes_per_day: float = Field(..., ge=0, description="Average reading minutes per active day")
    most_read_book: Optional[BookStatsResponse] = Field(None, description="Book with most reading time in the year")
    most_read_author: Optional[str] = Field(None, description="Author with most reading time in the year")
    longest_session: int = Field(..., ge=0, description="Longest single reading session in minutes")
    current_streak: int = Field(..., ge=0, description="Current active reading streak (if applicable)")
    top_books: List[BookStatsResponse] = Field(default_factory=list, description="Top 5 books by reading time in the year")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2025,
                "total_minutes_read": 3600,
                "total_hours_read": 60.0,
                "books_read": 8,
                "books_finished_in_year": 5,
                "days_read": 120,
                "average_minutes_per_day": 30.0,
                "most_read_book": {
                    "book_id": 1,
                    "title": "The Pragmatic Programmer",
                    "author": "Andrew Hunt",
                    "total_minutes": 450
                },
                "most_read_author": "Andrew Hunt",
                "longest_session": 120,
                "current_streak": 7,
                "top_books": [
                    {
                        "book_id": 1,
                        "title": "The Pragmatic Programmer",
                        "author": "Andrew Hunt",
                        "total_minutes": 450
                    }
                ]
            }
        }
    }
