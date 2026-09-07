"""
In-memory sliding-window rate limiter for JudgeAI Auth Service (Port 8004).
Tracks request timestamps per action/key to prevent brute-force attacks.
"""

import time
import threading
from typing import Dict, List, Tuple
from fastapi import HTTPException, status, Request


class SlidingWindowRateLimiter:
    def __init__(self, cleanup_interval_seconds: int = 300):
        self._lock = threading.Lock()
        self._history: Dict[str, List[float]] = {}
        self._cleanup_interval = cleanup_interval_seconds
        self._last_cleanup = time.time()

    def _cleanup(self, now: float, window_seconds: int):
        if now - self._last_cleanup > self._cleanup_interval:
            expired_keys = []
            for key, timestamps in self._history.items():
                valid = [ts for ts in timestamps if now - ts < window_seconds]
                if not valid:
                    expired_keys.append(key)
                else:
                    self._history[key] = valid
            for k in expired_keys:
                del self._history[k]
            self._last_cleanup = now

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Checks if the request under `key` is allowed within `window_seconds`.
        Returns (allowed: bool, retry_after_seconds: int).
        """
        now = time.time()
        with self._lock:
            self._cleanup(now, window_seconds)
            timestamps = self._history.get(key, [])
            valid_timestamps = [ts for ts in timestamps if now - ts < window_seconds]

            if len(valid_timestamps) >= max_requests:
                earliest = valid_timestamps[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                self._history[key] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._history[key] = valid_timestamps
            return True, 0

    def reset(self, key: str):
        """Resets the recorded timestamps for a specific key (useful for tests)."""
        with self._lock:
            if key in self._history:
                del self._history[key]


sliding_window_rate_limiter = SlidingWindowRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extracts client IP address safely from forwarded headers or direct connection."""
    if not request:
        return "127.0.0.1"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def enforce_rate_limit(
    action: str,
    ip: str,
    max_requests: int,
    window_seconds: int,
    secondary_key: str = ""
):
    """
    Enforces a rate limit for a given action and IP/secondary identifier.
    Raises HTTP 429 Too Many Requests if rate limit is exceeded.
    """
    rate_key = f"{action}:{ip}"
    if secondary_key:
        rate_key = f"{rate_key}:{secondary_key.lower().strip()}"

    allowed, retry_after = sliding_window_rate_limiter.is_allowed(
        key=rate_key,
        max_requests=max_requests,
        window_seconds=window_seconds
    )

    if not allowed:
        print(f"Rate limit exceeded for key '{rate_key}'. Retry after {retry_after}s.")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests for {action}. Please try again after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )
