import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    BOT_USERNAME: str = os.getenv("BOT_USERNAME", "venstogrambot")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./venstogram.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "venstogram_secret_key_default_change_in_prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://marijuana-hawk-breakdown-characterized.trycloudflare.com/app")
    
    STREAMER_SPLIT_PERCENT: int = int(os.getenv("STREAMER_SPLIT_PERCENT", "40"))
    PLATFORM_SPLIT_PERCENT: int = int(os.getenv("PLATFORM_SPLIT_PERCENT", "60"))
    COIN_PRICE_UZS: int = int(os.getenv("COIN_PRICE_UZS", "100"))
    ADMIN_TELEGRAM_IDS: list = [1477103854, 8787674425]
    OFFICIAL_EMAIL: str = "venstogram@gmail.com"
    
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads"))

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
