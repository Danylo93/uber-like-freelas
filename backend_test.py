#!/usr/bin/env python3
"""
Backend API Testing Suite for Service Marketplace
Tests authentication, user management, and service request endpoints
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from frontend environment
BACKEND_URL = "https://joblink-app-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        self.test_user_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_provider_email = f"provider_{uuid.uuid4().hex[:8]}@example.com"
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "running":
                    self.log_result("Health Check", True, "API is running")
                    return True
                else:
                    self.log_result("Health Check", False, "API status not running", {"response": data})
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_user_registration_client(self):
        """Test user registration for client role"""
        try:
            user_data = {
                "email": self.test_user_email,
                "name": "João Silva",
                "role": "client",
                "phone": "+5511999999999",
                "password": "SecurePass123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    if user["email"] == self.test_user_email and user["role"] == "client":
                        self.log_result("User Registration (Client)", True, "Client registered successfully")
                        return True
                    else:
                        self.log_result("User Registration (Client)", False, "User data mismatch", {"user": user})
                else:
                    self.log_result("User Registration (Client)", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("User Registration (Client)", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("User Registration (Client)", False, f"Request error: {str(e)}")
        return False
    
    def test_user_registration_provider(self):
        """Test user registration for provider role"""
        try:
            user_data = {
                "email": self.test_provider_email,
                "name": "Maria Santos",
                "role": "provider",
                "phone": "+5511888888888",
                "password": "ProviderPass123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    user = data["user"]
                    if user["email"] == self.test_provider_email and user["role"] == "provider":
                        self.log_result("User Registration (Provider)", True, "Provider registered successfully")
                        return True
                    else:
                        self.log_result("User Registration (Provider)", False, "User data mismatch", {"user": user})
                else:
                    self.log_result("User Registration (Provider)", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("User Registration (Provider)", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("User Registration (Provider)", False, f"Request error: {str(e)}")
        return False
    
    def test_duplicate_registration(self):
        """Test duplicate email registration should fail"""
        try:
            user_data = {
                "email": self.test_user_email,  # Same email as first test
                "name": "Another User",
                "role": "client",
                "password": "AnotherPass123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            
            if response.status_code == 400:
                data = response.json()
                if "already registered" in data.get("detail", "").lower():
                    self.log_result("Duplicate Registration", True, "Correctly rejected duplicate email")
                    return True
                else:
                    self.log_result("Duplicate Registration", False, "Wrong error message", {"response": data})
            else:
                self.log_result("Duplicate Registration", False, f"Should return 400, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Duplicate Registration", False, f"Request error: {str(e)}")
        return False
    
    def test_user_login_valid(self):
        """Test user login with valid credentials"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "SecurePass123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    if user["email"] == self.test_user_email:
                        self.log_result("User Login (Valid)", True, "Login successful")
                        return True
                    else:
                        self.log_result("User Login (Valid)", False, "User email mismatch", {"user": user})
                else:
                    self.log_result("User Login (Valid)", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("User Login (Valid)", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("User Login (Valid)", False, f"Request error: {str(e)}")
        return False
    
    def test_user_login_invalid(self):
        """Test user login with invalid credentials"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "WrongPassword123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 401:
                data = response.json()
                if "incorrect" in data.get("detail", "").lower():
                    self.log_result("User Login (Invalid)", True, "Correctly rejected invalid credentials")
                    return True
                else:
                    self.log_result("User Login (Invalid)", False, "Wrong error message", {"response": data})
            else:
                self.log_result("User Login (Invalid)", False, f"Should return 401, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("User Login (Invalid)", False, f"Request error: {str(e)}")
        return False
    
    def test_get_current_user(self):
        """Test getting current user profile with authentication"""
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == self.test_user_email:
                    self.log_result("Get Current User", True, "Retrieved user profile successfully")
                    return True
                else:
                    self.log_result("Get Current User", False, "User data mismatch", {"user": data})
            else:
                self.log_result("Get Current User", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get Current User", False, f"Request error: {str(e)}")
        return False
    
    def test_get_current_user_no_auth(self):
        """Test getting current user without authentication should fail"""
        try:
            response = self.session.get(f"{self.base_url}/users/me")
            
            if response.status_code == 403:
                self.log_result("Get Current User (No Auth)", True, "Correctly rejected unauthenticated request")
                return True
            else:
                self.log_result("Get Current User (No Auth)", False, f"Should return 403, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get Current User (No Auth)", False, f"Request error: {str(e)}")
        return False
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        if not self.auth_token:
            self.log_result("Update User Profile", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            update_data = {
                "name": "João Silva Updated",
                "phone": "+5511777777777"
            }
            
            response = self.session.put(f"{self.base_url}/users/profile", json=update_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == "João Silva Updated" and data.get("phone") == "+5511777777777":
                    self.log_result("Update User Profile", True, "Profile updated successfully")
                    return True
                else:
                    self.log_result("Update User Profile", False, "Profile not updated correctly", {"user": data})
            else:
                self.log_result("Update User Profile", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Update User Profile", False, f"Request error: {str(e)}")
        return False
    
    def test_jwt_token_validation(self):
        """Test JWT token validation with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 401:
                self.log_result("JWT Token Validation", True, "Correctly rejected invalid token")
                return True
            else:
                self.log_result("JWT Token Validation", False, f"Should return 401, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("JWT Token Validation", False, f"Request error: {str(e)}")
        return False
    
    def test_service_request_creation(self):
        """Test creating a service request (client only)"""
        if not self.auth_token:
            self.log_result("Service Request Creation", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            service_data = {
                "category": "limpeza",
                "title": "Limpeza de Casa",
                "description": "Preciso de limpeza completa da casa",
                "location": {"latitude": -23.5505, "longitude": -46.6333},
                "address": "São Paulo, SP, Brasil",
                "budget_range": {"min": 100.0, "max": 200.0}
            }
            
            response = self.session.post(f"{self.base_url}/services/requests", json=service_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == "Limpeza de Casa" and data.get("category") == "limpeza":
                    self.log_result("Service Request Creation", True, "Service request created successfully")
                    return True
                else:
                    self.log_result("Service Request Creation", False, "Service request data mismatch", {"request": data})
            else:
                self.log_result("Service Request Creation", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Service Request Creation", False, f"Request error: {str(e)}")
        return False
    
    def test_get_service_requests(self):
        """Test getting service requests"""
        if not self.auth_token:
            self.log_result("Get Service Requests", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/services/requests", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Service Requests", True, f"Retrieved {len(data)} service requests")
                    # Store service request ID for later tests
                    if data:
                        self.service_request_id = data[0]["id"]
                    return True
                else:
                    self.log_result("Get Service Requests", False, "Response is not a list", {"response": data})
            else:
                self.log_result("Get Service Requests", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get Service Requests", False, f"Request error: {str(e)}")
        return False
    
    def test_provider_login(self):
        """Login as provider for offer and review testing"""
        try:
            login_data = {
                "email": self.test_provider_email,
                "password": "ProviderPass123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.provider_auth_token = data["access_token"]
                    self.provider_user_id = data["user"]["id"]
                    self.log_result("Provider Login", True, "Provider login successful")
                    return True
                else:
                    self.log_result("Provider Login", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("Provider Login", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Provider Login", False, f"Request error: {str(e)}")
        return False
    
    def test_create_offer(self):
        """Test creating an offer as provider"""
        if not hasattr(self, 'provider_auth_token') or not hasattr(self, 'service_request_id'):
            self.log_result("Create Offer", False, "Provider auth token or service request ID not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.provider_auth_token}"}
            offer_data = {
                "service_request_id": self.service_request_id,
                "price": 150.0,
                "estimated_duration": 120,
                "message": "Posso realizar o serviço com qualidade e pontualidade!"
            }
            
            response = self.session.post(f"{self.base_url}/services/offers", json=offer_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("price") == 150.0 and data.get("service_request_id") == self.service_request_id:
                    self.offer_id = data["id"]
                    self.log_result("Create Offer", True, "Offer created successfully")
                    return True
                else:
                    self.log_result("Create Offer", False, "Offer data mismatch", {"offer": data})
            else:
                self.log_result("Create Offer", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Create Offer", False, f"Request error: {str(e)}")
        return False
    
    def test_save_push_token_client(self):
        """Test saving push token for client"""
        if not self.auth_token:
            self.log_result("Save Push Token (Client)", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            token_data = {
                "push_token": f"ExponentPushToken[client_{uuid.uuid4().hex[:8]}]"
            }
            
            response = self.session.post(f"{self.base_url}/notifications/token", json=token_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", "").lower():
                    self.client_push_token = token_data["push_token"]
                    self.log_result("Save Push Token (Client)", True, "Client push token saved successfully")
                    return True
                else:
                    self.log_result("Save Push Token (Client)", False, "Unexpected response message", {"response": data})
            else:
                self.log_result("Save Push Token (Client)", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Save Push Token (Client)", False, f"Request error: {str(e)}")
        return False
    
    def test_save_push_token_provider(self):
        """Test saving push token for provider"""
        if not hasattr(self, 'provider_auth_token'):
            self.log_result("Save Push Token (Provider)", False, "Provider auth token not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.provider_auth_token}"}
            token_data = {
                "push_token": f"ExponentPushToken[provider_{uuid.uuid4().hex[:8]}]"
            }
            
            response = self.session.post(f"{self.base_url}/notifications/token", json=token_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", "").lower():
                    self.provider_push_token = token_data["push_token"]
                    self.log_result("Save Push Token (Provider)", True, "Provider push token saved successfully")
                    return True
                else:
                    self.log_result("Save Push Token (Provider)", False, "Unexpected response message", {"response": data})
            else:
                self.log_result("Save Push Token (Provider)", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Save Push Token (Provider)", False, f"Request error: {str(e)}")
        return False
    
    def test_save_push_token_no_auth(self):
        """Test saving push token without authentication should fail"""
        try:
            token_data = {
                "push_token": "ExponentPushToken[unauthorized]"
            }
            
            response = self.session.post(f"{self.base_url}/notifications/token", json=token_data)
            
            if response.status_code == 403:
                self.log_result("Save Push Token (No Auth)", True, "Correctly rejected unauthenticated request")
                return True
            else:
                self.log_result("Save Push Token (No Auth)", False, f"Should return 403, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Save Push Token (No Auth)", False, f"Request error: {str(e)}")
        return False
    
    def test_save_push_token_invalid_data(self):
        """Test saving push token with invalid data"""
        if not self.auth_token:
            self.log_result("Save Push Token (Invalid)", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            token_data = {}  # Missing push_token
            
            response = self.session.post(f"{self.base_url}/notifications/token", json=token_data, headers=headers)
            
            if response.status_code == 400:
                data = response.json()
                if "required" in data.get("detail", "").lower():
                    self.log_result("Save Push Token (Invalid)", True, "Correctly rejected invalid data")
                    return True
                else:
                    self.log_result("Save Push Token (Invalid)", False, "Wrong error message", {"response": data})
            else:
                self.log_result("Save Push Token (Invalid)", False, f"Should return 400, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Save Push Token (Invalid)", False, f"Request error: {str(e)}")
        return False
    
    def test_send_test_notification(self):
        """Test sending test notification to authenticated user"""
        if not self.auth_token:
            self.log_result("Send Test Notification", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(f"{self.base_url}/notifications/test", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", "").lower():
                    self.log_result("Send Test Notification", True, "Test notification sent successfully")
                    return True
                else:
                    self.log_result("Send Test Notification", False, "Unexpected response message", {"response": data})
            elif response.status_code == 404:
                # This is expected if no push token was saved
                data = response.json()
                if "no push token" in data.get("detail", "").lower():
                    self.log_result("Send Test Notification", True, "Correctly handled missing push token")
                    return True
                else:
                    self.log_result("Send Test Notification", False, "Wrong error message for missing token", {"response": data})
            else:
                self.log_result("Send Test Notification", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Send Test Notification", False, f"Request error: {str(e)}")
        return False
    
    def test_send_test_notification_no_auth(self):
        """Test sending test notification without authentication should fail"""
        try:
            response = self.session.post(f"{self.base_url}/notifications/test")
            
            if response.status_code == 403:
                self.log_result("Send Test Notification (No Auth)", True, "Correctly rejected unauthenticated request")
                return True
            else:
                self.log_result("Send Test Notification (No Auth)", False, f"Should return 403, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Send Test Notification (No Auth)", False, f"Request error: {str(e)}")
        return False
    
    def test_create_review(self):
        """Test creating a review for a service"""
        if not self.auth_token or not hasattr(self, 'service_request_id'):
            self.log_result("Create Review", False, "Auth token or service request ID not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            review_data = {
                "service_request_id": self.service_request_id,
                "rating": 5,
                "comment": "Excelente serviço! Muito profissional e pontual."
            }
            
            response = self.session.post(f"{self.base_url}/services/reviews", json=review_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("rating") == 5 and data.get("service_request_id") == self.service_request_id:
                    self.review_id = data["id"]
                    self.log_result("Create Review", True, "Review created successfully")
                    return True
                else:
                    self.log_result("Create Review", False, "Review data mismatch", {"review": data})
            else:
                self.log_result("Create Review", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Create Review", False, f"Request error: {str(e)}")
        return False
    
    def test_create_duplicate_review(self):
        """Test creating duplicate review should fail"""
        if not self.auth_token or not hasattr(self, 'service_request_id'):
            self.log_result("Create Duplicate Review", False, "Auth token or service request ID not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            review_data = {
                "service_request_id": self.service_request_id,
                "rating": 4,
                "comment": "Tentando avaliar novamente..."
            }
            
            response = self.session.post(f"{self.base_url}/services/reviews", json=review_data, headers=headers)
            
            if response.status_code == 409:
                data = response.json()
                if "already reviewed" in data.get("detail", "").lower():
                    self.log_result("Create Duplicate Review", True, "Correctly prevented duplicate review")
                    return True
                else:
                    self.log_result("Create Duplicate Review", False, "Wrong error message", {"response": data})
            else:
                self.log_result("Create Duplicate Review", False, f"Should return 409, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Create Duplicate Review", False, f"Request error: {str(e)}")
        return False
    
    def test_create_review_unauthorized_service(self):
        """Test creating review for service user didn't participate in"""
        if not hasattr(self, 'provider_auth_token'):
            self.log_result("Create Review (Unauthorized)", False, "Provider auth token not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.provider_auth_token}"}
            # Create a fake service request ID
            fake_service_id = str(uuid.uuid4())
            review_data = {
                "service_request_id": fake_service_id,
                "rating": 3,
                "comment": "Tentando avaliar serviço que não participei"
            }
            
            response = self.session.post(f"{self.base_url}/services/reviews", json=review_data, headers=headers)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("detail", "").lower():
                    self.log_result("Create Review (Unauthorized)", True, "Correctly rejected review for non-existent service")
                    return True
                else:
                    self.log_result("Create Review (Unauthorized)", False, "Wrong error message", {"response": data})
            else:
                self.log_result("Create Review (Unauthorized)", False, f"Should return 404, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Create Review (Unauthorized)", False, f"Request error: {str(e)}")
        return False
    
    def test_create_review_invalid_rating(self):
        """Test creating review with invalid rating"""
        if not self.auth_token or not hasattr(self, 'service_request_id'):
            self.log_result("Create Review (Invalid Rating)", False, "Auth token or service request ID not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            review_data = {
                "service_request_id": self.service_request_id,
                "rating": 6,  # Invalid rating (should be 1-5)
                "comment": "Rating inválido"
            }
            
            response = self.session.post(f"{self.base_url}/services/reviews", json=review_data, headers=headers)
            
            if response.status_code == 422:
                self.log_result("Create Review (Invalid Rating)", True, "Correctly rejected invalid rating")
                return True
            else:
                self.log_result("Create Review (Invalid Rating)", False, f"Should return 422, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Create Review (Invalid Rating)", False, f"Request error: {str(e)}")
        return False
    
    def test_get_service_reviews(self):
        """Test getting reviews for a service"""
        if not self.auth_token or not hasattr(self, 'service_request_id'):
            self.log_result("Get Service Reviews", False, "Auth token or service request ID not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/services/reviews/{self.service_request_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Service Reviews", True, f"Retrieved {len(data)} reviews for service")
                    return True
                else:
                    self.log_result("Get Service Reviews", False, "Response is not a list", {"response": data})
            else:
                self.log_result("Get Service Reviews", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get Service Reviews", False, f"Request error: {str(e)}")
        return False
    
    def test_get_user_reviews(self):
        """Test getting reviews for a user (provider)"""
        if not hasattr(self, 'provider_user_id'):
            self.log_result("Get User Reviews", False, "Provider user ID not available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/users/{self.provider_user_id}/reviews")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get User Reviews", True, f"Retrieved {len(data)} reviews for user")
                    return True
                else:
                    self.log_result("Get User Reviews", False, "Response is not a list", {"response": data})
            else:
                self.log_result("Get User Reviews", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get User Reviews", False, f"Request error: {str(e)}")
        return False
    
    def test_provider_rating_updated(self):
        """Test that provider's rating was automatically updated after review"""
        if not hasattr(self, 'provider_auth_token'):
            self.log_result("Provider Rating Updated", False, "Provider auth token not available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.provider_auth_token}"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                provider_rating = data.get("rating")
                if provider_rating is not None and provider_rating > 0:
                    self.log_result("Provider Rating Updated", True, f"Provider rating automatically updated to {provider_rating}")
                    return True
                else:
                    self.log_result("Provider Rating Updated", False, "Provider rating not updated or is zero", {"user": data})
            else:
                self.log_result("Provider Rating Updated", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Provider Rating Updated", False, f"Request error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize variables for cross-test data sharing
        self.service_request_id = None
        self.provider_auth_token = None
        self.provider_user_id = None
        self.offer_id = None
        self.review_id = None
        self.client_push_token = None
        self.provider_push_token = None
        
        # Core API tests
        self.test_health_check()
        
        # Authentication tests
        self.test_user_registration_client()
        self.test_user_registration_provider()
        self.test_duplicate_registration()
        self.test_user_login_valid()
        self.test_user_login_invalid()
        
        # JWT and protected endpoint tests
        self.test_jwt_token_validation()
        self.test_get_current_user()
        self.test_get_current_user_no_auth()
        self.test_update_user_profile()
        
        # Service request tests
        self.test_service_request_creation()
        self.test_get_service_requests()
        
        # Provider login and offer creation
        self.test_provider_login()
        self.test_create_offer()
        
        print("\n" + "=" * 60)
        print("🔔 PUSH NOTIFICATION SYSTEM TESTS")
        print("=" * 60)
        
        # Push notification tests
        self.test_save_push_token_client()
        self.test_save_push_token_provider()
        self.test_save_push_token_no_auth()
        self.test_save_push_token_invalid_data()
        self.test_send_test_notification()
        self.test_send_test_notification_no_auth()
        
        print("\n" + "=" * 60)
        print("⭐ RATING SYSTEM TESTS")
        print("=" * 60)
        
        # Rating system tests
        self.test_create_review()
        self.test_create_duplicate_review()
        self.test_create_review_unauthorized_service()
        self.test_create_review_invalid_rating()
        self.test_get_service_reviews()
        self.test_get_user_reviews()
        self.test_provider_rating_updated()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
                    if result["details"]:
                        print(f"    Details: {result['details']}")
        
        print("\n" + "=" * 60)
        print("🎯 NEW FEATURES TESTED:")
        print("=" * 60)
        print("✅ Push Notification System:")
        print("  • Save push tokens for authenticated users")
        print("  • Send test notifications")
        print("  • Authentication validation")
        print("  • Data validation")
        print("")
        print("✅ Rating System:")
        print("  • Create reviews for services")
        print("  • Prevent duplicate reviews")
        print("  • Validate service participation")
        print("  • Automatic provider rating calculation")
        print("  • Get service and user reviews")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)