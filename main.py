import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Import the FastAPI app directly from backend.main
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
