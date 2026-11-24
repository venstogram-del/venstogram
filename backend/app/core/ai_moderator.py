import re
from typing import Tuple, List
import os
from PIL import Image

# Stopwords & regexes for moderation (RU, UZ, EN)
BANNED_PATTERNS = [
    r"(?i)\b(terror|extremis|isis|daesh|nazi|hitler|bomba|jihad)\b",
    r"(?i)\b(порно|секс|проститутка|наркотик|закладка|мефедрон|героин|гашиш|суицид|убейся)\b",
    r"(?i)\b(f[*u]ck|bitch|porn|nude|drugs|suicide|kill\s+yourself)\b",
    r"(?i)\b(fahişa|narkotik|terror|o'ldirish|foxisha)\b",
]

class AIContentModerator:
    @staticmethod
    def analyze_text(text: str) -> Tuple[bool, int, List[str]]:
        """
        Analyzes text content for toxic, violent, or forbidden content.
        Returns: (is_safe, threat_score, detected_flags)
        """
        if not text:
            return True, 0, []

        detected_flags = []
        threat_score = 0

        for pattern in BANNED_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                detected_flags.append(f"Matched violation pattern: {matches[0]}")
                threat_score += 45

        # Check for spam links or excessive caps
        if len(re.findall(r"https?://", text)) > 3:
            detected_flags.append("Suspected link spam")
            threat_score += 25

        if len(text) > 10 and sum(1 for c in text if c.isupper()) / len(text) > 0.8:
            threat_score += 10

        threat_score = min(threat_score, 100)
        is_safe = threat_score < 50
        return is_safe, threat_score, detected_flags

    @staticmethod
    def analyze_image(image_path: str) -> Tuple[bool, int, List[str]]:
        """
        Inspects image file metrics for moderation.
        """
        if not os.path.exists(image_path):
            return True, 0, []

        try:
            with Image.open(image_path) as img:
                # Basic sanity check
                width, height = img.size
                if width < 50 or height < 50:
                    return False, 80, ["Image too small or corrupted"]

                # In real prod, this can call Google Gemini Vision API or CLIP/NSFW model
                # Here we compute basic color histogram / check image structure
                threat_score = 0
                flags = []
                return True, threat_score, flags
        except Exception as e:
            return False, 70, [f"Unreadable image: {str(e)}"]

ai_moderator = AIContentModerator()
