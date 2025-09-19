import os
import uuid
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import User, ServiceRequest

load_dotenv()

class AIService:
    def __init__(self, database):
        self.db = database
        self.llm_key = os.getenv("EMERGENT_LLM_KEY")
        if not self.llm_key:
            raise ValueError("EMERGENT_LLM_KEY environment variable is required")
    
    def _get_chat_client(self, session_id: str, system_message: str) -> LlmChat:
        """Get LLM chat client with configuration"""
        return LlmChat(
            api_key=self.llm_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
    
    async def get_service_recommendations(self, user: User, location: Dict[str, float], query: str = "") -> List[Dict[str, Any]]:
        """Generate AI-powered service recommendations based on user profile and location"""
        try:
            session_id = f"recommendations_{user.id}_{int(datetime.now().timestamp())}"
            
            # Build context
            user_context = f"""
            User Profile:
            - Role: {user.role}
            - Location: Lat {location.get('latitude', 0)}, Lng {location.get('longitude', 0)}
            - Name: {user.name}
            - Previous services: {await self._get_user_service_history(user.id)}
            """
            
            system_message = """
            You are an AI assistant for a service marketplace app. Your job is to recommend relevant services 
            based on user profile, location, and query. Respond with practical, location-appropriate service 
            recommendations in Portuguese. Keep responses concise and helpful.
            
            Format your response as a JSON array of recommendations with this structure:
            [
                {
                    "category": "category_name",
                    "title": "Service Title",
                    "description": "Brief description",
                    "estimated_price": "R$ XX-XX",
                    "urgency": "low|medium|high",
                    "tips": "Helpful tip for this service"
                }
            ]
            """
            
            chat = self._get_chat_client(session_id, system_message)
            
            user_query = f"""
            {user_context}
            
            User query: {query if query else "Preciso de recomendações de serviços para minha localização"}
            
            Please recommend 3-5 relevant services based on the user's context and location.
            """
            
            message = UserMessage(text=user_query)
            response = await chat.send_message(message)
            
            # Store the AI interaction
            await self._store_ai_interaction(user.id, "service_recommendations", user_query, response, session_id)
            
            return self._parse_recommendations_response(response)
            
        except Exception as e:
            print(f"Error getting service recommendations: {e}")
            return self._get_fallback_recommendations()
    
    async def generate_service_description(self, category: str, user_input: str) -> Dict[str, str]:
        """Generate AI-enhanced service description based on user input"""
        try:
            session_id = f"description_{category}_{int(datetime.now().timestamp())}"
            
            system_message = f"""
            You are an AI assistant helping users create better service requests for a {category} service.
            Your job is to enhance and improve the user's service description to make it clearer and more 
            professional while keeping the original intent. Respond in Portuguese.
            
            Return JSON with:
            {{
                "title": "Enhanced title",
                "description": "Enhanced description", 
                "suggestions": ["tip1", "tip2", "tip3"],
                "estimated_duration": "X hours",
                "price_range": "R$ XX - R$ XXX"
            }}
            """
            
            chat = self._get_chat_client(session_id, system_message)
            
            user_query = f"""
            Category: {category}
            User's original description: {user_input}
            
            Please enhance this service request with better title, description, and helpful suggestions.
            """
            
            message = UserMessage(text=user_query)
            response = await chat.send_message(message)
            
            return self._parse_description_response(response)
            
        except Exception as e:
            print(f"Error generating service description: {e}")
            return {
                "title": user_input,
                "description": user_input,
                "suggestions": ["Forneça detalhes específicos sobre o serviço"],
                "estimated_duration": "2-4 hours",
                "price_range": "R$ 50 - R$ 200"
            }
    
    async def get_chat_assistant(self, user: User, service_request_id: str, message: str) -> str:
        """AI assistant for chat conversations about services"""
        try:
            session_id = f"chat_assistant_{service_request_id}_{user.id}"
            
            # Get service context
            service_context = await self._get_service_context(service_request_id)
            
            system_message = f"""
            You are an AI assistant helping with communication in a service marketplace. 
            You help users communicate better about their service requests and provide helpful suggestions.
            Always respond in Portuguese and be helpful, professional, and concise.
            
            Service Context: {service_context}
            User Role: {user.role}
            """
            
            chat = self._get_chat_client(session_id, system_message)
            message_obj = UserMessage(text=message)
            response = await chat.send_message(message_obj)
            
            # Store interaction
            await self._store_ai_interaction(user.id, "chat_assistant", message, response, session_id)
            
            return response
            
        except Exception as e:
            print(f"Error in chat assistant: {e}")
            return "Desculpe, não consegui processar sua mensagem no momento. Tente novamente mais tarde."
    
    async def _get_user_service_history(self, user_id: str) -> str:
        """Get user's service history for context"""
        try:
            requests = await self.db.service_requests.find(
                {"$or": [{"client_id": user_id}, {"provider_id": user_id}]}
            ).limit(5).to_list(5)
            
            if not requests:
                return "Nenhum histórico de serviços"
            
            history = []
            for req in requests:
                history.append(f"- {req.get('category', 'N/A')}: {req.get('title', 'N/A')} ({req.get('status', 'N/A')})")
            
            return "; ".join(history)
        except:
            return "Histórico não disponível"
    
    async def _get_service_context(self, service_request_id: str) -> str:
        """Get service request context"""
        try:
            service = await self.db.service_requests.find_one({"id": service_request_id})
            if service:
                return f"Serviço: {service.get('title', '')} - {service.get('category', '')} - Status: {service.get('status', '')}"
            return "Contexto do serviço não encontrado"
        except:
            return "Contexto não disponível"
    
    async def _store_ai_interaction(self, user_id: str, interaction_type: str, query: str, response: str, session_id: str):
        """Store AI interaction for analytics and improvement"""
        try:
            interaction = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "interaction_type": interaction_type,
                "query": query,
                "response": response,
                "session_id": session_id,
                "timestamp": datetime.utcnow(),
            }
            await self.db.ai_interactions.insert_one(interaction)
        except Exception as e:
            print(f"Error storing AI interaction: {e}")
    
    def _parse_recommendations_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse AI response to extract recommendations"""
        try:
            import json
            # Try to extract JSON from response
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        return self._get_fallback_recommendations()
    
    def _parse_description_response(self, response: str) -> Dict[str, str]:
        """Parse AI response for service description enhancement"""
        try:
            import json
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        return {
            "title": "Serviço solicitado",
            "description": "Descrição do serviço",
            "suggestions": ["Forneça mais detalhes"],
            "estimated_duration": "2-4 hours",
            "price_range": "R$ 50 - R$ 200"
        }
    
    def _get_fallback_recommendations(self) -> List[Dict[str, Any]]:
        """Fallback recommendations if AI fails"""
        return [
            {
                "category": "limpeza",
                "title": "Limpeza Residencial",
                "description": "Limpeza completa da casa",
                "estimated_price": "R$ 80-150",
                "urgency": "medium",
                "tips": "Idealmente agendado semanalmente"
            },
            {
                "category": "jardinagem", 
                "title": "Manutenção de Jardim",
                "description": "Poda e cuidado de plantas",
                "estimated_price": "R$ 60-120",
                "urgency": "low",
                "tips": "Melhor realizado pela manhã"
            },
            {
                "category": "eletrica",
                "title": "Reparos Elétricos",
                "description": "Instalação e manutenção elétrica",
                "estimated_price": "R$ 100-300",
                "urgency": "high",
                "tips": "Sempre use profissionais qualificados"
            }
        ]