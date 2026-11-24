import os
import sys
import asyncio
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path so 'app.*' imports work regardless of runner
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.init_db import init_models, seed_demo_data
from app.api import (
    auth, feed, stories, reels, battles,
    chat, wallet, marketplace, admin, upload, users
)
from app.websocket import endpoints as ws_endpoints
from app.bot.bot import bot, dp

bot_polling_task: asyncio.Task = None
keepalive_task: asyncio.Task = None

async def anti_sleep_keepalive():
    """
    Continuous background self-ping loop that keeps Render awake 24/7.
    Sends external HTTPS requests to https://venstogram.onrender.com every 4 minutes.
    """
    import urllib.request
    
    # Initial wait after container starts
    await asyncio.sleep(25)
    
    urls_to_ping = [
        "https://venstogram.onrender.com/health",
        "https://venstogram.onrender.com/api/ping"
    ]
    
    while True:
        try:
            loop = asyncio.get_running_loop()
            for url in urls_to_ping:
                try:
                    def _do_ping(u):
                        req = urllib.request.Request(
                            u,
                            headers={"User-Agent": "Venstogram-AntiSleep-KeepAlive/1.0"}
                        )
                        with urllib.request.urlopen(req, timeout=12) as resp:
                            return resp.status
                    status = await loop.run_in_executor(None, _do_ping, url)
                    if settings.DEBUG:
                        print(f"[Anti-Sleep] KeepAlive ping to {url} -> {status}")
                except Exception:
                    pass
        except Exception as err:
            if settings.DEBUG:
                print(f"[Anti-Sleep Error] {err}")
        
        # Ping every 240 seconds (4 minutes). Render's sleep timeout is 15 minutes.
        await asyncio.sleep(240)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global bot_polling_task, keepalive_task
    print("[Venstogram] Starting up backend service...")
    
    # 1. Initialize DB and seed demo content
    await init_models()
    await seed_demo_data()

    # 2. Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 3. Launch Anti-Sleep Daemon
    keepalive_task = asyncio.create_task(anti_sleep_keepalive())
    print("[Venstogram] Anti-Sleep 24/7 Daemon activated.")

    # 4. Start Aiogram Bot Polling in background
    if bot and dp:
        try:
            print("[Venstogram] Clearing webhook and launching Telegram Bot polling...")
            await bot.delete_webhook(drop_pending_updates=True)
            try:
                from aiogram.types import MenuButtonWebApp, WebAppInfo
                base_url = settings.WEBAPP_URL.rstrip('/') + '/'
                await bot.set_chat_menu_button(
                    menu_button=MenuButtonWebApp(
                        text="Venstogram 🚀",
                        web_app=WebAppInfo(url=base_url)
                    )
                )
                print(f"[Venstogram Bot] Menu button configured with {base_url}")
            except Exception as mb_err:
                print(f"[Venstogram Bot] Menu button note: {mb_err}")

            bot_polling_task = asyncio.create_task(dp.start_polling(bot, drop_pending_updates=True))
        except Exception as e:
            print(f"[Venstogram Bot] Error starting polling: {e}")

    yield

    # Shutdown
    print("[Venstogram] Shutting down backend service...")
    if keepalive_task:
        keepalive_task.cancel()
    if bot_polling_task:
        bot_polling_task.cancel()
    if bot:
        await bot.session.close()

app = FastAPI(
    title="Venstogram API & Telegram Mini App Engine",
    description="Backend API, WebSockets, and Aiogram 3 Bot for Venstogram Social & Streaming Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Telegram WebApp and development environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Frontend Mini App static mount
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend"))
os.makedirs(frontend_dir, exist_ok=True)
app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(stories.router, prefix="/api")
app.include_router(reels.router, prefix="/api")
app.include_router(battles.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(wallet.router, prefix="/api")
app.include_router(marketplace.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(ws_endpoints.router)

from fastapi.responses import RedirectResponse, JSONResponse
from datetime import datetime, timezone

@app.get("/health")
@app.get("/api/health")
@app.get("/api/ping")
async def health_check():
    return JSONResponse(content={
        "status": "healthy",
        "service": "Venstogram Core API",
        "keep_alive": True,
        "server_time": datetime.now(timezone.utc).isoformat(),
        "platform": "Venstogram Engine 24/7"
    })

@app.get("/")
async def root():
    return RedirectResponse(url="/app/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
