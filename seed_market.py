import asyncio
import os
import sys

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.session import AsyncSessionLocal
from app.models.entities import User, UsernameListing
from sqlalchemy import select

from datetime import datetime, timedelta, timezone

async def main():
    async with AsyncSessionLocal() as session:
        # Find system owner
        res = await session.execute(select(User).where(User.role == "director"))
        vensto_owner = res.scalars().first()
        if not vensto_owner:
            res = await session.execute(select(User).limit(1))
            vensto_owner = res.scalars().first()

        far_future = datetime.now(timezone.utc) + timedelta(days=365)

        # Popular Uzbek names ($500)
        uzbek_names = [
            "alisher", "shoxrux", "jasur", "sardor", "farrux", "bobur", "otabek", "dilshod",
            "sanjar", "bekzod", "javohir", "islom", "azamat", "eldor", "umar",
            "madina", "sevara", "malika", "laylo", "rayhon", "kamola", "nigora",
            "shahzoda", "dilnoza", "gulnora", "zarina", "shaxnoza", "yulduz", "nozima", "shirin"
        ]

        # VIP Brands & Cities ($10,000 - $20,000)
        vip_items = [
            ("apple", 20000, "brands"),
            ("nike", 15000, "brands"),
            ("adidas", 15000, "brands"),
            ("galaxy", 10000, "brands"),
            ("bmw", 18000, "brands"),
            ("mercedes", 20000, "brands"),
            ("tashkent", 20000, "cities"),
            ("samarkand", 15000, "cities"),
            ("bukhara", 12000, "cities"),
            ("khiva", 10000, "cities"),
            ("fergana", 10000, "cities"),
            ("andijan", 10000, "cities"),
            ("namangan", 10000, "cities")
        ]

        count = 0
        for name in uzbek_names:
            check = await session.execute(select(UsernameListing).where(UsernameListing.username == name))
            if not check.scalars().first():
                item = UsernameListing(
                    username=name,
                    seller_id=vensto_owner.id,
                    price_usd=500,
                    price_uzs=6500000.0,
                    current_price_coins=65000,
                    buyout_price_coins=65000,
                    category="uzbek_names",
                    expires_at=far_future,
                    is_sold=False
                )
                session.add(item)
                count += 1

        for name, price_usd, cat in vip_items:
            check = await session.execute(select(UsernameListing).where(UsernameListing.username == name))
            if not check.scalars().first():
                item = UsernameListing(
                    username=name,
                    seller_id=vensto_owner.id,
                    price_usd=price_usd,
                    price_uzs=price_usd * 13000.0,
                    current_price_coins=price_usd * 130,
                    buyout_price_coins=price_usd * 130,
                    category=cat,
                    expires_at=far_future,
                    is_sold=False
                )
                session.add(item)
                count += 1

        await session.commit()
        print(f"Successfully seeded {count} official Venstogram username listings!")

if __name__ == "__main__":
    asyncio.run(main())
