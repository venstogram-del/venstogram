import os
import sys
import importlib.util
from dotenv import load_dotenv

load_dotenv()

# Add backend directory to sys.path so that 'app.core.config' and other submodules resolve
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load the FastAPI app from backend/main.py
backend_main_path = os.path.join(backend_dir, "main.py")
spec = importlib.util.spec_from_file_location("backend_main_mod", backend_main_path)
backend_main_mod = importlib.util.module_from_spec(spec)
sys.modules["backend_main_mod"] = backend_main_mod
spec.loader.exec_module(backend_main_mod)

app = backend_main_mod.app

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
