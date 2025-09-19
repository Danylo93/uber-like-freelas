import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
from models import User, ServiceRequest

class NotificationService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.expo_api_url = "https://exp.host/--/api/v2/push/send"
        
    async def save_push_token(self, user_id: str, push_token: str):
        """Save user's push notification token"""
        try:
            await self.db.push_tokens.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "push_token": push_token,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            return True
        except Exception as e:
            print(f"Error saving push token: {e}")
            return False
    
    async def get_user_push_tokens(self, user_ids: List[str]) -> Dict[str, str]:
        """Get push tokens for multiple users"""
        try:
            tokens = await self.db.push_tokens.find(
                {"user_id": {"$in": user_ids}}
            ).to_list(None)
            
            return {
                token["user_id"]: token["push_token"] 
                for token in tokens 
                if token.get("push_token")
            }
        except Exception as e:
            print(f"Error getting push tokens: {e}")
            return {}
    
    async def send_push_notification(
        self, 
        push_tokens: List[str], 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send push notification to multiple tokens"""
        if not push_tokens:
            return False
            
        try:
            messages = []
            for token in push_tokens:
                message = {
                    "to": token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "priority": "high",
                }
                
                if data:
                    message["data"] = data
                    
                messages.append(message)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.expo_api_url,
                    json=messages,
                    headers={
                        "Content-Type": "application/json",
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"Push notification sent successfully: {result}")
                    return True
                else:
                    print(f"Error sending push notification: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            print(f"Error sending push notification: {e}")
            return False
    
    async def notify_new_service_request(self, service_request: ServiceRequest, client: User):
        """Notify nearby providers about new service request"""
        try:
            # Find nearby providers (simplified - in real app, use geospatial query)
            providers = await self.db.users.find({
                "role": "provider",
                "is_online": True,
                # Add geospatial filtering here
            }).to_list(20)  # Limit to 20 nearby providers
            
            if not providers:
                return
                
            provider_ids = [p["id"] for p in providers]
            push_tokens_map = await self.get_user_push_tokens(provider_ids)
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="📋 Nova Solicitação",
                    body=f"{client.name} solicitou um serviço de {service_request.category}",
                    data={
                        "type": "service_request",
                        "service_id": service_request.id,
                        "category": service_request.category,
                        "client_id": client.id
                    }
                )
                
        except Exception as e:
            print(f"Error notifying new service request: {e}")
    
    async def notify_offer_received(self, offer_data: Dict[str, Any], provider: User):
        """Notify client about new offer"""
        try:
            # Get the service request to find the client
            service_request = await self.db.service_requests.find_one(
                {"id": offer_data["service_request_id"]}
            )
            
            if not service_request:
                return
                
            client_id = service_request["client_id"]
            push_tokens_map = await self.get_user_push_tokens([client_id])
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="💰 Nova Oferta",
                    body=f"{provider.name} fez uma oferta de R$ {offer_data['price']}",
                    data={
                        "type": "offer",
                        "offer_id": offer_data["id"],
                        "provider_id": provider.id,
                        "service_id": offer_data["service_request_id"]
                    }
                )
                
        except Exception as e:
            print(f"Error notifying offer received: {e}")
    
    async def notify_service_confirmed(self, service_request: ServiceRequest, provider: User, client: User):
        """Notify both parties when service is confirmed"""
        try:
            user_ids = [client.id, provider.id]
            push_tokens_map = await self.get_user_push_tokens(user_ids)
            
            # Notify client
            if client.id in push_tokens_map:
                await self.send_push_notification(
                    push_tokens=[push_tokens_map[client.id]],
                    title="✅ Serviço Confirmado",
                    body=f"{provider.name} confirmou seu serviço e está a caminho!",
                    data={
                        "type": "service_confirmed",
                        "service_id": service_request.id,
                        "provider_id": provider.id
                    }
                )
            
            # Notify provider
            if provider.id in push_tokens_map:
                await self.send_push_notification(
                    push_tokens=[push_tokens_map[provider.id]],
                    title="🚀 Serviço Aceito",
                    body=f"Você aceitou o serviço de {client.name}. Dirija-se ao local!",
                    data={
                        "type": "service_accepted",
                        "service_id": service_request.id,
                        "client_id": client.id
                    }
                )
                
        except Exception as e:
            print(f"Error notifying service confirmed: {e}")
    
    async def notify_service_completed(self, service_request: ServiceRequest, client: User, provider: User, amount: float):
        """Notify both parties when service is completed"""
        try:
            user_ids = [client.id, provider.id]
            push_tokens_map = await self.get_user_push_tokens(user_ids)
            
            # Notify client
            if client.id in push_tokens_map:
                await self.send_push_notification(
                    push_tokens=[push_tokens_map[client.id]],
                    title="🎉 Serviço Concluído",
                    body=f"Serviço finalizado! Valor: R$ {amount}. Avalie sua experiência.",
                    data={
                        "type": "service_completed",
                        "service_id": service_request.id,
                        "provider_id": provider.id,
                        "amount": amount
                    }
                )
            
            # Notify provider
            if provider.id in push_tokens_map:
                await self.send_push_notification(
                    push_tokens=[push_tokens_map[provider.id]],
                    title="💰 Serviço Finalizado",
                    body=f"Parabéns! Você concluiu o serviço para {client.name}.",
                    data={
                        "type": "service_provider_completed",
                        "service_id": service_request.id,
                        "client_id": client.id,
                        "amount": amount
                    }
                )
                
        except Exception as e:
            print(f"Error notifying service completed: {e}")
    
    async def notify_new_message(self, sender: User, receiver_id: str, message: str, chat_id: str):
        """Notify user about new chat message"""
        try:
            push_tokens_map = await self.get_user_push_tokens([receiver_id])
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title=f"💬 {sender.name}",
                    body=message[:50] + "..." if len(message) > 50 else message,
                    data={
                        "type": "chat_message",
                        "chat_id": chat_id,
                        "sender_id": sender.id
                    }
                )
                
        except Exception as e:
            print(f"Error notifying new message: {e}")
    
    async def notify_payment_received(self, provider: User, amount: float, service_id: str):
        """Notify provider about payment received"""
        try:
            push_tokens_map = await self.get_user_push_tokens([provider.id])
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="💳 Pagamento Recebido",
                    body=f"Você recebeu R$ {amount} pelo serviço realizado!",
                    data={
                        "type": "payment_received",
                        "service_id": service_id,
                        "amount": amount
                    }
                )
                
        except Exception as e:
            print(f"Error notifying payment received: {e}")

    async def broadcast_provider_status_change(self, provider_id: str, new_status: str):
        """Broadcast provider status change (for WebSocket integration later)"""
        try:
            # For now, just log the status change
            # This will be integrated with WebSocket/Firebase later
            print(f"Provider {provider_id} status changed to {new_status}")
            
            # Could notify nearby clients that a provider came online/offline
            if new_status == "online":
                # Find pending service requests that might be interested
                pending_services = await self.db.service_requests.find({
                    "status": "pending"
                }).to_list(10)
                
                for service in pending_services:
                    client_id = service["client_id"]
                    push_tokens_map = await self.get_user_push_tokens([client_id])
                    push_tokens = list(push_tokens_map.values())
                    
                    if push_tokens:
                        await self.send_push_notification(
                            push_tokens=push_tokens,
                            title="🟢 Prestador Disponível",
                            body="Um prestador ficou online próximo a você!",
                            data={
                                "type": "provider_online",
                                "provider_id": provider_id
                            }
                        )
                        break  # Only notify one client to avoid spam
                        
        except Exception as e:
            print(f"Error broadcasting provider status change: {e}")

    async def notify_nearby_providers(self, service_request):
        """Notify nearby providers about new service request"""
        try:
            # Get client info
            client = await self.db.users.find_one({"id": service_request.client_id})
            if not client:
                return
                
            # Find online providers
            providers = await self.db.users.find({
                "role": "provider",
                "provider_status": "online"
            }).to_list(20)
            
            if not providers:
                return
                
            provider_ids = [p["id"] for p in providers]
            push_tokens_map = await self.get_user_push_tokens(provider_ids)
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="📋 Nova Solicitação",
                    body=f"{client['name']} solicitou: {service_request.title}",
                    data={
                        "type": "new_service_request",
                        "service_id": service_request.id,
                        "category": service_request.category,
                        "client_id": client["id"]
                    }
                )
                
        except Exception as e:
            print(f"Error notifying nearby providers: {e}")

    async def notify_service_accepted(self, client_id: str, provider: User, service):
        """Notify client that their service was accepted"""
        try:
            push_tokens_map = await self.get_user_push_tokens([client_id])
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="✅ Solicitação Aceita",
                    body=f"{provider.name} aceitou sua solicitação!",
                    data={
                        "type": "service_accepted",
                        "service_id": service["id"],
                        "provider_id": provider.id,
                        "provider_name": provider.name
                    }
                )
                
        except Exception as e:
            print(f"Error notifying service accepted: {e}")

    async def notify_service_status_change(self, user_id: str, service_id: str, new_status: str, changed_by: User):
        """Notify user about service status change"""
        try:
            push_tokens_map = await self.get_user_push_tokens([user_id])
            push_tokens = list(push_tokens_map.values())
            
            if push_tokens:
                status_messages = {
                    "in_progress": f"🚀 {changed_by.name} iniciou o serviço",
                    "completed": f"🎉 {changed_by.name} finalizou o serviço",
                    "cancelled": f"❌ Serviço cancelado por {changed_by.name}"
                }
                
                message = status_messages.get(new_status, f"Status atualizado: {new_status}")
                
                await self.send_push_notification(
                    push_tokens=push_tokens,
                    title="📄 Status Atualizado",
                    body=message,
                    data={
                        "type": "status_change",
                        "service_id": service_id,
                        "new_status": new_status,
                        "changed_by": changed_by.id
                    }
                )
                
        except Exception as e:
            print(f"Error notifying service status change: {e}")