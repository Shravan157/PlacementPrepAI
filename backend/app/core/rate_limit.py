"""
core/rate_limit.py — slowapi rate-limiter configuration.

The Limiter instance is created here and imported by:
  - app/main.py  (attaches the error handler)
  - app/auth/router.py  (applies @limiter.limit to /auth/login)

To adjust the per-endpoint limit, change LOGIN_RATE_LIMIT below.
That is the single place to update — do not scatter magic strings across routers.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# ── Tunable constants ──────────────────────────────────────────────────────────
# Applied specifically to POST /auth/login to prevent brute-force attacks.
# Format: "<count>/<period>" — e.g. "5/minute", "20/hour".
LOGIN_RATE_LIMIT: str = "5/minute"

# ── Limiter instance ──────────────────────────────────────────────────────────
# key_func=get_remote_address keys by client IP.
# The instance is registered on the FastAPI app in main.py via:
#   app.state.limiter = limiter
limiter = Limiter(key_func=get_remote_address)
