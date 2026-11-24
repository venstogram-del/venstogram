import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from PIL import Image
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.entities import User

router = APIRouter(prefix="/upload", tags=["Media Upload & Compression"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"}

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    data_saver: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads photo/video with optional Data Saver compression.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    async with aiofiles.open(file_path, "wb") as out_file:
        while content := await file.read(1024 * 1024):
            await out_file.write(content)

    # Client / Backend Data Saver mode: compress image if needed
    if ext in {".jpg", ".jpeg", ".png"} and (data_saver or os.path.getsize(file_path) > 2 * 1024 * 1024):
        try:
            with Image.open(file_path) as img:
                img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                compressed_name = f"opt_{unique_name}.webp"
                compressed_path = os.path.join(settings.UPLOAD_DIR, compressed_name)
                img.save(compressed_path, "WEBP", quality=75 if data_saver else 85)
                unique_name = compressed_name
        except Exception as e:
            print(f"[Upload] Compression note: {e}")

    file_url = f"/uploads/{unique_name}"
    return {
        "url": file_url,
        "filename": unique_name,
        "is_compressed": data_saver
    }
