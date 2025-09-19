from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from auth import get_current_user
from models import User
from payments import PaymentService

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Request models
class CreateCheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    metadata: Optional[Dict[str, str]] = None

class CheckoutStatusRequest(BaseModel):
    session_id: str

# Initialize payment service (will be set in main server file)
payment_service: Optional[PaymentService] = None

def set_payment_service(service: PaymentService):
    global payment_service
    payment_service = service

@router.post("/checkout/session")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user)
):
    """Create a new checkout session"""
    if not payment_service:
        raise HTTPException(status_code=500, detail="Payment service not initialized")
    
    base_url = str(http_request.base_url)
    
    try:
        session = await payment_service.create_checkout_session(
            package_id=request.package_id,
            origin_url=request.origin_url,
            user=current_user,
            base_url=base_url,
            metadata=request.metadata
        )
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(
    session_id: str,
    http_request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get checkout session status"""
    if not payment_service:
        raise HTTPException(status_code=500, detail="Payment service not initialized")
    
    base_url = str(http_request.base_url)
    
    try:
        status = await payment_service.get_checkout_status(session_id, base_url)
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if not payment_service:
        raise HTTPException(status_code=500, detail="Payment service not initialized")
    
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

@router.get("/packages")
async def get_payment_packages():
    """Get available payment packages"""
    from payments import PAYMENT_PACKAGES
    return {
        "packages": {
            package_id: {
                "name": package["name"],
                "amount": package["amount"],
                "currency": package["currency"]
            }
            for package_id, package in PAYMENT_PACKAGES.items()
        }
    }