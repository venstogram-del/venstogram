import os
import sys
import subprocess
import uvicorn
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

load_dotenv()

def build_frontend_bundle():
    """Builds the frontend bundle if node is available."""
    try:
        build_script = os.path.join(os.path.dirname(__file__), "build_frontend.js")
        if os.path.exists(build_script):
            subprocess.run(["node", build_script], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("[Venstogram] Frontend bundle verified & compiled successfully.")
    except Exception as e:
        print(f"[Venstogram] Bundle check note: {e}")

def print_banner():
    webapp_url = os.getenv("WEBAPP_URL", "http://localhost:8000/app")
    print(f"""
========================================================================
   🚀 VENSTOGRAM PLATFORM (Telegram Bot & Mini App Ecosystem)
========================================================================
   • Bot Username:   @{os.getenv("BOT_USERNAME", "venstogrambot")}
   • Mini App URL:   {webapp_url}
   • API Docs:       http://localhost:8000/docs
   • WebSocket Live: ws://localhost:8000/ws/live
   • Architecture:   FastAPI + WebSockets + Aiogram 3 + React TMA
========================================================================
    """)

if __name__ == "__main__":
    build_frontend_bundle()
    print_banner()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False, app_dir=backend_dir)
