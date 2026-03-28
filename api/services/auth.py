import hashlib
import secrets
from fastapi import Header, HTTPException
from services.database import get_supabase


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
    X-API-Keyヘッダーを SHA-256 ハッシュ化して api_keys テーブルと照合。
    一致しなければ 401 を返す。
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
