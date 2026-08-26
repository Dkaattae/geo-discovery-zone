"""TEMPORARY — T-005 criteria 7/8.

Proves the CI guard actually blocks (and, without it, allows) a real
outbound request. Removed before this branch ships; see the brief's
Handoff and Notes for the recorded run URLs.
"""

from __future__ import annotations

import httpx


def test_reaches_a_public_host_over_https() -> None:
    response = httpx.get("https://example.com/", timeout=5)
    assert response.status_code == 200
