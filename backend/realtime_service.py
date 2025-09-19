import asyncio
import json
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from models import ServiceStatus, User
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Store user locations for real-time tracking
        self.user_locations: Dict[str, Dict[str, float]] = {}
        # Store active service requests for matching
        self.active_services: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's websocket"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")

    def disconnect(self, user_id: str):
        """Disconnect a user's websocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_locations:
            del self.user_locations[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                self.disconnect(user_id)
                return False
        return False

    async def broadcast_to_providers(self, message: dict, exclude_user_id: Optional[str] = None):
        """Broadcast message to all online providers"""
        sent_count = 0
        for user_id, websocket in list(self.active_connections.items()):
            if user_id != exclude_user_id:
                try:
                    await websocket.send_text(json.dumps(message))
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    self.disconnect(user_id)
        return sent_count

    async def update_user_location(self, user_id: str, latitude: float, longitude: float):
        """Update user location for real-time tracking"""
        self.user_locations[user_id] = {
            "latitude": latitude,
            "longitude": longitude,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Broadcast location update to relevant users
        await self.broadcast_location_update(user_id, latitude, longitude)

    async def broadcast_location_update(self, user_id: str, latitude: float, longitude: float):
        """Broadcast location update to users involved in active services"""
        message = {
            "type": "location_update",
            "user_id": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Find services where this user is involved
        involved_users = set()
        for service_id, service in self.active_services.items():
            if user_id in [service.get("client_id"), service.get("provider_id")]:
                # Add both client and provider to notification list
                involved_users.add(service.get("client_id"))
                involved_users.add(service.get("provider_id"))
        
        # Send to all involved users except the sender
        for target_user_id in involved_users:
            if target_user_id and target_user_id != user_id:
                await self.send_personal_message(message, target_user_id)

    async def create_service_request(self, service_data: dict):
        """Handle new service request creation"""
        service_id = service_data["id"]
        self.active_services[service_id] = service_data
        
        # Broadcast to nearby providers
        message = {
            "type": "new_service_request",
            "service": service_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_providers(message, exclude_user_id=service_data["client_id"])
        logger.info(f"Service request {service_id} broadcasted to providers")

    async def update_service_status(self, service_id: str, status: ServiceStatus, provider_id: Optional[str] = None):
        """Update service status and notify relevant users"""
        if service_id not in self.active_services:
            return False
            
        service = self.active_services[service_id]
        service["status"] = status
        service["updated_at"] = datetime.utcnow().isoformat()
        
        if provider_id:
            service["provider_id"] = provider_id
        
        # Create status update message
        message = {
            "type": "service_status_update",
            "service_id": service_id,
            "status": status,
            "service": service,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to client
        await self.send_personal_message(message, service["client_id"])
        
        # Send to provider if assigned
        if service.get("provider_id"):
            await self.send_personal_message(message, service["provider_id"])
        
        # Clean up completed/cancelled services
        if status in [ServiceStatus.COMPLETED, ServiceStatus.CANCELLED]:
            del self.active_services[service_id]
        
        return True

    async def send_chat_message(self, sender_id: str, receiver_id: str, message: str, chat_id: str):
        """Send real-time chat message"""
        message_data = {
            "type": "chat_message",
            "chat_id": chat_id,
            "sender_id": sender_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to receiver if online
        success = await self.send_personal_message(message_data, receiver_id)
        return success

    def get_online_users(self) -> List[str]:
        """Get list of currently online users"""
        return list(self.active_connections.keys())

    def get_user_location(self, user_id: str) -> Optional[Dict[str, float]]:
        """Get current location of a user"""
        return self.user_locations.get(user_id)

    def get_active_services(self) -> Dict[str, Dict]:
        """Get all active services"""
        return self.active_services.copy()

# Global connection manager instance
connection_manager = ConnectionManager()

class RealTimeService:
    def __init__(self, database):
        self.database = database
        self.connection_manager = connection_manager

    async def handle_websocket_connection(self, websocket: WebSocket, user_id: str):
        """Handle WebSocket connection lifecycle"""
        await self.connection_manager.connect(websocket, user_id)
        
        try:
            while True:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                await self.handle_websocket_message(user_id, message)
                
        except WebSocketDisconnect:
            self.connection_manager.disconnect(user_id)
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
            self.connection_manager.disconnect(user_id)

    async def handle_websocket_message(self, user_id: str, message: dict):
        """Handle incoming WebSocket messages"""
        message_type = message.get("type")
        
        if message_type == "location_update":
            latitude = message.get("latitude")
            longitude = message.get("longitude")
            if latitude is not None and longitude is not None:
                await self.connection_manager.update_user_location(user_id, latitude, longitude)
                
        elif message_type == "provider_status":
            # Handle provider online/offline status
            is_online = message.get("is_online", False)
            await self.update_provider_status(user_id, is_online)
            
        elif message_type == "service_response":
            # Handle provider accepting/rejecting service
            service_id = message.get("service_id")
            response = message.get("response")  # "accept" or "reject"
            if service_id and response:
                await self.handle_service_response(user_id, service_id, response)

    async def update_provider_status(self, provider_id: str, is_online: bool):
        """Update provider online/offline status"""
        await self.database.users.update_one(
            {"id": provider_id},
            {"$set": {"is_online": is_online, "updated_at": datetime.utcnow()}}
        )
        
        # Broadcast status change
        message = {
            "type": "provider_status_change",
            "provider_id": provider_id,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.connection_manager.broadcast_to_providers(message, exclude_user_id=provider_id)

    async def handle_service_response(self, provider_id: str, service_id: str, response: str):
        """Handle provider's response to service request"""
        if response == "accept":
            # Update service status to accepted
            await self.connection_manager.update_service_status(
                service_id, 
                ServiceStatus.ACCEPTED, 
                provider_id
            )
            
            # Update database
            await self.database.service_requests.update_one(
                {"id": service_id},
                {"$set": {
                    "status": ServiceStatus.ACCEPTED,
                    "provider_id": provider_id,
                    "updated_at": datetime.utcnow()
                }}
            )
        
        elif response == "reject":
            # Log rejection and continue broadcasting to other providers
            logger.info(f"Provider {provider_id} rejected service {service_id}")

    # Public methods for external use
    async def broadcast_service_request(self, service_data: dict):
        """Public method to broadcast new service request"""
        await self.connection_manager.create_service_request(service_data)

    async def update_service_status_external(self, service_id: str, status: ServiceStatus, provider_id: Optional[str] = None):
        """Public method to update service status"""
        return await self.connection_manager.update_service_status(service_id, status, provider_id)

    async def send_real_time_message(self, sender_id: str, receiver_id: str, message: str, chat_id: str):
        """Public method to send real-time chat message"""
        return await self.connection_manager.send_chat_message(sender_id, receiver_id, message, chat_id)

    def get_connection_manager(self):
        """Get the connection manager instance"""
        return self.connection_manager