from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    CLIENT = "client"
    PROVIDER = "provider"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    avatar: Optional[str] = None  # base64 encoded image

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[UserRole] = None
    location: Optional[Dict[str, float]] = None
    categories: Optional[List[str]] = None  # for providers
    is_online: Optional[bool] = None  # for providers

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    verified: bool = False
    location: Optional[Dict[str, float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Provider specific fields
    categories: Optional[List[str]] = None
    rating: Optional[float] = None
    is_online: Optional[bool] = False
    
    # Client specific fields
    preferred_payment_method: Optional[str] = None

    class Config:
        from_attributes = True

# Service Models
class ServiceCategory(str, Enum):
    CLEANING = "limpeza"
    GARDENING = "jardinagem"
    PAINTING = "pintura"
    ELECTRICAL = "eletrica"
    PLUMBING = "encanamento"
    CARPENTRY = "marcenaria"

class ServiceStatus(str, Enum):
    REQUESTED = "requested"
    MATCHED = "matched"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ServiceRequestCreate(BaseModel):
    category: ServiceCategory
    title: str
    description: str
    location: Dict[str, float]  # lat, lng
    address: str
    images: Optional[List[str]] = None  # base64 encoded images
    budget_range: Optional[Dict[str, float]] = None  # min, max

class ServiceRequest(ServiceRequestCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    provider_id: Optional[str] = None
    status: ServiceStatus = ServiceStatus.REQUESTED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Pricing
    estimated_price: Optional[float] = None
    final_price: Optional[float] = None
    
    # Timeline
    estimated_duration: Optional[int] = None  # in minutes
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# Offer Models
class OfferCreate(BaseModel):
    service_request_id: str
    price: float
    estimated_duration: int  # in minutes
    message: Optional[str] = None

class Offer(OfferCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Review Models
class ReviewCreate(BaseModel):
    service_request_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class Review(ReviewCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reviewer_id: str  # client or provider
    reviewee_id: str  # provider or client
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Message Models
class MessageCreate(BaseModel):
    service_request_id: str
    content: str
    message_type: str = "text"  # text, image, location

class Message(MessageCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

# Response Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# Location Models
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None