import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from PIL import Image
from app.core.config import settings
from app.api.deps import get_current_user_optional
from app.models.entities import User
from typing import Optional

router = APIRouter(prefix="/upload", tags=["Media Upload & Compression"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"}
MAX_VIDEO_SIZE = 100 * 1024 * 1024 # 100 MB max for high load stability
MAX_IMAGE_SIZE = 25 * 1024 * 1024  # 25 MB max

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    data_saver: bool = Query(False),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    High-throughput streaming upload for photos and videos with low RAM usage.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла. Допустимы: JPG, PNG, WEBP, MP4, MOV, WEBM.")

    is_video = ext in {".mp4", ".mov", ".webm"}
    max_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    total_bytes = 0
    async with aiofiles.open(file_path, "wb") as out_file:
        while chunk := await file.read(1024 * 512): # 512KB streaming chunks
            total_bytes += len(chunk)
            if total_bytes > max_size:
                # Remove partially uploaded file
                try:
                    os.remove(file_path)
                except Exception:
                    pass
                raise HTTPException(status_code=400, detail=f"Размер файла превышает лимит ({max_size // (1024*1024)} MB).")
            await out_file.write(chunk)

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
