from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.auth import generate_api_key, verify_api_key
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
async def create_key(body: CreateKeyRequest):
    """
    新しいAPIキーを発行する。
    平文キーはこのレスポンスでのみ返却し、DB には SHA-256 ハッシュのみ保存。
    """
    plain, key_hash = generate_api_key()
    supabase = get_supabase()

    result = (
        supabase.table("api_keys")
        .insert({"key_hash": key_hash, "name": body.name})
        .execute()
    )
    row = result.data[0]
    return CreateKeyResponse(id=row["id"], key=plain, name=row["name"])


@router.get("/keys", response_model=list[ApiKeyInfo])
async def list_keys(api_key_info: dict = Depends(verify_api_key)):
    """自分のAPIキー一覧を返す（key_hashは含まない）。"""
    supabase = get_supabase()
    result = (
        supabase.table("api_keys")
        .select("id, name, created_at")
        .eq("id", api_key_info["id"])
        .execute()
    )
    return [ApiKeyInfo(**r) for r in (result.data or [])]


@router.delete("/keys/{key_id}")
async def delete_key(key_id: str, api_key_info: dict = Depends(verify_api_key)):
    """指定IDのAPIキーを削除する。自分のキーのみ削除可能。"""
    if key_id != api_key_info["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    supabase = get_supabase()
    supabase.table("api_keys").delete().eq("id", key_id).execute()
    return {"status": "deleted"}
