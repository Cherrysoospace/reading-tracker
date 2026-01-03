from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from .routers import book_router, session_router, stats_router
from .core.database import DatabaseConnection
from .core.logging import get_logger, setup_logging

# Setup logging
setup_logging(level="INFO")
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    
    Handles startup and shutdown events using the modern lifespan approach
    instead of deprecated @app.on_event decorators.
    """
    # Startup
    try:
        logger.info("Starting Reading Tracker API...")
        db = DatabaseConnection()
        db.initialize_database()
        db.close()  # Close after initialization
        logger.info("Database initialized successfully")
        logger.info("Reading Tracker API is ready!")
        logger.info("API documentation available at: http://localhost:8000/docs")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("Shutting down Reading Tracker API...")
    logger.info("Goodbye!")


# Create FastAPI application with lifespan
app = FastAPI(
    title="Reading Tracker API",
    description="API for tracking reading sessions and statistics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",  # Live Server default port
        "http://localhost:8080",  # Alternative port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5500",  # Live Server default port
        "http://127.0.0.1:8080",  # Alternative port
        "*"  # Permitir todos los orígenes (solo para desarrollo)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(book_router.router)
app.include_router(session_router.router)
app.include_router(stats_router.router)


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information.
    
    Returns:
        dict: Welcome message and links to documentation
    """
    logger.info("Root endpoint accessed")
    return {
        "message": "Welcome to Reading Tracker API",
        "version": "1.0.0",
        "description": "API for tracking reading sessions and statistics",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "books": "/books",
            "sessions": "/sessions",
            "statistics": "/stats"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Useful for monitoring and container orchestration platforms.
    
    Returns:
        dict: Service health status
    """
    return {
        "status": "healthy",
        "service": "reading-tracker-api",
        "version": "1.0.0"
    }


def main():
    """
    Run the FastAPI application with Uvicorn server.
    
    Configuration:
    - Host: 0.0.0.0 (accessible from all network interfaces)
    - Port: 8000
    - Reload: True (auto-reload on code changes - development only)
    - Log level: info
    """
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
