from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
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
from payments import PaymentService
from payment_routes import router as payment_router, set_payment_service
from ai_service import AIService
from ai_routes import router as ai_router, set_ai_service
from notification_service import NotificationService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
database = client[os.environ['DB_NAME']]

# Set database for auth module
set_database(database)

# Initialize services
payment_service = PaymentService(database)
set_payment_service(payment_service)

ai_service = AIService(database)
set_ai_service(ai_service)

notification_service = NotificationService(database)

# Create the main app without a prefix
app = FastAPI(title="Service Marketplace API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Service Marketplace API", "status": "running", "features": ["payments", "ai", "chat"]}

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

# Review routes
@api_router.post("/services/reviews", response_model=Review)
async def create_review(
    review_create: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify service request exists and user was involved
    service_request = await database.service_requests.find_one({"id": review_create.service_request_id})
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Verify user was part of this service (client or provider)
    if current_user.id not in [service_request.get("client_id"), service_request.get("provider_id")]:
        raise HTTPException(status_code=403, detail="You can only review services you participated in")
    
    # Determine reviewee (who is being reviewed)
    reviewee_id = service_request.get("provider_id") if current_user.id == service_request.get("client_id") else service_request.get("client_id")
    
    # Check if review already exists
    existing_review = await database.reviews.find_one({
        "service_request_id": review_create.service_request_id,
        "reviewer_id": current_user.id
    })
    if existing_review:
        raise HTTPException(status_code=409, detail="You have already reviewed this service")
    
    review = Review(**review_create.dict(), reviewer_id=current_user.id, reviewee_id=reviewee_id)
    review_data = review.dict()
    review_data["_id"] = review_data["id"]
    
    await database.reviews.insert_one(review_data)
    
    # Update provider's rating if they were reviewed
    if reviewee_id == service_request.get("provider_id"):
        await update_provider_rating(reviewee_id)
    
    return review

@api_router.get("/services/reviews/{service_request_id}", response_model=List[Review])
async def get_service_reviews(
    service_request_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify user has access to this service request
    service_request = await database.service_requests.find_one({"id": service_request_id})
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if current_user.id not in [service_request.get("client_id"), service_request.get("provider_id")]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    reviews = await database.reviews.find({"service_request_id": service_request_id}).to_list(10)
    return [Review(**{**review, "id": str(review.get("_id", review.get("id")))}) for review in reviews]

@api_router.get("/users/{user_id}/reviews", response_model=List[Review])
async def get_user_reviews(user_id: str):
    """Get reviews for a specific user (provider or client)"""
    reviews = await database.reviews.find({"reviewee_id": user_id}).to_list(100)
    return [Review(**{**review, "id": str(review.get("_id", review.get("id")))}) for review in reviews]

async def update_provider_rating(provider_id: str):
    """Update provider's average rating based on reviews"""
    pipeline = [
        {"$match": {"reviewee_id": provider_id}},
        {"$group": {
            "_id": None,
            "average_rating": {"$avg": "$rating"},
            "review_count": {"$sum": 1}
        }}
    ]
    
    result = await database.reviews.aggregate(pipeline).to_list(1)
    if result:
        avg_rating = round(result[0]["average_rating"], 1)
        await database.users.update_one(
            {"id": provider_id},
            {"$set": {
                "rating": avg_rating,
                "updated_at": datetime.utcnow()
            }}
        )

# Push notification routes
@api_router.post("/notifications/token")
async def save_push_token(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    body = await request.json()
    push_token = body.get("push_token")
    
    if not push_token:
        raise HTTPException(status_code=400, detail="Push token is required")
    
    success = await notification_service.save_push_token(current_user.id, push_token)
    if success:
        return {"message": "Push token saved successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save push token")

@api_router.post("/notifications/test")
async def test_notification(
    current_user: User = Depends(get_current_user)
):
    """Test endpoint to send a notification to current user"""
    push_tokens_map = await notification_service.get_user_push_tokens([current_user.id])
    push_tokens = list(push_tokens_map.values())
    
    if not push_tokens:
        raise HTTPException(status_code=404, detail="No push token found for user")
    
    success = await notification_service.send_push_notification(
        push_tokens=push_tokens,
        title="🔔 Teste de Notificação",
        body="Suas notificações estão funcionando perfeitamente!",
        data={"type": "test"}
    )
    
    if success:
        return {"message": "Test notification sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test notification")

# Webhook route (outside /api prefix for Stripe)
@app.post("/api/webhook/stripe") 
async def stripe_webhook_direct(request: Request):
    """Direct webhook endpoint for Stripe (bypasses /api prefix issue)"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    base_url = str(request.base_url)
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    try:
        webhook_response = await payment_service.handle_webhook(body, signature, base_url)
        return {"received": True, "event_id": webhook_response.event_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include routers
app.include_router(api_router)
app.include_router(payment_router)
app.include_router(ai_router)

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
