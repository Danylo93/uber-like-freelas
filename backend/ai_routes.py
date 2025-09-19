from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from auth import get_current_user
from models import User
from ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Request models
class ServiceRecommendationRequest(BaseModel):
    location: Dict[str, float]
    query: Optional[str] = ""

class ServiceDescriptionRequest(BaseModel):
    category: str
    user_input: str

class ChatAssistantRequest(BaseModel):
    service_request_id: str
    message: str

# Initialize AI service (will be set in main server file)
ai_service: Optional[AIService] = None

def set_ai_service(service: AIService):
    global ai_service
    ai_service = service

@router.post("/recommendations")
async def get_service_recommendations(
    request: ServiceRecommendationRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered service recommendations"""
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI service not initialized")
    
    try:
        recommendations = await ai_service.get_service_recommendations(
            user=current_user,
            location=request.location,
            query=request.query
        )
        
        return {
            "recommendations": recommendations,
            "user_context": {
                "role": current_user.role,
                "location": request.location
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@router.post("/enhance-description")
async def enhance_service_description(
    request: ServiceDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI-enhanced service description"""
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI service not initialized")
    
    try:
        enhanced = await ai_service.generate_service_description(
            category=request.category,
            user_input=request.user_input
        )
        
        return {
            "original": request.user_input,
            "enhanced": enhanced
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing description: {str(e)}")

@router.post("/chat-assistant")
async def chat_assistant(
    request: ChatAssistantRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI assistance for chat conversations"""
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI service not initialized")
    
    try:
        response = await ai_service.get_chat_assistant(
            user=current_user,
            service_request_id=request.service_request_id,
            message=request.message
        )
        
        return {
            "response": response,
            "session_info": {
                "user_id": current_user.id,
                "service_request_id": request.service_request_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat assistant: {str(e)}")

@router.get("/usage-stats")
async def get_ai_usage_stats(current_user: User = Depends(get_current_user)):
    """Get AI usage statistics for the user"""
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI service not initialized")
    
    try:
        # Get user's AI interaction history
        interactions = await ai_service.db.ai_interactions.find(
            {"user_id": current_user.id}
        ).limit(10).to_list(10)
        
        stats = {
            "total_interactions": len(interactions),
            "recent_interactions": [
                {
                    "type": interaction.get("interaction_type"),
                    "timestamp": interaction.get("timestamp"),
                    "session_id": interaction.get("session_id")
                }
                for interaction in interactions[-5:]  # Last 5 interactions
            ]
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting usage stats: {str(e)}")