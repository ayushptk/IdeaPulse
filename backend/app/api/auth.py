from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from passlib.context import CryptContext
import httpx

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

class UpdateProfilePayload(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    picture: Optional[str] = None
    bio: Optional[str] = None

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
    
    return {"message": "User verified successfully", "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}}

@router.post("/register")
async def register_user(payload: RegisterPayload, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(payload.password)
    
    avatar_url = f"https://avatar.iran.liara.run/public?username={payload.name.replace(' ', '+')}"
    if payload.name:
        first_name = payload.name.split()[0]
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://api.genderize.io/?name={first_name}", timeout=3.0)
                if response.status_code == 200:
                    data = response.json()
                    gender = data.get("gender")
                    if gender == "male":
                        avatar_url = f"https://avatar.iran.liara.run/public/boy?username={payload.name.replace(' ', '+')}"
                    elif gender == "female":
                        avatar_url = f"https://avatar.iran.liara.run/public/girl?username={payload.name.replace(' ', '+')}"
        except Exception:
            pass
            
    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hashed_password,
        provider="local",
        picture=avatar_url
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "User registered successfully", "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}}

@router.post("/login")
async def login_user(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"message": "Login successful", "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}}

@router.patch("/update")
async def update_profile(payload: UpdateProfilePayload, db: AsyncSession = Depends(get_db)):
    # In a real app, you'd get the user ID from the JWT token.
    # For now, we'll use email as the identifier if provided, or assume a test user.
    if not payload.email:
         raise HTTPException(status_code=400, detail="Email is required to identify user")
    
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name:
        user.name = payload.name
    if payload.picture:
        user.picture = payload.picture
    # If bio is added to User model, update it here. 
    # For now, let's just update name and picture as requested.

    await db.commit()
    await db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture
        }
    }
