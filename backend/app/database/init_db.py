import asyncio
from datetime import datetime, timezone
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.entities import User

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[Database] All tables successfully created or verified.")

async def seed_demo_data():
    """No fake users or fake demo content."""
    pass

if __name__ == "__main__":
    asyncio.run(init_models())
    asyncio.run(seed_demo_data())
