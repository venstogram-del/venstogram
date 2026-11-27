import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import re
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.entities import User, UsernameListing

NAMES_RAW = """
Abbos, Abduaziz, Abduvali, Abduvohid, Abdug‘affor, Abdujalil, Abdukarim, Abduqodir, Abdulaziz, Abdulla, Abdulhamid, Abdumalik, Abdumannon, Abdumurod, Abdunosir, Abdurasul, Abdurauf, Abdurahmon, Abdurashid, Abdusalom, Abdusattor, Abduhakim, Abduhalil, Abror, Avaz, Avazbek, A’zam, Azamat, Aziz, Azizbek, Akbar, Akmal, Akram, Ali, Alisher, Alpomish, Amir, Amirbek, Amirxon, Anvar, Arslon, Asad, Asadbek, Asilbek, Asliddin, Asror, Atabek, Ahmad, Ahror, Bobur, Badriddin, Bahrom, Baxtiyor, Bahodir, Bekzod, Bekmurod, Bekpo‘lat, Bektemir, Bektosh, Bekxon, Behzod, Behruz, Bilol, Botir, Bunyod, Burhon, Vali, Valijon, Vahob, Vohid, G‘ayrat, G‘anisher, G‘iyos, G‘iyosiddin, G‘ulom, Davron, Davlat, Daler, Dilmurod, Dilshod, Doniyor, Doston, Dostonbek, Javohir, Jalol, Jaloliddin, Jamshid, Jasur, Jasurbek, Jahongir, Jobir, Jo‘rabek, Zafar, Zafarbek, Ziyovuddin, Zikrullo, Zoir, Zokir, Zuhriddin, Zufar, Ibrohim, Iqbol, Ikrom, Ilhom, Ilyos, Imom, Iskandar, Islom, Islombek, Ismoil, Isfandiyor, Ixtiyor, Yigitali, Yo‘ldosh, Kamol, Kamoliddin, Karim, Komil, Komron, Komronbek, Quvonch, Quvonchbek, Qudrat, Qurbon, Laziz, Lazizbek, Latif, Lochin, Lochinbek, Lutfullo, Mavlon, Madamin, Maqsud, Malik, Mansur, Ma’ruf, Mahmud, Mashrab, Mirza, Mirzo, Mirzohid, Mirkamol, Mironshoh, Mirsaid, Mirfayz, Muzaffar, Muqim, Mo‘min, Munis, Murod, Murodbek, Murtazo, Muslim, Mustafo, Muhammad, Muhammadali, Muhammadamin, Muhammadziyo, Muhammadislom, Muhammadkarim, Muhammadsodiq, Muhammadumar, Muhammadyusuf, Muxtor, Muhiddin, Nabi, Navro‘z, Najmiddin, Nazar, Nazir, Naim, Narimon, Nasim, Nasrullo, Ne’mat, Nizom, Nizomiddin, Nodir, Nodirbek, Nozim, Nosir, Nu’mon, Nuriddin, Nurmuhammad, Nurbek, Nursulton, Obid, Odil, Odilbek, Ozod, Ozodbek, Oybek, Olim, Olimjon, Olloyor, Omad, Omon, Orif, Ortiq, Otabek, Oxun, Polvon, Parviz, Po‘lat, Ravshan, Rajab, Raim, Ramazon, Rasul, Rauf, Rahmat, Rahmatillo, Rahmon, Rashid, Rizo, Ro‘zimurod, Rustam, Rufat, Sabur, Sadriddin, Said, Saidamir, Saidakbar, Saidkamol, Sayfiddin, Salohiddin, Samandar, Sami, Sanjar, Sarvar, Sardor, Sattor, Safar, Sirojiddin, Sobir, Sodiq, Solih, Sulaymon, Sulton, Sultonbek, Suhrob, Tavakkal, Tal’at, Temur, Temurbek, Tolib, Tohir, To‘lqin, To‘rabek, Tursun, To‘xtasin, Ubaydullo, O‘ktam, Ulug‘bek, Umar, Umarbek, Umid, Umidbek, Usmon, O‘tkir, Fazliddin, Fayzullo, Farrux, Farhod, Fathullo, Firdavs, Fozil, Furqat, Habib, Habibullo, Haydar, Xayrullo, Hakim, Xalil, Hamza, Hamid, Hamidullo, Hasan, Hikmat, Hikmatillo, Hojiakbar, Xolmurod, Xondamir, Xudoyor, Xurshid, Husan, Husniddin, Chori, Chingiz, Shavkat, Shamsiddin, Sharif, Shahboz, Shahzod, Shahriyor, Shahrux, Sherali, Sherzod, Shermuhammad, Shirinbek, Shodiyor, Shokir, Shomansur, Shohjahon, Shohrux, Shohruz, Shukrullo, Shuhrat, Elbek, Eldor, Elyor, Elmurod, Elnur, Ergash, Erkin, Eson, Ehson, Yunus, Yusuf, Yoqub, Yahyo, Yashin
"""

