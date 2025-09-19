from fastapi import HTTPException, Depends, Request
from typing import Dict, Any, Optional
import os
from datetime import datetime
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from models import User
from auth import get_current_user

# Payment packages (server-side defined for security)
PAYMENT_PACKAGES = {
    "service_basic": {"amount": 50.0, "currency": "brl", "name": "Serviço Básico"},
    "service_premium": {"amount": 150.0, "currency": "brl", "name": "Serviço Premium"},
    "service_deluxe": {"amount": 300.0, "currency": "brl", "name": "Serviço Deluxe"},
}

class PaymentService:
    def __init__(self, database):
        self.db = database
        self.stripe_api_key = os.getenv("STRIPE_API_KEY")
        if not self.stripe_api_key:
            raise ValueError("STRIPE_API_KEY environment variable is required")
    
    def get_stripe_checkout(self, base_url: str) -> StripeCheckout:
        webhook_url = f"{base_url}api/webhook/stripe"
        return StripeCheckout(api_key=self.stripe_api_key, webhook_url=webhook_url)
    
    async def create_payment_transaction(self, 
                                       user_id: str, 
                                       session_id: str, 
                                       amount: float, 
                                       currency: str, 
                                       package_id: str,
                                       metadata: Dict[str, Any] = None) -> str:
        """Create a payment transaction record"""
        transaction = {
            "id": session_id,
            "user_id": user_id,
            "session_id": session_id,
            "amount": amount,
            "currency": currency,
            "package_id": package_id,
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await self.db.payment_transactions.insert_one(transaction)
        return session_id
    
    async def update_payment_transaction(self, session_id: str, status: str, payment_status: str):
        """Update payment transaction status"""
        # Check if already processed to prevent double processing
        existing = await self.db.payment_transactions.find_one({"session_id": session_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Don't update if already completed to prevent double processing
        if existing.get("payment_status") == "paid":
            return existing
        
        update_data = {
            "status": status,
            "payment_status": payment_status,
            "updated_at": datetime.utcnow()
        }
        
        await self.db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return await self.db.payment_transactions.find_one({"session_id": session_id})
    
    async def create_checkout_session(self, 
                                    package_id: str, 
                                    origin_url: str, 
                                    user: User, 
                                    base_url: str,
                                    metadata: Optional[Dict[str, str]] = None) -> CheckoutSessionResponse:
        """Create Stripe checkout session"""
        # Validate package
        if package_id not in PAYMENT_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        
        package = PAYMENT_PACKAGES[package_id]
        
        # Build URLs from origin
        success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/payment/cancel"
        
        # Prepare metadata
        checkout_metadata = {
            "user_id": user.id,
            "user_email": user.email,
            "package_id": package_id,
            **(metadata or {})
        }
        
        # Create checkout session
        stripe_checkout = self.get_stripe_checkout(base_url)
        
        checkout_request = CheckoutSessionRequest(
            amount=package["amount"],
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=checkout_metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        await self.create_payment_transaction(
            user_id=user.id,
            session_id=session.session_id,
            amount=package["amount"],
            currency=package["currency"],
            package_id=package_id,
            metadata=checkout_metadata
        )
        
        return session
    
    async def get_checkout_status(self, session_id: str, base_url: str) -> CheckoutStatusResponse:
        """Get checkout session status"""
        stripe_checkout = self.get_stripe_checkout(base_url)
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update local transaction record
        await self.update_payment_transaction(
            session_id=session_id,
            status=status_response.status,
            payment_status=status_response.payment_status
        )
        
        return status_response
    
    async def handle_webhook(self, body: bytes, signature: str, base_url: str):
        """Handle Stripe webhook"""
        stripe_checkout = self.get_stripe_checkout(base_url)
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            await self.update_payment_transaction(
                session_id=webhook_response.session_id,
                status=webhook_response.event_type,
                payment_status=webhook_response.payment_status
            )
        
        return webhook_response