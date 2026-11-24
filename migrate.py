import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "venstogram.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def try_exec(sql):
    try:
        cursor.execute(sql)
        print("Executed:", sql.strip().split("\n")[0])
    except Exception as e:
        print("Note:", e)

try_exec("ALTER TABLE users ADD COLUMN telegram_channel VARCHAR(256) DEFAULT '';")
try_exec("ALTER TABLE username_listings ADD COLUMN price_usd INTEGER DEFAULT 500;")
try_exec("ALTER TABLE username_listings ADD COLUMN price_uzs FLOAT DEFAULT 6500000.0;")
try_exec("""
CREATE TABLE IF NOT EXISTS username_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    username VARCHAR(64) NOT NULL,
    buyer_id INTEGER NOT NULL,
    price_usd INTEGER DEFAULT 500,
    price_uzs FLOAT DEFAULT 6500000.0,
    screenshot_url VARCHAR(512) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    admin_notes VARCHAR(256),
    created_at DATETIME,
    reviewed_at DATETIME,
    FOREIGN KEY(listing_id) REFERENCES username_listings(id) ON DELETE CASCADE,
    FOREIGN KEY(buyer_id) REFERENCES users(id) ON DELETE CASCADE
);
""")

conn.commit()
conn.close()
print("Migration completed successfully!")
