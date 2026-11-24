import asyncio
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
        # Auto-migrate newly added columns for users table
        for col_sql in [
            "ALTER TABLE users ADD COLUMN is_registered BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN birth_year INTEGER",
            "ALTER TABLE users ADD COLUMN birth_date VARCHAR(32)",
            "ALTER TABLE users ADD COLUMN badge_type VARCHAR(32) DEFAULT 'blue'"
        ]:
            try:
                await conn.execute(text(col_sql))
            except Exception:
                pass
    print("[Database] All tables and columns successfully verified.")

async def seed_demo_data():
    """Seeds Founder Director account and marketplace official listings."""
    async with AsyncSessionLocal() as session:
        # 1. Ensure Founder Director exists
        res = await session.execute(select(User).where((User.telegram_id == 1477103854) | (User.role == "director")))
        director = res.scalars().first()
        if not director:
            director = User(
                telegram_id=1477103854,
                username="oqyolai",
                first_name="Abdulazizbek",
                last_name="Director",
                role="director",
                is_verified=True,
                wallet_coins=100000,
                language_code="ru"
            )
            session.add(director)
            await session.flush()

        director_id = director.id

        # 2. Ensure @uzbekiston, @uzbekistan and 2-letter ultra-rare @ou ($30,000) are listed
        for un, cat, pr_usd in [
            ("ou", "ultra_rare", 30000),
            ("uzbekiston", "exclusive", 999999),
            ("uzbekistan", "exclusive", 999999)
        ]:
            chk = await session.execute(select(UsernameListing).where(UsernameListing.username == un))
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

if __name__ == "__main__":
    asyncio.run(init_models())
    asyncio.run(seed_demo_data())