def clean_name(raw: str) -> str:
    s = raw.strip()
    s = s.replace("o‘", "o").replace("O‘", "o").replace("o'", "o").replace("O'", "o").replace("o’", "o").replace("O’", "o")
    s = s.replace("g‘", "g").replace("G‘", "g").replace("g'", "g").replace("G'", "g").replace("g’", "g").replace("G’", "g")
    s = s.replace("‘", "").replace("’", "").replace("'", "").replace("`", "")
    s = s.lower()
    return re.sub(r"[^a-z0-9_]", "", s)

FEMALE_NAMES_RAW = """
Aziza, Oysha, Aqida, Aliya, Amina, Amira, Anbar, Anor, Anora, Asal, Asaloy, Asila, Asma, Atirgul, Afifa, Barno, Barchin, Barchinoy, Bahor, Bahora, Begoyim, Bibigul, Bibisora, Bibixadicha, Bonu, Bo‘ston, Vazira, Vasila, Visola, Gavhar, Gavharoy, Gulbahor, Gulbadan, Guljamol, Guljahon, Gulzira, Gulzoda, Guli, Gulira’no, Gulnoz, Gulnoza, Gulnora, Gulruh, Gulruhsor, Gulsanam, Gulsara, Gulchehra, Gulshan, Gulshoda, Go‘zal, Go‘zaloy, Damira, Dilafruz, Dilbar, Dildora, Dilnoz, Dilnoza, Dilnura, Dilorom, Dilrabo, Dilruh, Dilsora, Dilfuza, Dilya, Dinara, Diyora, Durdona, Jamila, Jasmina, Jonsuluv, Zamira, Zarina, Zarifa, Zahro, Zebiniso, Zebo, Ziyoda, Zilola, Zinnat, Zoira, Zokira, Zulayho, Zulfiya, Zulxumor, Zumrad, Zuhra, Ibodat, Iroda, Ifora, Iqboloy, Imona, Kamila, Kamola, Karima, Kibriyo, Komila, Kumush, Kumushoy, Qurbonoy, Laziza, Laylo, Latifa, Latofat, Leysan, Lola, Lolaxon, Lutfiya, Mavjuda, Mavluda, Madina, Maysara, Malika, Mamlakat, Manzura, Marvarid, Marg‘uba, Marjona, Marhabo, Maryam, Mastura, Matluba, Maftuna, Mahbuba, Mahliyo, Mahmuda, Mahfuza, Mehribon, Mehriniso, Mehrinoz, Mohigul, Mohidil, Mohinur, Mohira, Mohichehra, Muazzam, Muattar, Mubina, Muzayyana, Muqaddas, Mukarram, Munavvar, Munira, Munis, Munisa, Muslima, Muhayyo, Muxlisa, Mushtariy, Navbahor, Navro‘za, Nadira, Najiba, Nazira, Nazokat, Nazmina, Naima, Nargiza, Nasiba, Nafisa, Ne’matxon, Nigina, Nigora, Nilufar, Niso, Nodira, Nozima, Nozli, Noila, Nurxon, Nuriya, Obida, Odina, Odinaxon, Ozoda, Oygul, Oydin, Oyjamol, Oyniso, Oysara, Oyshaxon, Oliya, Olmaxon, Omina, Orasta, Orzigul, Orifa, Osiyo, Ominaxon, Parizod, Parizoda, Parvina, Pokiza, Rabia, Ravshanoy, Ra’no, Rahima, Raxshona, Rayhon, Rayhona, Regina, Risolat, Robiya, Roziya, Ruxsora, Ruxshona, Ruqiya, Sabina, Sabohat, Sabrina, Sadoqat, Saida, Sayyora, Salima, Salomat, Samira, Sanam, Saodat, Sara, Sarvinoz, Sevara, Sevinch, Sitora, Sobira, Sojida, Soliha, Sora, Sug‘diyona, Surayyo, Tabassum, Tanzila, Tojiniso, To‘maris, Tursunoy, To‘tixon, O‘g‘iloy, O‘lmasxon, Umida, Usmona, Fazilat, Farida, Farishta, Farzona, Farog‘at, Fotima, Feruza, Firuza, Fozila, Habiba, Xadicha, Xayriniso, Halima, Hamida, Hanifa, Xosiyat, Hilola, Hojar, Xolida, Hulkar, Xumor, Xumora, Hurriyat, Xurshida, Husnida, Husnora, Charos, Chinor, Cho‘lponoy, Shabnam, Shahlo, Shahnoza, Shahrizoda, Shahriniso, Shahsanam, Shirin, Shirinoy, Shodiyona, Shoira, Shohida, Shohista, Shohsanam, Shukrona, Shukufa, E’zoza, Elnora, Yulduz, Yulduzoy, Yasmina
"""

