from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any, List
from datetime import datetime
from models import User, ServiceRequest, ServiceStatus
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from notification_service import NotificationService

router = APIRouter()

# Database instance (will be set from main server)
database: AsyncIOMotorDatabase = None
notification_service: NotificationService = None

def set_database(db: AsyncIOMotorDatabase):
    global database
    database = db

def set_notification_service(service: NotificationService):
    global notification_service
    notification_service = service

@router.put("/providers/toggle-status")
async def toggle_provider_status(
    current_user: User = Depends(get_current_user)
):
    """Toggle provider online/offline status"""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can toggle status")
    
    # Get current provider status
    provider = await database.users.find_one({"id": current_user.id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    current_status = provider.get("provider_status", "offline")
    new_status = "online" if current_status == "offline" else "offline"
    
    # Update provider status
    await database.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "provider_status": new_status,
                "last_status_change": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Broadcast status change via WebSocket
    if notification_service:
        await notification_service.broadcast_provider_status_change(
            current_user.id, new_status
        )
    
    return {
        "status": new_status,
        "message": f"Status alterado para {new_status}",
        "timestamp": datetime.utcnow()
    }

@router.post("/services/request")
async def create_service_request(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create a new service request"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can request services")
    
    # Validate required fields
    required_fields = ["title", "category", "description"]
    for field in required_fields:
        if field not in request_data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")
    
    # Create service request
    service_request = ServiceRequest(
        client_id=current_user.id,
        title=request_data["title"],
        description=request_data["description"],
        category=request_data["category"],
        budget=request_data.get("budget", 0),
        location={
            "latitude": request_data.get("latitude", -23.5505),
            "longitude": request_data.get("longitude", -46.6333),
            "address": request_data.get("address", "São Paulo, SP")
        },
        status=ServiceStatus.REQUESTED
    )
    
    service_data = service_request.dict()
    service_data["_id"] = service_data["id"]
    
    await database.service_requests.insert_one(service_data)
    
    # Notify nearby providers
    if notification_service:
        await notification_service.notify_nearby_providers(service_request)
    
    return {
        "id": service_request.id,
        "message": "Solicitação criada com sucesso",
        "status": "pending",
        "estimated_response_time": "5-10 minutos"
    }

@router.post("/services/{service_id}/accept")
async def accept_service_request(
    service_id: str,
    current_user: User = Depends(get_current_user)
):
    """Provider accepts a service request"""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can accept services")
    
    # Check if service exists and is pending
    service = await database.service_requests.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service["status"] != ServiceStatus.PENDING:
        raise HTTPException(status_code=400, detail="Service is no longer available")
    
    # Update service request
    await database.service_requests.update_one(
        {"id": service_id},
        {
            "$set": {
                "provider_id": current_user.id,
                "status": ServiceStatus.ACCEPTED,
                "accepted_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notify client
    if notification_service:
        await notification_service.notify_service_accepted(
            service["client_id"], current_user, service
        )
    
    return {
        "message": "Solicitação aceita com sucesso",
        "service_id": service_id,
        "client_id": service["client_id"],
        "next_steps": "Entre em contato com o cliente"
    }

@router.post("/services/{service_id}/reject")
async def reject_service_request(
    service_id: str,
    current_user: User = Depends(get_current_user)
):
    """Provider rejects a service request"""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can reject services")
    
    # Check if service exists
    service = await database.service_requests.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Log rejection (could be used for matching algorithm)
    rejection_data = {
        "service_id": service_id,
        "provider_id": current_user.id,
        "rejected_at": datetime.utcnow(),
        "reason": "provider_declined"
    }
    
    await database.service_rejections.insert_one(rejection_data)
    
    return {
        "message": "Solicitação rejeitada",
        "service_id": service_id
    }

@router.put("/services/{service_id}/status")
async def update_service_status(
    service_id: str,
    status_data: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """Update service status (for providers)"""
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status
    valid_statuses = [s.value for s in ServiceStatus]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Check if service exists and user has permission
    service = await database.service_requests.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Check permissions
    if current_user.role == "provider" and service.get("provider_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "client" and service.get("client_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update status
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow()
    }
    
    if new_status == ServiceStatus.IN_PROGRESS:
        update_data["started_at"] = datetime.utcnow()
    elif new_status == ServiceStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    
    await database.service_requests.update_one(
        {"id": service_id},
        {"$set": update_data}
    )
    
    # Notify relevant parties
    if notification_service:
        if current_user.role == "provider":
            await notification_service.notify_service_status_change(
                service["client_id"], service_id, new_status, current_user
            )
        else:
            if service.get("provider_id"):
                await notification_service.notify_service_status_change(
                    service["provider_id"], service_id, new_status, current_user
                )
    
    return {
        "message": f"Status atualizado para {new_status}",
        "service_id": service_id,
        "new_status": new_status
    }

@router.get("/users/role-switch")
async def switch_user_role(
    current_user: User = Depends(get_current_user)
):
    """Switch user role between client and provider"""
    new_role = "provider" if current_user.role == "client" else "client"
    
    # Update user role
    await database.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "role": new_role,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Perfil alterado para {new_role}",
        "new_role": new_role,
        "previous_role": current_user.role
    }

@router.get("/services/nearby")
async def get_nearby_services(
    latitude: float = -23.5505,
    longitude: float = -46.6333,
    radius: float = 10.0,
    current_user: User = Depends(get_current_user)
):
    """Get nearby service requests for providers"""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view nearby services")
    
    # Find pending service requests within radius
    # For now, we'll return all pending services (geographic filtering can be implemented later)
    services = await database.service_requests.find({
        "status": ServiceStatus.PENDING
    }).to_list(20)
    
    # Format response
    nearby_services = []
    for service in services:
        # Get client info
        client = await database.users.find_one({"id": service["client_id"]})
        
        service_data = {
            "id": service["id"],
            "title": service["title"],
            "description": service["description"],
            "category": service["category"],
            "budget": service.get("budget", 0),
            "location": service.get("location", {}),
            "client_name": client.get("name", "Cliente") if client else "Cliente",
            "created_at": service["created_at"],
            "estimated_duration": service.get("estimated_duration", "2-4 horas")
        }
        nearby_services.append(service_data)
    
    return {
        "services": nearby_services,
        "count": len(nearby_services),
        "radius_km": radius
    }

@router.get("/providers/earnings")
async def get_provider_earnings(
    current_user: User = Depends(get_current_user)
):
    """Get provider earnings summary"""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view earnings")
    
    # Get completed services
    completed_services = await database.service_requests.find({
        "provider_id": current_user.id,
        "status": ServiceStatus.COMPLETED
    }).to_list(100)
    
    # Calculate earnings
    total_earnings = sum(service.get("budget", 0) for service in completed_services)
    service_count = len(completed_services)
    avg_service_value = total_earnings / service_count if service_count > 0 else 0
    
    # Get this month's earnings
    from datetime import datetime, timedelta
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_services = [
        service for service in completed_services 
        if service.get("completed_at", datetime.min) >= start_of_month
    ]
    monthly_earnings = sum(service.get("budget", 0) for service in monthly_services)
    
    return {
        "total_earnings": total_earnings,
        "total_services": service_count,
        "monthly_earnings": monthly_earnings,
        "monthly_services": len(monthly_services),
        "average_service_value": avg_service_value,
        "provider_rating": current_user.rating or 5.0
    }