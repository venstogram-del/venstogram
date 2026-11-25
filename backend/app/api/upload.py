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

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
ALLOWED_AUDIO_EXTENSIONS = {".webm", ".weba", ".ogg", ".opus", ".mp3", ".m4a", ".wav", ".aac"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS

MAX_VIDEO_SIZE = 100 * 1024 * 1024 # 100 MB max for high load stability
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50 MB max
MAX_IMAGE_SIZE = 25 * 1024 * 1024  # 25 MB max

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    data_saver: bool = Query(False),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    High-throughput streaming upload for photos, videos, and voice messages with low RAM usage.
    """
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if not ext:
        ext = ".webm"

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат файла ({ext}). Допустимы фото (JPG, PNG, WEBP), видео (MP4, MOV, WEBM) и аудио (WEBM, M4A, OGG, WAV, MP3, AAC)."
        )

    if ext in ALLOWED_VIDEO_EXTENSIONS:
        max_size = MAX_VIDEO_SIZE
    elif ext in ALLOWED_AUDIO_EXTENSIONS:
        max_size = MAX_AUDIO_SIZE
    else:
        max_size = MAX_IMAGE_SIZE

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

    # Preserve original high quality and fidelity without altering or degrading user media
    file_url = f"/uploads/{unique_name}"
    return {
        "url": file_url,
        "filename": unique_name,
        "is_compressed": False
    }
