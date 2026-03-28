from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.auth import generate_api_key, verify_supabase_jwt
from services.database import get_supabase

router = APIRouter()


class CreateKeyRequest(BaseModel):
    name: Optional[str] = None


class CreateKeyResponse(BaseModel):
    id: str
    key: str  # 平文キー（1度だけ表示）
    name: Optional[str]


class ApiKeyInfo(BaseModel):
    id: str
    name: Optional[str]
    created_at: str


@router.post("/keys", response_model=CreateKeyResponse)
async def create_key(
    body: CreateKeyRequest,
    user: dict = Depends(verify_supabase_jwt),
):
    """
    新しいAPIキーを発行する（ログインユーザーのみ）。
    平文キーはこのレスポンスでのみ返却し、DB には SHA-256 ハッシュのみ保存。
    """
    plain, key_hash = generate_api_key()
    supabase = get_supabase()

    result = (
        supabase.table("api_keys")
        .insert({"key_hash": key_hash, "name": body.name, "user_id": user["id"]})
        .execute()
    )
    row = result.data[0]
    return CreateKeyResponse(id=row["id"], key=plain, name=row["name"])


@router.get("/keys", response_model=list[ApiKeyInfo])
async def list_keys(user: dict = Depends(verify_supabase_jwt)):
    """ログインユーザーのAPIキー一覧を返す（key_hashは含まない）。"""
    supabase = get_supabase()
    result = (
        supabase.table("api_keys")
        .select("id, name, created_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [ApiKeyInfo(**r) for r in (result.data or [])]


@router.delete("/keys/{key_id}")
async def delete_key(key_id: str, user: dict = Depends(verify_supabase_jwt)):
    """指定IDのAPIキーを削除する（自分のキーのみ）。"""
    supabase = get_supabase()

    existing = (
        supabase.table("api_keys")
        .select("id")
        .eq("id", key_id)
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="API key not found")

    supabase.table("api_keys").delete().eq("id", key_id).execute()
    return {"status": "deleted"}
