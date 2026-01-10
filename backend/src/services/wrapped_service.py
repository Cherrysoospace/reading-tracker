# services/wrapped_service.py

from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional
from ..repositories.SessionRepository import SessionRepository
from ..repositories.BookRepository import BookRepository

class WrappedService:
    def __init__(self, session_repo: SessionRepository, book_repo: BookRepository):
        self.session_repo = session_repo
        self.book_repo = book_repo
    
    def get_wrapped_data(self, year: int) -> Dict[str, Any]:
        """
        Get complete Reading Wrapped data for a specific year
        """
        # Get all data for the year
        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()
        
        sessions = self.session_repo.get_by_date_range(start_date, end_date)
        all_books = self.book_repo.get_all()
        
        # Calculate all metrics
        return {
            "year": year,
            "general_stats": self.calculate_general_stats(sessions),
            "protagonist_book": self.calculate_protagonist_book(sessions, all_books),
            "authors_stats": self.calculate_authors_stats(sessions, all_books),
            "reading_habits": self.calculate_reading_habits(sessions),
            "biggest_reading_day": self.calculate_biggest_reading_day(sessions),
            "reading_status": self.calculate_reading_status(all_books, year),
            "reader_personality": self.determine_reader_personality(sessions, all_books, year)
        }
    
    def calculate_general_stats(self, sessions: List) -> Dict[str, Any]:
        """
        Calculate general statistics
        """
        if not sessions:
            return {
                "total_books_finished": 0,
                "total_minutes": 0,
                "total_days_with_reading": 0,
                "average_minutes_per_active_day": 0,
                "longest_streak": 0
            }
        
        # Total minutes
        total_minutes = sum(s.get_minutes_read() for s in sessions)
        
        # Unique dates
        unique_dates = set(s.get_date() for s in sessions)
        total_days = len(unique_dates)
        
        # Average per active day
        avg_per_day = total_minutes // total_days if total_days > 0 else 0
        
        # Longest streak
        longest_streak = self._calculate_longest_streak(sessions)
        
        # Books finished (need to check status and end_date in year)
        # This will be calculated in reading_status method
        
        return {
            "total_minutes": total_minutes,
            "total_hours": round(total_minutes / 60, 1),
            "total_days_with_reading": total_days,
            "average_minutes_per_active_day": avg_per_day,
            "longest_streak": longest_streak
        }
    
    def _calculate_longest_streak(self, sessions: List) -> int:
        """
        Calculate longest streak of consecutive days
        """
        if not sessions:
            return 0
        
        # Get unique dates sorted
        dates = sorted(set(datetime.strptime(s.get_date(), "%Y-%m-%d").date() for s in sessions))
        
        if not dates:
            return 0
        
        max_streak = 1
        current_streak = 1
        
        for i in range(1, len(dates)):
            if (dates[i] - dates[i-1]).days == 1:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 1
        
        return max_streak
    
    def calculate_protagonist_book(self, sessions: List, books: List) -> Dict[str, Any]:
        """
        Calculate protagonist book metrics
        """
        if not sessions:
            return {}
        
        # Group by book
        book_data = defaultdict(lambda: {"minutes": 0, "sessions": 0})
        
        for session in sessions:
            book_data[session.get_book_id()]["minutes"] += session.get_minutes_read()
            book_data[session.get_book_id()]["sessions"] += 1
        
        # Most read by minutes
        most_minutes_id = max(book_data.items(), key=lambda x: x[1]["minutes"])[0]
        most_minutes_book = next((b for b in books if b.get_id() == most_minutes_id), None)
        
        # Most sessions
        most_sessions_id = max(book_data.items(), key=lambda x: x[1]["sessions"])[0]
        most_sessions_book = next((b for b in books if b.get_id() == most_sessions_id), None)
        
        # Fastest and slowest (only finished books)
        finished_books = [b for b in books if b.get_status() == "finished" and b.get_end_date()]
        
        fastest_book = None
        slowest_book = None
        
        if finished_books:
            books_with_duration = []
            for book in finished_books:
                try:
                    start = datetime.strptime(book.get_start_date(), "%Y-%m-%d")
                    end = datetime.strptime(book.get_end_date(), "%Y-%m-%d")
                    duration = (end - start).days
                    books_with_duration.append((book, duration))
                except:
                    continue
            
            if books_with_duration:
                fastest_book, fastest_days = min(books_with_duration, key=lambda x: x[1])
                slowest_book, slowest_days = max(books_with_duration, key=lambda x: x[1])
        
        return {
            "most_read_by_minutes": {
                "id": most_minutes_book.get_id() if most_minutes_book else None,
                "title": most_minutes_book.get_title() if most_minutes_book else "Unknown",
                "author": most_minutes_book.get_author() if most_minutes_book else "Unknown",
                "minutes": book_data[most_minutes_id]["minutes"]
            } if most_minutes_book else None,
            "most_sessions": {
                "id": most_sessions_book.get_id() if most_sessions_book else None,
                "title": most_sessions_book.get_title() if most_sessions_book else "Unknown",
                "author": most_sessions_book.get_author() if most_sessions_book else "Unknown",
                "sessions": book_data[most_sessions_id]["sessions"]
            } if most_sessions_book else None,
            "fastest": {
                "title": fastest_book.get_title(),
                "author": fastest_book.get_author(),
                "days": fastest_days
            } if fastest_book else None,
            "slowest": {
                "title": slowest_book.get_title(),
                "author": slowest_book.get_author(),
                "days": slowest_days
            } if slowest_book else None
        }
    
    def calculate_authors_stats(self, sessions: List, books: List) -> Dict[str, Any]:
        """
        Calculate author statistics
        """
        if not sessions:
            return {
                "most_read_author": None,
                "unique_authors": 0,
                "top_3_authors": []
            }
        
        # Group minutes by author
        author_minutes = defaultdict(int)
        
        for session in sessions:
            book = next((b for b in books if b.get_id() == session.get_book_id()), None)
            if book and book.get_author():
                author_minutes[book.get_author()] += session.get_minutes_read()
        
        if not author_minutes:
            return {
                "most_read_author": None,
                "unique_authors": 0,
                "top_3_authors": []
            }
        
        # Sort by minutes
        sorted_authors = sorted(author_minutes.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "most_read_author": {
                "name": sorted_authors[0][0],
                "minutes": sorted_authors[0][1],
                "hours": round(sorted_authors[0][1] / 60, 1)
            },
            "unique_authors": len(author_minutes),
            "top_3_authors": [
                {
                    "name": author,
                    "minutes": minutes,
                    "hours": round(minutes / 60, 1)
                }
                for author, minutes in sorted_authors[:3]
            ]
        }
    
    def calculate_reading_habits(self, sessions: List) -> Dict[str, Any]:
        """
        Calculate reading habits
        """
        if not sessions:
            return {}
        
        # Average session duration
        total_minutes = sum(s.get_minutes_read() for s in sessions)
        avg_session = total_minutes // len(sessions) if sessions else 0
        
        # Session classification
        short_sessions = sum(1 for s in sessions if s.get_minutes_read() < 20)
        medium_sessions = sum(1 for s in sessions if 20 <= s.get_minutes_read() <= 45)
        long_sessions = sum(1 for s in sessions if s.get_minutes_read() > 45)
        
        # Day of week analysis
        day_counts = Counter()
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        for session in sessions:
            date = datetime.strptime(session.get_date(), "%Y-%m-%d")
            day_counts[date.weekday()] += 1
        
        most_common_day_num = day_counts.most_common(1)[0][0] if day_counts else 0
        most_common_day = day_names[most_common_day_num]
        
        # Month with most minutes
        month_minutes = defaultdict(int)
        month_names = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        
        for session in sessions:
            date = datetime.strptime(session.get_date(), "%Y-%m-%d")
            month_minutes[date.month] += session.get_minutes_read()
        
        best_month_num = max(month_minutes.items(), key=lambda x: x[1])[0] if month_minutes else 1
        best_month = month_names[best_month_num - 1]
        
        return {
            "average_session_duration": avg_session,
            "session_classification": {
                "short": short_sessions,
                "medium": medium_sessions,
                "long": long_sessions,
                "short_percentage": round((short_sessions / len(sessions)) * 100, 1),
                "medium_percentage": round((medium_sessions / len(sessions)) * 100, 1),
                "long_percentage": round((long_sessions / len(sessions)) * 100, 1)
            },
            "favorite_day": most_common_day,
            "best_month": {
                "name": best_month,
                "minutes": month_minutes[best_month_num],
                "hours": round(month_minutes[best_month_num] / 60, 1)
            }
        }
    
    def calculate_biggest_reading_day(self, sessions: List) -> Dict[str, Any]:
        """
        Calculate the day with most reading (REQUIRED metric)
        """
        if not sessions:
            return None
        
        # Group by date
        day_data = defaultdict(lambda: {"minutes": 0, "sessions": 0})
        
        for session in sessions:
            day_data[session.get_date()]["minutes"] += session.get_minutes_read()
            day_data[session.get_date()]["sessions"] += 1
        
        # Find max
        best_day, data = max(day_data.items(), key=lambda x: x[1]["minutes"])
        
        return {
            "date": best_day,
            "minutes": data["minutes"],
            "hours": round(data["minutes"] / 60, 1),
            "sessions": data["sessions"]
        }
    
    def calculate_reading_status(self, books: List, year: int) -> Dict[str, Any]:
        """
        Calculate reading status
        """
        # Books finished in this year
        finished_in_year = [
            b for b in books 
            if b.get_status() == "finished" and b.get_end_date() and b.get_end_date().startswith(str(year))
        ]
        
        # Books started in this year
        started_in_year = [
            b for b in books 
            if b.get_start_date() and b.get_start_date().startswith(str(year))
        ]
        
        # Currently reading
        currently_reading = [b for b in books if b.get_status() == "reading"]
        
        # Books with longest reading time
        reading_duration = []
        for book in currently_reading:
            try:
                start = datetime.strptime(book.get_start_date(), "%Y-%m-%d")
                now = datetime.now()
                days = (now - start).days
                reading_duration.append((book, days))
            except:
                continue
        
        reading_duration.sort(key=lambda x: x[1], reverse=True)
        
        return {
            "books_finished": len(finished_in_year),
            "books_started": len(started_in_year),
            "currently_reading": len(currently_reading),
            "completion_rate": round((len(finished_in_year) / len(started_in_year)) * 100, 1) if started_in_year else 0,
            "longest_in_reading": [
                {
                    "title": book.get_title(),
                    "author": book.get_author(),
                    "days": days
                }
                for book, days in reading_duration[:3]
            ]
        }
    
    def determine_reader_personality(self, sessions: List, books: List, year: int) -> Dict[str, str]:
        """
        Determine reader personality based on patterns (interpretative)
        """
        if not sessions:
            return {
                "type": "beginner",
                "description": "You're just starting your reading journey!"
            }
        
        # Calculate metrics for personality
        avg_session = sum(s.get_minutes_read() for s in sessions) / len(sessions)
        total_sessions = len(sessions)
        
        started_books = [b for b in books if b.get_start_date() and b.get_start_date().startswith(str(year))]
        finished_books = [b for b in books if b.get_status() == "finished" and b.get_end_date() and b.get_end_date().startswith(str(year))]
        
        completion_rate = (len(finished_books) / len(started_books)) * 100 if started_books else 0
        
        # Determine type
        personality = {}
        
        if total_sessions > 100 and avg_session < 30:
            personality["type"] = "constant_reader"
            personality["description"] = "You're a constant reader! You prefer short, frequent sessions and make reading a daily habit."
        elif total_sessions < 50 and avg_session > 45:
            personality["type"] = "intensive_reader"
            personality["description"] = "You're an intensive reader! When you read, you dive deep with long, immersive sessions."
        elif len(started_books) > len(finished_books) * 2:
            personality["type"] = "explorer"
            personality["description"] = "You're an explorer! You love starting new books and discovering different stories."
        elif completion_rate > 80:
            personality["type"] = "finisher"
            personality["description"] = "You're a finisher! You're committed to completing what you start."
        else:
            personality["type"] = "balanced_reader"
            personality["description"] = "You're a balanced reader! You have a healthy mix of reading habits."
        
        return personality
