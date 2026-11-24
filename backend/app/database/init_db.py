import asyncio
from datetime import datetime, timedelta, timezone
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.entities import (
    User, Post, Story, Reel, UsernameListing, LiveBattle
)

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[Database] All tables successfully created or verified.")

async def seed_demo_data():
    async with AsyncSessionLocal() as session:
        # Check if users already exist
        from sqlalchemy import select
        res = await session.execute(select(User).limit(1))
        if res.scalars().first():
            print("[Database] Demo data already exists. Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        
        # 1. Create Demo Admin & Celebrities / Streamers
        admin = User(
            telegram_id=8787674425,
            username="venstogram_admin",
            first_name="Vensto",
            last_name="Director",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            bio="Official Venstogram Platform Team ✨ Streaming & Social Network",
            role="director",
            is_verified=True,
            verified_until=now + timedelta(days=365),
            wallet_coins=50000,
            wallet_uzs=5000000.0,
            language_code="ru"
        )
        
        streamer1 = User(
            telegram_id=100001,
            username="shoxrux_live",
            first_name="Shoxrux",
            last_name="Mirzo",
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
            bio="PK Battle Champion 🏆 Стримы каждый день в 21:00! Tashkent 📍",
            role="user",
            is_verified=True,
            verified_until=now + timedelta(days=180),
            wallet_coins=12400,
            wallet_uzs=1240000.0,
            language_code="uz"
        )

        streamer2 = User(
            telegram_id=100002,
            username="madina_star",
            first_name="Madina",
            last_name="Alimova",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
            bio="Beauty, Lifestyle, Dance Reels & Live Battles 💫",
            role="user",
            is_verified=True,
            verified_until=now + timedelta(days=90),
            wallet_coins=8900,
            wallet_uzs=890000.0,
            language_code="ru"
        )
        
        tech_lead = User(
            telegram_id=100003,
            username="it_lead_bek",
            first_name="Farrux",
            last_name="IT Admin",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            bio="Head of IT & Security @ Venstogram 🛡️",
            role="it_admin",
            is_verified=True,
            wallet_coins=15000,
            language_code="en"
        )

        session.add_all([admin, streamer1, streamer2, tech_lead])
        await session.flush()

        # 2. Seed Stories
        story1 = Story(
            user_id=streamer1.id,
            media_url="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
            media_type="image",
            caption="Готовимся к вечернему PK Баттлу! Кто со мной? 🔥",
            expires_at=now + timedelta(hours=24)
        )
        story2 = Story(
            user_id=streamer2.id,
            media_url="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80",
            media_type="image",
            caption="Прекрасное утро в Ташкенте ☀️",
            expires_at=now + timedelta(hours=24)
        )
        session.add_all([story1, story2])

        # 3. Seed Posts
        post1 = Post(
            user_id=streamer1.id,
            caption="Завершился финал турнира! Огромное спасибо всем за поддержку и подарки 🦁👑 #venstogram #battle #tashkent #pkwinner",
            media_urls=[
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80"
            ],
            media_type="carousel",
            location="Tashkent City",
            hashtags=["venstogram", "battle", "tashkent", "pkwinner"],
            likes_count=342,
            views_count=1890,
            comments_count=28
        )
        post2 = Post(
            user_id=streamer2.id,
            caption="Новая коллекция уже доступна! Как вам образ? Оцените от 1 до 10 в комментариях 👇✨ #fashion #style #uzbekistan",
            media_urls=[
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
            ],
            media_type="image",
            location="Samarkand Plaza",
            hashtags=["fashion", "style", "uzbekistan"],
            likes_count=512,
            views_count=3400,
            comments_count=45
        )
        session.add_all([post1, post2])

        # 4. Seed Reels
        reel1 = Reel(
            user_id=streamer2.id,
            video_url="https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-in-front-of-a-neon-sign-40431-large.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80",
            caption="Когда включили любимый трек в машине 💃🔥 #dance #vibes #trend",
            audio_title="Tashkent Nights Beat",
            audio_author="DJ Vensto",
            likes_count=1240,
            views_count=8900,
            comments_count=87,
            shares_count=134
        )
        reel2 = Reel(
            user_id=streamer1.id,
            video_url="https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-green-screen-42994-large.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80",
            caption="Новый функционал Venstogram Mini App просто разрыв! 🚀 #tech #telegram #webapp",
            audio_title="Future Tech Vibe",
            audio_author="Venstogram Sound",
            likes_count=850,
            views_count=5420,
            comments_count=43,
            shares_count=98
        )
        session.add_all([reel1, reel2])

        # 5. Seed Username Listings (Marketplace)
        listing1 = UsernameListing(
            username="king",
            seller_id=admin.id,
            current_price_coins=3500,
            buyout_price_coins=10000,
            category="short_3letter",
            expires_at=now + timedelta(days=5)
        )
        listing2 = UsernameListing(
            username="crypto",
            seller_id=tech_lead.id,
            current_price_coins=5000,
            buyout_price_coins=15000,
            category="premium",
            expires_at=now + timedelta(days=7)
        )
        listing3 = UsernameListing(
            username="uzbek",
            seller_id=streamer1.id,
            current_price_coins=4000,
            buyout_price_coins=12000,
            category="premium",
            expires_at=now + timedelta(days=3)
        )
        listing4 = UsernameListing(
            username="boss",
            seller_id=admin.id,
            current_price_coins=2500,
            buyout_price_coins=8000,
            category="short_3letter",
            expires_at=now + timedelta(days=2)
        )
        session.add_all([listing1, listing2, listing3, listing4])

        # 6. Seed an active PK Battle
        battle = LiveBattle(
            host_id=streamer1.id,
            guest_id=streamer2.id,
            title="Гранд Баттл: Ташкент против Самарканда 🔥",
            status="active",
            duration_seconds=300,
            penalty_task="Выпить 3 сырых яйца или станцевать лезгинку в прямом эфире!",
            host_score=1450,
            guest_score=1680,
            started_at=now - timedelta(minutes=2)
        )
        session.add(battle)

        await session.commit()
        print("[Database] Seeded initial users, stories, posts, reels, marketplace listings, and active PK Battle!")

if __name__ == "__main__":
    asyncio.run(init_models())
    asyncio.run(seed_demo_data())
