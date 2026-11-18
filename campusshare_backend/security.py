"""
CampusShare Security Utilities Module
Comprehensive defenses against:
1. Cross-Site Scripting (XSS) in text fields and user inputs
2. Malicious URI schemes (javascript:, vbscript:, data:text/html)
3. NoSQL / MongoDB Operator Injection (rejecting non-scalar queries)
4. Numeric overflow / NaN / Infinity exploits
"""

import re
import html
import math
from typing import Any, List, Optional
from urllib.parse import urlparse

# Strict regex for matching dangerous script/HTML patterns
TAG_RE = re.compile(r'<[^>]*?>')
DANGEROUS_PROTOCOLS_RE = re.compile(r'^\s*(javascript|vbscript|data\s*:\s*text/html|file)\s*:', re.IGNORECASE)
SAFE_IMAGE_DATA_RE = re.compile(r'^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$', re.IGNORECASE)

def sanitize_text(value: Any, max_length: int = 2000, escape_html: bool = True) -> str:
    """
    Sanitizes string inputs to protect against Stored XSS and null byte injection.
    - Ensures input is a string (prevents NoSQL dictionary injection)
    - Strips null bytes (\x00)
    - Strips dangerous HTML/script tags
    - Optionally escapes HTML entities
    - Enforces maximum character length
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        # Force convert scalars, reject dicts/lists to prevent NoSQL operator injection
        if isinstance(value, (dict, list)):
            return ""
        value = str(value)

    # Strip null bytes
    cleaned = value.replace("\x00", "").strip()

    # Strip HTML tags
    cleaned = TAG_RE.sub("", cleaned)

    if escape_html:
        cleaned = html.escape(cleaned, quote=True)

    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    return cleaned

def is_safe_url(url: Any) -> bool:
    """
    Validates that a URL uses safe protocols (http, https, or safe data:image).
    Rejects javascript:, vbscript:, data:text/html, etc.
    """
    if not url or not isinstance(url, str):
        return False

    url = url.strip()

    # Reject dangerous protocols immediately
    if DANGEROUS_PROTOCOLS_RE.match(url):
        return False

    # Check for safe image data URI
    if url.startswith("data:"):
        return bool(SAFE_IMAGE_DATA_RE.match(url))

    # Validate standard HTTP / HTTPS schemes
    try:
        parsed = urlparse(url)
        return parsed.scheme.lower() in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False

def sanitize_url(url: Any, default: str = "") -> str:
    """
    Returns sanitized URL if safe, otherwise returns default fallback URL.
    """
    if is_safe_url(url):
        return str(url).strip()
    return default

def sanitize_image_list(images: Any, max_count: int = 10, default_fallback: Optional[str] = None) -> List[str]:
    """
    Sanitizes a list of image URLs.
    Filters out any non-safe or malicious URLs.
    Enforces maximum count limit.
    """
    if not isinstance(images, list):
        if isinstance(images, str) and images.strip():
            images = [images.strip()]
        else:
            images = []

    safe_list = []
    for img in images:
        if is_safe_url(img):
            safe_list.append(str(img).strip())
        if len(safe_list) >= max_count:
            break

    if not safe_list and default_fallback:
        safe_list.append(default_fallback)

    return safe_list

def safe_float(val: Any, default: float = 0.0, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    """
    Safely parses a float and checks for NaN / Infinity exploits.
    Optionally clamps between min_val and max_val.
    """
    try:
        if isinstance(val, (dict, list)):
            return default
        num = float(val)
        if not math.isfinite(num):
            return default
        if min_val is not None and num < min_val:
            num = min_val
        if max_val is not None and num > max_val:
            num = max_val
        return num
    except (ValueError, TypeError):
        return default

def safe_str(val: Any, max_length: int = 255) -> str:
    """
    Strictly casts to string, rejecting dict/list (NoSQL injection prevention)
    and sanitizes HTML.
    """
    if isinstance(val, (dict, list)):
        return ""
    return sanitize_text(val, max_length=max_length, escape_html=True)
