"""Account endpoints: register, exchange credentials for a bearer token, revoke it.

These are additions to `openapi.yaml` (the `Auth` tag), not part of the
original v1 contract — see the note in the README and the spec's
`securitySchemes`.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import Account, auth_store, current_account
from app.models import AccountResponse, RegisterRequest, TokenRequest, TokenResponse
from app.problems import problem_exception
from app.store import iso

router = APIRouter(prefix="/auth", tags=["Auth"])

_bearer = HTTPBearer(auto_error=False)


@router.post(
    "/register",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a grown-up account",
)
def register(request: Request, body: RegisterRequest) -> dict[str, Any]:
    if auth_store.find_by_username(body.username) is not None:
        raise problem_exception(
            409,
            "Username already registered",
            "Sign in instead, or pick a different username.",
            instance=request.url.path,
        )
    account = auth_store.create_account(body.username, body.password)
    return {
        "id": account.id,
        "username": account.username,
        "createdAt": iso(account.created_at),
    }


@router.post("/token", response_model=TokenResponse, summary="Exchange credentials for a token")
def issue_token(request: Request, body: TokenRequest) -> dict[str, Any]:
    account = auth_store.authenticate(body.username, body.password)
    if account is None:
        # One message for both failures: which half was wrong is not the
        # caller's business.
        raise problem_exception(
            401,
            "Invalid credentials",
            "That username and password do not match an account.",
            instance=request.url.path,
            headers={"WWW-Authenticate": "Bearer"},
        )
    token, expires_in = auth_store.issue_token(account.id)
    return {"accessToken": token, "tokenType": "bearer", "expiresIn": expires_in}


@router.get("/me", response_model=AccountResponse, summary="The signed-in account")
def me(account: Annotated[Account, Depends(current_account)]) -> dict[str, Any]:
    return {
        "id": account.id,
        "username": account.username,
        "createdAt": iso(account.created_at),
    }


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the presented token",
)
def logout(
    _: Annotated[Account, Depends(current_account)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
) -> Response:
    if credentials is not None:
        auth_store.revoke_token(credentials.credentials)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
