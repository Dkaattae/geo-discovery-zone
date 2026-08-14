"""Accounts, password hashing and bearer tokens.

The contract's Profiles and Sessions groups hold children's data, so they sit
behind an account belonging to a grown-up. Content stays public — it is
build-time generated and carries no user data.

Everything here is standard library on purpose: PBKDF2-HMAC-SHA256 for
passwords (the hash format records its own parameters, so the cost can be
raised later without invalidating stored hashes) and opaque random bearer
tokens. No JWT, because nothing here needs a token a third party can verify
offline, and an opaque token can be revoked.

Accounts and tokens live in the database with everything else, so a restart no
longer signs everybody out.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.orm import Account, TokenRecord
from app.problems import problem_exception

PBKDF2_ITERATIONS = 210_000
TOKEN_TTL = timedelta(hours=12)

DEMO_ACCOUNT_ID = "acct-demo"
DEMO_USERNAME = "grownup@example.com"
DEMO_PASSWORD = "atlas-demo-password"  # noqa: S105 — seed credential, documented in the README.


def hash_password(password: str) -> str:
    """`pbkdf2_sha256$<iterations>$<salt-hex>$<hash-hex>`."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str | None) -> bool:
    """Constant-time check of `password` against an encoded hash."""
    if not encoded:
        return False
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate.hex(), digest_hex)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# -- accounts ---------------------------------------------------------------


def create_account(
    db: Session, username: str, password: str, account_id: str | None = None
) -> Account:
    account = Account(
        id=account_id or f"acct-{secrets.token_hex(8)}",
        # Stored folded, so "Maya@Example.com" and "maya@example.com" are one
        # account rather than two that cannot both sign in.
        username=username.strip().lower(),
        password_hash=hash_password(password),
        created_at=datetime.now(UTC),
    )
    db.add(account)
    db.flush()
    return account


def find_by_username(db: Session, username: str) -> Account | None:
    return db.scalar(select(Account).where(Account.username == username.strip().lower()))


def authenticate(db: Session, username: str, password: str) -> Account | None:
    account = find_by_username(db, username)
    if account is None:
        # Hash anyway so a missing username and a wrong password cost the same.
        verify_password(password, hash_password("timing-equaliser"))
        return None
    return account if verify_password(password, account.password_hash) else None


# -- tokens -----------------------------------------------------------------


def issue_token(db: Session, account_id: str, now: datetime | None = None) -> tuple[str, int]:
    """Returns `(token, expires_in_seconds)`. Only the digest is stored."""
    now = now or datetime.now(UTC)
    token = secrets.token_urlsafe(32)
    db.add(
        TokenRecord(digest=token_digest(token), account_id=account_id, expires_at=now + TOKEN_TTL)
    )
    db.flush()
    return token, int(TOKEN_TTL.total_seconds())


def resolve_token(db: Session, token: str, now: datetime | None = None) -> Account | None:
    now = now or datetime.now(UTC)
    record = db.get(TokenRecord, token_digest(token))
    if record is None:
        return None
    if record.expires_at <= now:
        db.delete(record)
        db.flush()
        return None
    return db.get(Account, record.account_id)


def revoke_token(db: Session, token: str) -> None:
    db.execute(delete(TokenRecord).where(TokenRecord.digest == token_digest(token)))


def purge_expired_tokens(db: Session, now: datetime | None = None) -> int:
    """Housekeeping: expired rows resolve to nobody, but they still accumulate."""
    result = db.execute(
        delete(TokenRecord).where(TokenRecord.expires_at <= (now or datetime.now(UTC)))
    )
    return result.rowcount or 0


def ensure_demo_account(db: Session) -> Account:
    """A demo grown-up account so the frontend has something to sign in as."""
    existing = db.get(Account, DEMO_ACCOUNT_ID)
    if existing is not None:
        return existing
    return create_account(db, DEMO_USERNAME, DEMO_PASSWORD, account_id=DEMO_ACCOUNT_ID)


# -- the dependency ---------------------------------------------------------

_bearer = HTTPBearer(auto_error=False, description="Bearer token from `POST /auth/token`.")

_BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]
_Db = Annotated[Session, Depends(get_db)]


def current_account(request: Request, credentials: _BearerCredentials, db: _Db) -> Account:
    """Resolves the bearer token, or raises a 401 problem response."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise problem_exception(
            401,
            "Not authenticated",
            "This endpoint needs a bearer token from POST /auth/token.",
            instance=request.url.path,
            headers={"WWW-Authenticate": "Bearer"},
        )
    account = resolve_token(db, credentials.credentials)
    if account is None:
        raise problem_exception(
            401,
            "Invalid or expired token",
            "Request a new token from POST /auth/token.",
            instance=request.url.path,
            headers={"WWW-Authenticate": "Bearer"},
        )
    return account