TOP_SHORT_NAMES = {
    "ali", "amir", "aziz", "umar", "said", "bobur", "islom", "temur", "davlat", "malik", "sulton", "bilol", "yusuf",
    "asal", "guli", "lola", "bonu", "zebo", "dilya", "sora", "niso", "aziza", "madina", "malika", "rayhon", "yulduz"
}

async def init_models():
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Auto-migrate newly added columns for users, stories, and comments
        for col_sql in [
            "ALTER TABLE users ADD COLUMN is_registered BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN birth_year INTEGER",
            "ALTER TABLE users ADD COLUMN birth_date VARCHAR(32)",
            "ALTER TABLE users ADD COLUMN badge_type VARCHAR(32) DEFAULT 'blue'",
            "ALTER TABLE users ADD COLUMN is_incognito BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN is_private BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN profile_theme VARCHAR(32) DEFAULT 'default'",
            "ALTER TABLE users ADD COLUMN allow_calls VARCHAR(32) DEFAULT 'all'",
            "ALTER TABLE stories ADD COLUMN is_close_friends BOOLEAN DEFAULT 0",
            "ALTER TABLE reel_comments ADD COLUMN parent_id INTEGER",
            "ALTER TABLE reels ADD COLUMN moderation_status VARCHAR(32) DEFAULT 'approved'"
        ]:
            try:
                await conn.execute(text(col_sql))
            except Exception:
                pass

        # Clean any legacy boy/girl stock photo avatars so everyone has their own uploaded avatar or initials badge
        try:
            await conn.execute(text("UPDATE users SET avatar_url = '' WHERE avatar_url LIKE '%unsplash%' OR avatar_url LIKE '%photo-%'"))
            # Purge demo posts and demo reels completely
            await conn.execute(text("DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE caption LIKE '%Xush kelibsiz Venstogram%' OR caption LIKE '%Samarqand Registon%' OR location LIKE '%Samarqand%')"))
            await conn.execute(text("DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE caption LIKE '%Xush kelibsiz Venstogram%' OR caption LIKE '%Samarqand Registon%' OR location LIKE '%Samarqand%')"))
            await conn.execute(text("DELETE FROM saved_items WHERE item_type = 'post' AND item_id IN (SELECT id FROM posts WHERE caption LIKE '%Xush kelibsiz Venstogram%' OR caption LIKE '%Samarqand Registon%' OR location LIKE '%Samarqand%')"))
            await conn.execute(text("DELETE FROM posts WHERE caption LIKE '%Xush kelibsiz Venstogram%' OR caption LIKE '%Samarqand Registon%' OR location LIKE '%Samarqand%'"))

            await conn.execute(text("DELETE FROM reel_comments WHERE reel_id IN (SELECT id FROM reels WHERE caption LIKE '%Toshkent shahar manzaralari%' OR caption LIKE '%Tog%' OR video_url LIKE '%commondatastorage%')"))
            await conn.execute(text("DELETE FROM reel_likes WHERE reel_id IN (SELECT id FROM reels WHERE caption LIKE '%Toshkent shahar manzaralari%' OR caption LIKE '%Tog%' OR video_url LIKE '%commondatastorage%')"))
            await conn.execute(text("DELETE FROM saved_items WHERE item_type = 'reel' AND item_id IN (SELECT id FROM reels WHERE caption LIKE '%Toshkent shahar manzaralari%' OR caption LIKE '%Tog%' OR video_url LIKE '%commondatastorage%')"))
            await conn.execute(text("DELETE FROM reels WHERE caption LIKE '%Toshkent shahar manzaralari%' OR caption LIKE '%Tog%' OR video_url LIKE '%commondatastorage%'"))
        except Exception as e:
            pass
    print("[Database] All tables and columns successfully verified and demo media purged.")

