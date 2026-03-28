import os
import hashlib
import secrets
import httpx
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.database import get_supabase

_bearer = HTTPBearer()


def hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def generate_api_key() -> tuple[str, str]:
    """
    新しいAPIキーを生成する。
    Returns: (plain_key, key_hash)
    plain_keyはユーザーに1度だけ表示し、DBにはkey_hashのみ保存。
    """
    plain = "rag_eval_" + secrets.token_hex(32)
    return plain, hash_key(plain)


async def verify_api_key(x_api_key: str = Header(...)) -> dict:
    """
    SDK向け: X-API-Key ヘッダーを SHA-256 ハッシュ化して api_keys テーブルと照合。
    """
    key_hash = hash_key(x_api_key)
    supabase = get_supabase()
    result = (
        supabase.table("api_keys")
        .select("id, user_id, name")
        .eq("key_hash", key_hash)
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return result.data


async def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    ダッシュボード向け: Authorization: Bearer <supabase_jwt> を
    PyJWT で直接検証しユーザー情報を返す。
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {credentials.credentials}",
                "apikey": supabase_key,
            },
            timeout=5.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = resp.json()
    return {"id": user["id"], "email": user.get("email")}
