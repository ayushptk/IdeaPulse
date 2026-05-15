from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from app.database.db import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AuthPayload(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    provider: str
    provider_id: str

@router.post("/verify")
async def verify_auth(payload: AuthPayload, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Create new user
        user = User(
            email=payload.email,
            name=payload.name,
            picture=payload.picture,
            provider=payload.provider,
            provider_id=payload.provider_id
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return {"message": "User verified successfully", "user": {"id": user.id, "email": user.email, "name": user.name}}
