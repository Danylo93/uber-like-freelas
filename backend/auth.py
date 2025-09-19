from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
from models import User, UserCreate, UserLogin, TokenResponse
import bcrypt

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection (will be injected)
db = None

def set_database(database):
    global db
    db = database

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str) -> Optional[User]:
    if db is None:
        return None
    
    user_data = await db.users.find_one({"email": email})
    if user_data:
        # Convert MongoDB _id to string id
        user_data["id"] = str(user_data.pop("_id", user_data.get("id")))
        return User(**user_data)
    return None

async def get_user_by_id(user_id: str) -> Optional[User]:
    if db is None:
        return None
    
    user_data = await db.users.find_one({"id": user_id})
    if user_data:
        user_data["id"] = str(user_data.pop("_id", user_data.get("id")))
        return User(**user_data)
    return None

async def authenticate_user(email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(email)
    if not user:
        return None
    
    # Get the hashed password from database
    user_data = await db.users.find_one({"email": email})
    if not user_data or not verify_password(password, user_data.get("password_hash")):
        return None
    
    return user

async def create_user(user_create: UserCreate) -> User:
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if user already exists
    existing_user = await get_user_by_email(user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user_create.dict()
    password = user_dict.pop("password")
    password_hash = get_password_hash(password)
    
    user = User(**user_dict)
    user_data = user.dict()
    user_data["password_hash"] = password_hash
    user_data["_id"] = user_data["id"]
    
    await db.users.insert_one(user_data)
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception
    
    return user

# Login endpoint logic
async def login_user(user_login: UserLogin) -> TokenResponse:
    user = await authenticate_user(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user
    )

# Register endpoint logic
async def register_user(user_create: UserCreate) -> TokenResponse:
    user = await create_user(user_create)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user
    )