from fastapi import FastAPI, APIRouter, Depends, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List

# Import our models and auth
from models import *
from auth import *

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
database = client[os.environ['DB_NAME']]

# Set database for auth module
set_database(database)

# Create the main app without a prefix
app = FastAPI(title="Service Marketplace API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Service Marketplace API", "status": "running"}

# Authentication routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_create: UserCreate):
    return await register_user(user_create)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_login: UserLogin):
    return await login_user(user_login)

# User routes
@api_router.get("/users/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/users/profile", response_model=User)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    # Update user in database
    update_data = user_update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await database.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Return updated user
    updated_user_data = await database.users.find_one({"id": current_user.id})
    if updated_user_data:
        updated_user_data["id"] = str(updated_user_data.pop("_id", updated_user_data.get("id")))
        return User(**updated_user_data)
    
    return current_user

# Service request routes
@api_router.post("/services/requests", response_model=ServiceRequest)
async def create_service_request(
    request_create: ServiceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Only clients can create service requests")
    
    service_request = ServiceRequest(**request_create.dict(), client_id=current_user.id)
    request_data = service_request.dict()
    request_data["_id"] = request_data["id"]
    
    await database.service_requests.insert_one(request_data)
    return service_request

@api_router.get("/services/requests", response_model=List[ServiceRequest])
async def get_service_requests(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.CLIENT:
        # Get client's own requests
        requests = await database.service_requests.find({"client_id": current_user.id}).to_list(100)
    else:
        # Get available requests for providers
        requests = await database.service_requests.find({
            "status": {"$in": [ServiceStatus.REQUESTED, ServiceStatus.MATCHED]}
        }).to_list(100)
    
    return [ServiceRequest(**{**req, "id": str(req.get("_id", req.get("id")))}) for req in requests]

@api_router.get("/services/requests/{request_id}", response_model=ServiceRequest)
async def get_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    request_data = await database.service_requests.find_one({"id": request_id})
    if not request_data:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    request_data["id"] = str(request_data.pop("_id", request_data.get("id")))
    return ServiceRequest(**request_data)

# Offer routes
@api_router.post("/services/offers", response_model=Offer)
async def create_offer(
    offer_create: OfferCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=403, detail="Only providers can create offers")
    
    offer = Offer(**offer_create.dict(), provider_id=current_user.id)
    offer_data = offer.dict()
    offer_data["_id"] = offer_data["id"]
    
    await database.offers.insert_one(offer_data)
    return offer

@api_router.get("/services/offers", response_model=List[Offer])
async def get_offers(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.CLIENT:
        # Get offers for client's requests
        client_requests = await database.service_requests.find({"client_id": current_user.id}).to_list(100)
        request_ids = [req["id"] for req in client_requests]
        offers = await database.offers.find({"service_request_id": {"$in": request_ids}}).to_list(100)
    else:
        # Get provider's own offers
        offers = await database.offers.find({"provider_id": current_user.id}).to_list(100)
    
    return [Offer(**{**offer, "id": str(offer.get("_id", offer.get("id")))}) for offer in offers]

# Location update route
@api_router.post("/users/location")
async def update_location(
    location: LocationUpdate,
    current_user: User = Depends(get_current_user)
):
    await database.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "location": {"latitude": location.latitude, "longitude": location.longitude},
            "updated_at": datetime.utcnow()
        }}
    )
    return {"message": "Location updated successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
