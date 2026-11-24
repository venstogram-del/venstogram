import sqlite3
import unicodedata
import re

raw_names = """
Aziza, Oysha, Aqida, Aliya, Amina, Amira, Anbar, Anor, Anora, Asal, Asaloy, Asila, Asma, Atirgul, Afifa,
Barno, Barchin, Barchinoy, Bahor, Bahora, Begoyim, Bibigul, Bibisora, Bibixadicha, Bonu, Bo‘ston, Vazira,
Vasila, Visola, Gavhar, Gavharoy, Gulbahor, Gulbadan, Guljamol, Guljahon, Gulzira, Gulzoda, Guli,
Gulira’no, Gulnoz, Gulnoza, Gulnora, Gulruh, Gulruhsor, Gulsanam, Gulsara, Gulchehra, Gulshan, Gulshoda,
Go‘zal, Go‘zaloy, Damira, Dilafruz, Dilbar, Dildora, Dilnoz, Dilnoza, Dilnura, Dilorom, Dilrabo, Dilruh,
Dilsora, Dilfuza, Dilya, Dinara, Diyora, Durdona, Jamila, Jasmina, Jonsuluv, Zamira, Zarina, Zarifa,
Zahro, Zebiniso, Zebo, Ziyoda, Zilola, Zinnat, Zoira, Zokira, Zulayho, Zulfiya, Zulxumor, Zumrad, Zuhra,
Ibodat, Iroda, Ifora, Iqboloy, Imona, Kamila, Kamola, Karima, Kibriyo, Komila, Kumush, Kumushoy,
Qurbonoy, Laziza, Laylo, Latifa, Latofat, Leysan, Lola, Lolaxon, Lutfiya, Mavjuda, Mavluda, Madina,
Maysara, Malika, Mamlakat, Manzura, Marvarid, Marg‘uba, Marjona, Marhabo, Maryam, Mastura, Matluba,
Maftuna, Mahbuba, Mahliyo, Mahmuda, Mahfuza, Mehribon, Mehriniso, Mehrinoz, Mohigul, Mohidil, Mohinur,
Mohira, Mohichehra, Muazzam, Muattar, Mubina, Muzayyana, Muqaddas, Mukarram, Munavvar, Munira, Munis,
Munisa, Muslima, Muhayyo, Muxlisa, Mushtariy, Navbahor, Navro‘za, Nadira, Najiba, Nazira, Nazokat,
Nazmina, Naima, Nargiza, Nasiba, Nafisa, Ne’matxon, Nigina, Nigora, Nilufar, Niso, Nodira, Nozima,
Nozli, Noila, Nurxon, Nuriya, Obida, Odina, Odinaxon, Ozoda, Oygul, Oydin, Oyjamol, Oyniso, Oysara,
Oyshaxon, Oliya, Olmaxon, Omina, Orasta, Orzigul, Orifa, Osiyo, Ominaxon, Parizod, Parizoda, Parvina,
Pokiza, Rabia, Ravshanoy, Ra’no, Rahima, Raxshona, Rayhon, Rayhona, Regina, Risolat, Robiya, Roziya,
Ruxsora, Ruxshona, Ruqiya, Sabina, Sabohat, Sabrina, Sadoqat, Saida, Sayyora, Salima, Salomat, Samira,
Sanam, Saodat, Sara, Sarvinoz, Sevara, Sevinch, Sitora, Sobira, Sojida, Soliha, Sora, Sug‘diyona,
Surayyo, Tabassum, Tanzila, Tojiniso, To‘maris, Tursunoy, To‘tixon, O‘g‘iloy, O‘lmasxon, Umida, Usmona,
Fazilat, Farida, Farishta, Farzona, Farog‘at, Fotima, Feruza, Firuza, Fozila, Habiba, Xadicha, Xayriniso,
Halima, Hamida, Hanifa, Xosiyat, Hilola, Hojar, Xolida, Hulkar, Xumor, Xumora, Hurriyat, Xurshida,
Husnida, Husnora, Charos, Chinor, Cho‘lponoy, Shabnam, Shahlo, Shahnoza, Shahrizoda, Shahriniso,
Shahsanam, Shirin, Shirinoy, Shodiyona, Shoira, Shohida, Shohista, Shohsanam, Shukrona, Shukufa,
E’zoza, Elnora, Yulduz, Yulduzoy, Yasmina
"""

def clean_username(name: str) -> str:
    # Normalize unicode apostrophes (e.g. Bo‘ston -> boston, Ra’no -> rano)
    n = name.strip()
    n = n.replace("‘", "").replace("’", "").replace("'", "").replace("`", "").replace("ʻ", "")
    n = n.lower()
    # Remove any character not a-z, 0-9, or _
    n = re.sub(r'[^a-z0-9_]', '', n)
    return n

# Parse names
names_list = [n.strip() for n in raw_names.replace('\n', ' ').split(',') if n.strip()]

conn = sqlite3.connect('venstogram.db')
c = conn.cursor()

# Find director user ID
c.execute("SELECT id FROM users WHERE role='director' OR telegram_id=1477103854 LIMIT 1")
res = c.fetchone()
director_id = res[0] if res else 1
print(f"Assigning seller_id={director_id} (Venstogram Official / Director)")

inserted_count = 0
updated_count = 0

for original_name in names_list:
    uname = clean_username(original_name)
    if not uname:
        continue
    
    price_usd = 500
    price_uzs = 6500000.0
    category = "uzbek_names"
    coins = 500
    buyout_coins = 2000
    
    # Check if already exists in username_listings
    c.execute("SELECT id, is_sold FROM username_listings WHERE username = ?", (uname,))
    row = c.fetchone()
    
    if row:
        # Update existing to $500 and category uzbek_names
        listing_id, is_sold = row
        c.execute("""
            UPDATE username_listings
            SET price_usd = ?, price_uzs = ?, category = ?, seller_id = ?, buyout_price_coins = ?
            WHERE id = ?
        """, (price_usd, price_uzs, category, director_id, buyout_coins, listing_id))
        updated_count += 1
    else:
        # Insert new listing
        c.execute("""
            INSERT INTO username_listings (
                username, seller_id, current_price_coins, buyout_price_coins,
                price_usd, price_uzs, is_sold, category, created_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+365 days'))
        """, (uname, director_id, coins, buyout_coins, price_usd, price_uzs, False, category))
        inserted_count += 1

conn.commit()

c.execute("SELECT count(*) FROM username_listings WHERE category='uzbek_names'")
total_uzbek_names = c.fetchone()[0]

c.execute("SELECT count(*) FROM username_listings")
total_listings = c.fetchone()[0]

print(f"Done! Inserted: {inserted_count}, Updated: {updated_count}")
print(f"Total Uzbek names in marketplace: {total_uzbek_names}")
print(f"Total listings across all categories: {total_listings}")

# Sample check
c.execute("SELECT username, price_usd, price_uzs, category FROM username_listings WHERE category='uzbek_names' ORDER BY id DESC LIMIT 10")
print("\nSample inserted names:")
for r in c.fetchall():
    print(f" - @{r[0]}: ${r[1]} ({r[2]:,.0f} UZS) [{r[3]}]")

conn.close()
