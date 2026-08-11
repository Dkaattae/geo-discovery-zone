"""Accounts, password hashing and bearer tokens.

The contract's Profiles and Sessions groups hold children's data, so they sit
behind an account belonging to a grown-up. Content stays public — it is
build-time generated and carries no user data.

Everything here is standard library on purpose: PBKDF2-HMAC-SHA256 for
passwords (the hash format records its own parameters, so the cost can be
raised later without invalidating stored hashes) and opaque random bearer
tokens. No JWT, because nothing here needs a token a third party can verify
offline, and an opaque token can be revoked.

The token table lives in memory alongside the store: restarting the process
logs everyone out. That is the same trade as the in-memory store itself.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

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


@dataclass
class Account:
    id: str
    username: str
    password_hash: str
    created_at: datetime


@dataclass
class TokenRecord:
    account_id: str
    expires_at: datetime


@dataclass
class AuthStore:
    accounts: dict[str, Account] = field(default_factory=dict)
    accounts_by_username: dict[str, str] = field(default_factory=dict)
    tokens: dict[str, TokenRecord] = field(default_factory=dict)

    def reset(self) -> None:
        self.accounts.clear()
        self.accounts_by_username.clear()
        self.tokens.clear()

    # -- accounts ---------------------------------------------------------

    def create_account(
        self, username: str, password: str, account_id: str | None = None
    ) -> Account:
        account = Account(
            id=account_id or f"acct-{secrets.token_hex(8)}",
            username=username,
            password_hash=hash_password(password),
            created_at=datetime.now(UTC),
        )
        self.accounts[account.id] = account
        self.accounts_by_username[username.lower()] = account.id
        return account

    def find_by_username(self, username: str) -> Account | None:
        account_id = self.accounts_by_username.get(username.lower())
        return self.accounts.get(account_id) if account_id else None

    def authenticate(self, username: str, password: str) -> Account | None:
        account = self.find_by_username(username)
        if account is None:
            # Hash anyway so a missing username and a wrong password cost the same.
            verify_password(password, hash_password("timing-equaliser"))
            return None
        return account if verify_password(password, account.password_hash) else None

    # -- tokens -----------------------------------------------------------

    def issue_token(self, account_id: str, now: datetime | None = None) -> tuple[str, int]:
        """Returns `(token, expires_in_seconds)`. Only the digest is stored."""
        now = now or datetime.now(UTC)
        token = secrets.token_urlsafe(32)
        self.tokens[_digest(token)] = TokenRecord(account_id=account_id, expires_at=now + TOKEN_TTL)
        return token, int(TOKEN_TTL.total_seconds())

    def resolve_token(self, token: str, now: datetime | None = None) -> Account | None:
        now = now or datetime.now(UTC)
        record = self.tokens.get(_digest(token))
        if record is None:
            return None
        if record.expires_at <= now:
            self.tokens.pop(_digest(token), None)
            return None
        return self.accounts.get(record.account_id)

    def revoke_token(self, token: str) -> None:
        self.tokens.pop(_digest(token), None)

    def seed(self) -> None:
        """A demo grown-up account so the frontend has something to log in as."""
        self.reset()
        self.create_account(DEMO_USERNAME, DEMO_PASSWORD, account_id=DEMO_ACCOUNT_ID)


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


auth_store = AuthStore()

_bearer = HTTPBearer(auto_error=False, description="Bearer token from `POST /auth/token`.")


_BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


def current_account(request: Request, credentials: _BearerCredentials) -> Account:
    """Resolves the bearer token, or raises a 401 problem response."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise problem_exception(
            401,
            "Not authenticated",
            "This endpoint needs a bearer token from POST /auth/token.",
            instance=request.url.path,
            headers={"WWW-Authenticate": "Bearer"},
        )
    account = auth_store.resolve_token(credentials.credentials)
    if account is None:
        raise problem_exception(
            401,
            "Invalid or expired token",
            "Request a new token from POST /auth/token.",
            instance=request.url.path,
            headers={"WWW-Authenticate": "Bearer"},
        )
    return account