async def seed_demo_data():
    """Seeds Founder Director account and marketplace official listings."""
    async with AsyncSessionLocal() as session:
        # 1. Ensure Founder Director exists with fixed known credentials for login
        from app.core.security import hash_password
        admin_pass_hash = hash_password("VenstoAdmin2026!#")
        res = await session.execute(select(User).where((User.telegram_id == 1477103854) | (User.role == "director") | (User.username == "oqyolai")))
        director = res.scalars().first()
        if not director:
            director = User(
                telegram_id=1477103854,
                username="oqyolai",
                first_name="Abdulazizbek",
                last_name="Director",
                role="director",
                email="admin@venstogram.com",
                password_hash=admin_pass_hash,
                is_verified=True,
                is_registered=True,
                wallet_coins=100000,
                language_code="ru"
            )
            session.add(director)
            await session.flush()
        else:
            director.telegram_id = 1477103854
            director.username = "oqyolai"
            director.role = "director"
            director.email = director.email or "admin@venstogram.com"
            director.password_hash = admin_pass_hash
            director.is_verified = True
            director.is_registered = True
            await session.flush()

        director_id = director.id

        # Strictly ensure no other account has director/admin role
        from sqlalchemy import update
        await session.execute(
            update(User).where(User.telegram_id != 1477103854, User.role.in_(["director", "admin", "it_admin", "moderator"])).values(role="user")
        )
        # Ensure all Telegram users are marked registered and verified
        await session.execute(
            update(User).where(User.telegram_id.is_not(None)).values(is_registered=True, is_email_verified=True)
        )
        await session.commit()

        # 2. Seed Special High-Value Usernames on Sale (starts from $500, up to $30,000)
        SPECIAL_SALE_USERNAMES = [
            ("ou", "ultra_rare", 30000),
            ("uz", "ultra_rare", 30000),
            ("uzb", "ultra_rare", 5000),
            ("uzbek", "vip_brands", 1500),
            ("hamrohim", "uzbek_names", 500),
            ("uzbekiston", "exclusive", 999999),
            ("uzbekistan", "exclusive", 999999)
        ]
        for un, cat, pr_usd in SPECIAL_SALE_USERNAMES:
            chk = await session.execute(select(UsernameListing).where(func.lower(UsernameListing.username) == un.lower()))
            existing = chk.scalars().first()
            pr_uzs = float(pr_usd * 13000)
            if not existing:
                nl = UsernameListing(
                    username=un,
                    seller_id=director_id,
                    category=cat,
                    price_usd=pr_usd,
                    price_uzs=pr_uzs,
                    current_price_coins=pr_usd * 10,
                    buyout_price_coins=pr_usd * 10,
                    is_sold=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=3650)
                )
                session.add(nl)
            else:
                existing.price_usd = pr_usd
                existing.price_uzs = pr_uzs
                existing.category = cat
                existing.seller_id = director_id
                existing.is_sold = False

        # 2b. Seed Uzbek Cities on Sale (from $3,000+)
        CITIES_SALE = [
            ("tashkent", 10000),
            ("toshkent", 10000),
            ("samarkand", 5000),
            ("samarqand", 5000),
            ("bukhara", 5000),
            ("buxoro", 5000),
            ("andijan", 3000),
            ("andijon", 3000),
            ("fergana", 3000),
            ("fargona", 3000),
            ("namangan", 3000),
            ("nukus", 3000),
            ("karshi", 3000),
            ("qarshi", 3000),
            ("termez", 3000),
            ("termiz", 3000),
            ("urgench", 3000),
            ("urganch", 3000),
            ("navoi", 3000),
            ("navoiy", 3000),
            ("jizzakh", 3000),
            ("jizzax", 3000),
            ("gulistan", 3000),
            ("guliston", 3000),
            ("kokand", 3000),
            ("qoqon", 3000),
            ("margilan", 3000),
            ("margilon", 3000),
            ("asaka", 3000),
            ("chirchik", 3000),
            ("chirchiq", 3000),
            ("almalyk", 3000),
            ("olmaliq", 3000),
            ("angren", 3000),
            ("shakhrisabz", 3000),
            ("shahrisabz", 3000),
            ("khiva", 3000),
            ("xiva", 3000),
            ("denau", 3000),
            ("denov", 3000),
            ("chust", 3000),
            ("zarafshan", 3000),
            ("zarafshon", 3000)
        ]
        for city_name, city_price in CITIES_SALE:
            chk = await session.execute(select(UsernameListing).where(func.lower(UsernameListing.username) == city_name.lower()))
            existing_city = chk.scalars().first()
            c_uzs = float(city_price * 13000)
            if not existing_city:
                nl = UsernameListing(
                    username=city_name,
                    seller_id=director_id,
                    category="uzbek_cities",
                    price_usd=city_price,
                    price_uzs=c_uzs,
                    current_price_coins=city_price * 10,
                    buyout_price_coins=city_price * 10,
                    is_sold=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=3650)
                )
                session.add(nl)
            else:
                existing_city.price_usd = city_price
                existing_city.price_uzs = c_uzs
                existing_city.category = "uzbek_cities"
                existing_city.seller_id = director_id
                existing_city.is_sold = False

        # 2c. Seed Director's Reserved Names (NOT FOR SALE, Gift Only)
        DIRECTOR_RESERVED_NAMES = [
            "sherzodbek",
            "kamolov",
            "abdulazizbek",
            "habibahon",
            "sohibahon",
            "shodmonoy",
            "abdullohbek"
        ]
        for res_name in DIRECTOR_RESERVED_NAMES:
            chk = await session.execute(select(UsernameListing).where(func.lower(UsernameListing.username) == res_name.lower()))
            existing_res = chk.scalars().first()
            if not existing_res:
                nl = UsernameListing(
                    username=res_name,
                    seller_id=director_id,
                    category="reserved",
                    price_usd=0,
                    price_uzs=0.0,
                    current_price_coins=0,
                    buyout_price_coins=0,
                    is_sold=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=3650)
                )
                session.add(nl)
            else:
                existing_res.category = "reserved"
                existing_res.price_usd = 0
                existing_res.price_uzs = 0.0
                existing_res.seller_id = director_id

        # 2d. Seed Exclusive Numeric Usernames ($1,000 – $3,000)
        # Numbers 1 to 10 can ONLY be obtained via Marketplace, registration with numbers is forbidden
        NUMERIC_USERNAMES_SALE = [
            ("1", 1000),
            ("2", 1000),
            ("3", 1200),
            ("4", 1400),
            ("5", 1500),
            ("6", 1800),
            ("7", 2000),
            ("8", 2200),
            ("9", 2500),
            ("10", 3000),
        ]
        for num_un, num_price in NUMERIC_USERNAMES_SALE:
            chk = await session.execute(select(UsernameListing).where(func.lower(UsernameListing.username) == num_un.lower()))
            existing_num = chk.scalars().first()
            n_uzs = float(num_price * 13000)
            if not existing_num:
                nl = UsernameListing(
                    username=num_un,
                    seller_id=director_id,
                    category="numeric_rare",
                    price_usd=num_price,
                    price_uzs=n_uzs,
                    current_price_coins=num_price * 10,
                    buyout_price_coins=num_price * 10,
                    is_sold=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=3650)
                )
                session.add(nl)
            else:
                existing_num.price_usd = num_price
                existing_num.price_uzs = n_uzs
                existing_num.category = "numeric_rare"
                existing_num.seller_id = director_id
                existing_num.is_sold = False

        # 3. Seed Uzbek male & female names ($500+)
        combined_raw = NAMES_RAW + "," + FEMALE_NAMES_RAW
        raw_list = [clean_name(n) for n in combined_raw.split(",") if clean_name(n)]
        seen = set()
        names = []
        for n in raw_list:
            if n and n not in seen:
                seen.add(n)
                names.append(n)

        for name in names:
            if name in DIRECTOR_RESERVED_NAMES:
                continue
            chk = await session.execute(select(UsernameListing).where(UsernameListing.username == name))
            listing = chk.scalars().first()
            price_usd = 1000 if name in TOP_SHORT_NAMES else (750 if len(name) <= 4 else 500)
            price_uzs = float(price_usd * 12800)
            buyout_coins = int(price_usd * 10)

            if not listing:
                nl = UsernameListing(
                    username=name,
                    seller_id=director_id,
                    category="uzbek_names",
                    price_usd=price_usd,
                    price_uzs=price_uzs,
                    current_price_coins=500,
                    buyout_price_coins=buyout_coins,
                    is_sold=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=3650)
                )
                session.add(nl)
            else:
                listing.price_usd = max(listing.price_usd or 500, price_usd)
                listing.price_uzs = max(listing.price_uzs or 6500000.0, price_uzs)
                listing.category = "uzbek_names"
                listing.seller_id = director_id

        await session.commit()
        print(f"[Database] Verified {len(names)} Uzbek name marketplace listings (from $500) and Founder reserves.")

        # 4. Completely purge any demo posts and demo reels from Admin / Director account
        from app.models.entities import Post, Reel, PostComment, PostLike, ReelComment, ReelLike, SavedItem
        from sqlalchemy import delete

        try:
            # Purge demo posts
            demo_posts_res = await session.execute(
                select(Post.id).where(
                    (Post.caption.like("%Xush kelibsiz Venstogram%")) |
                    (Post.caption.like("%Samarqand Registon%")) |
                    (Post.location.like("%Samarqand%"))
                )
            )
            demo_post_ids = demo_posts_res.scalars().all()
            if demo_post_ids:
                await session.execute(delete(PostComment).where(PostComment.post_id.in_(demo_post_ids)))
                await session.execute(delete(PostLike).where(PostLike.post_id.in_(demo_post_ids)))
                await session.execute(delete(SavedItem).where(SavedItem.item_type == "post", SavedItem.item_id.in_(demo_post_ids)))
                await session.execute(delete(Post).where(Post.id.in_(demo_post_ids)))
                print(f"[Database] Cleaned up {len(demo_post_ids)} demo posts.")

            # Purge demo reels
            demo_reels_res = await session.execute(
                select(Reel.id).where(
                    (Reel.caption.like("%Toshkent shahar manzaralari%")) |
                    (Reel.caption.like("%Tog'lar va go'zal tabiat%")) |
                    (Reel.video_url.like("%commondatastorage%"))
                )
            )
            demo_reel_ids = demo_reels_res.scalars().all()
            if demo_reel_ids:
                await session.execute(delete(ReelComment).where(ReelComment.reel_id.in_(demo_reel_ids)))
                await session.execute(delete(ReelLike).where(ReelLike.reel_id.in_(demo_reel_ids)))
                await session.execute(delete(SavedItem).where(SavedItem.item_type == "reel", SavedItem.item_id.in_(demo_reel_ids)))
                await session.execute(delete(Reel).where(Reel.id.in_(demo_reel_ids)))
                print(f"[Database] Cleaned up {len(demo_reel_ids)} demo reels.")

            await session.commit()
        except Exception as purge_err:
            print(f"[Database Cleanup Warning] {purge_err}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(init_models())
    asyncio.run(seed_demo_data())
