from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from passlib.context import CryptContext

from app.database.db import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AuthPayload(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    provider: str
    provider_id: str

class RegisterPayload(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., max_length=128)

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

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

@router.post("/register")
async def register_user(payload: RegisterPayload, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(payload.password)
    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hashed_password,
        provider="local"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "User registered successfully", "user": {"id": user.id, "email": user.email, "name": user.name}}

@router.post("/login")
async def login_user(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"message": "Login successful", "user": {"id": user.id, "email": user.email, "name": user.name}}
