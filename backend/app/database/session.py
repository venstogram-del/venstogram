from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.core.config import settings

class Base(DeclarativeBase):
    pass

# Async engine supporting SQLite (local/Render) or PostgreSQL / Supabase with high concurrency
is_sqlite = "sqlite" in settings.DATABASE_URL.lower()
connect_args = {"check_same_thread": False, "timeout": 60} if is_sqlite else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=20 if not is_sqlite else 5,
    max_overflow=40 if not is_sqlite else 10
)

# Enable SQLite WAL (Write-Ahead-Logging) and memory optimizations to withstand 100,000+ requests without locking
if is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.execute("PRAGMA cache_size=-128000") # 128MB cache
        cursor.execute("PRAGMA temp_store=MEMORY")
        try:
            cursor.execute("PRAGMA mmap_size=268435456") # 256MB memory map
        except Exception:
            pass
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
