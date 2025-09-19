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
BACKEND_URL = "https://fixmate-7.preview.emergentagent.com/api"

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
                    return True
                else:
                    self.log_result("Get Service Requests", False, "Response is not a list", {"response": data})
            else:
                self.log_result("Get Service Requests", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Get Service Requests", False, f"Request error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
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
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)