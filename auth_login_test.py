#!/usr/bin/env python3
"""
Focused Authentication Login Test
Tests specifically the login problem reported by the user
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from frontend environment
BACKEND_URL = "https://fastride-2.preview.emergentagent.com/api"

class AuthLoginTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
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
    
    def test_specific_user_registration(self):
        """Test registration with the specific user data requested"""
        try:
            user_data = {
                "email": "test@login.com",
                "name": "Test User",
                "role": "client",
                "phone": "+5511999999999",
                "password": "TestPassword123!"
            }
            
            print(f"🔄 Registering user: {user_data['email']}")
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            
            print(f"📡 Registration Response Status: {response.status_code}")
            print(f"📡 Registration Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📡 Registration Response Data: {json.dumps(data, indent=2)}")
                
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    if user["email"] == "test@login.com" and user["role"] == "client":
                        self.log_result("Specific User Registration", True, "User registered successfully with correct data")
                        return True
                    else:
                        self.log_result("Specific User Registration", False, "User data mismatch", {"expected_email": "test@login.com", "actual_user": user})
                else:
                    self.log_result("Specific User Registration", False, "Missing token or user in response", {"response": data})
            elif response.status_code == 400:
                # User might already exist, try to continue with login test
                data = response.json()
                if "already registered" in data.get("detail", "").lower():
                    self.log_result("Specific User Registration", True, "User already exists (expected for repeated tests)")
                    return True
                else:
                    self.log_result("Specific User Registration", False, f"HTTP 400 with unexpected message", {"response": data})
            else:
                self.log_result("Specific User Registration", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Specific User Registration", False, f"Request error: {str(e)}")
        return False
    
    def test_specific_user_login(self):
        """Test login with the specific credentials requested"""
        try:
            login_data = {
                "email": "test@login.com",
                "password": "TestPassword123!"
            }
            
            print(f"🔄 Attempting login with: {login_data['email']}")
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            print(f"📡 Login Response Status: {response.status_code}")
            print(f"📡 Login Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📡 Login Response Data: {json.dumps(data, indent=2)}")
                
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    
                    # Verify JWT token format
                    token_parts = self.auth_token.split('.')
                    if len(token_parts) == 3:
                        print(f"✅ JWT Token Format: Valid (3 parts)")
                        print(f"🔑 JWT Token: {self.auth_token[:50]}...")
                    else:
                        print(f"❌ JWT Token Format: Invalid ({len(token_parts)} parts)")
                    
                    if user["email"] == "test@login.com":
                        self.log_result("Specific User Login", True, "Login successful with correct JWT token")
                        return True
                    else:
                        self.log_result("Specific User Login", False, "User email mismatch", {"expected": "test@login.com", "actual": user["email"]})
                else:
                    self.log_result("Specific User Login", False, "Missing token or user in response", {"response": data})
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                print(f"📡 Login Error Response: {data}")
                self.log_result("Specific User Login", False, f"HTTP {response.status_code}", {"response": data})
        except Exception as e:
            self.log_result("Specific User Login", False, f"Request error: {str(e)}")
        return False
    
    def test_password_hashing_verification(self):
        """Test if bcrypt password hashing is working correctly"""
        try:
            # Test with wrong password
            wrong_login_data = {
                "email": "test@login.com",
                "password": "WrongPassword123!"
            }
            
            print(f"🔄 Testing password verification with wrong password")
            response = self.session.post(f"{self.base_url}/auth/login", json=wrong_login_data)
            
            print(f"📡 Wrong Password Response Status: {response.status_code}")
            
            if response.status_code == 401:
                data = response.json()
                print(f"📡 Wrong Password Response: {data}")
                if "incorrect" in data.get("detail", "").lower() or "invalid" in data.get("detail", "").lower():
                    self.log_result("Password Hashing Verification", True, "Bcrypt correctly rejected wrong password")
                    return True
                else:
                    self.log_result("Password Hashing Verification", False, "Wrong error message for invalid password", {"response": data})
            else:
                self.log_result("Password Hashing Verification", False, f"Should return 401 for wrong password, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Password Hashing Verification", False, f"Request error: {str(e)}")
        return False
    
    def test_protected_endpoint_access(self):
        """Test accessing protected endpoint with JWT token"""
        if not self.auth_token:
            self.log_result("Protected Endpoint Access", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            print(f"🔄 Testing protected endpoint with token: {self.auth_token[:50]}...")
            
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            print(f"📡 Protected Endpoint Response Status: {response.status_code}")
            print(f"📡 Protected Endpoint Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📡 Protected Endpoint Response Data: {json.dumps(data, indent=2)}")
                
                if data.get("email") == "test@login.com":
                    self.log_result("Protected Endpoint Access", True, "JWT token successfully authenticated user")
                    return True
                else:
                    self.log_result("Protected Endpoint Access", False, "User data mismatch in protected endpoint", {"expected": "test@login.com", "actual": data.get("email")})
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                print(f"📡 Protected Endpoint Error: {data}")
                self.log_result("Protected Endpoint Access", False, f"HTTP {response.status_code}", {"response": data})
        except Exception as e:
            self.log_result("Protected Endpoint Access", False, f"Request error: {str(e)}")
        return False
    
    def test_jwt_token_validation(self):
        """Test JWT token validation with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_jwt_token_here"}
            print(f"🔄 Testing JWT validation with invalid token")
            
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            print(f"📡 Invalid Token Response Status: {response.status_code}")
            
            if response.status_code == 401:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                print(f"📡 Invalid Token Response: {data}")
                self.log_result("JWT Token Validation", True, "Correctly rejected invalid JWT token")
                return True
            else:
                self.log_result("JWT Token Validation", False, f"Should return 401 for invalid token, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("JWT Token Validation", False, f"Request error: {str(e)}")
        return False
    
    def test_backend_health(self):
        """Test if backend is running and accessible"""
        try:
            print(f"🔄 Testing backend health at: {self.base_url}")
            response = self.session.get(f"{self.base_url}/")
            
            print(f"📡 Health Check Response Status: {response.status_code}")
            print(f"📡 Health Check Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📡 Health Check Response Data: {json.dumps(data, indent=2)}")
                
                if data.get("status") == "running":
                    self.log_result("Backend Health", True, "Backend is running and accessible")
                    return True
                else:
                    self.log_result("Backend Health", False, "Backend status not running", {"response": data})
            else:
                self.log_result("Backend Health", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Backend Health", False, f"Connection error: {str(e)}")
        return False
    
    def run_focused_auth_tests(self):
        """Run focused authentication tests for login problem"""
        print("🔐 FOCUSED AUTHENTICATION LOGIN TESTS")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print(f"Specific scenario: Register and login test@login.com")
        print("=" * 60)
        
        # Test sequence as requested
        print("\n1️⃣ BACKEND HEALTH CHECK")
        print("-" * 30)
        self.test_backend_health()
        
        print("\n2️⃣ USER REGISTRATION")
        print("-" * 30)
        self.test_specific_user_registration()
        
        print("\n3️⃣ USER LOGIN TEST")
        print("-" * 30)
        self.test_specific_user_login()
        
        print("\n4️⃣ PASSWORD HASHING VERIFICATION")
        print("-" * 30)
        self.test_password_hashing_verification()
        
        print("\n5️⃣ JWT TOKEN VALIDATION")
        print("-" * 30)
        self.test_jwt_token_validation()
        
        print("\n6️⃣ PROTECTED ENDPOINT ACCESS")
        print("-" * 30)
        self.test_protected_endpoint_access()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 AUTHENTICATION TEST SUMMARY")
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
        print("🎯 LOGIN PROBLEM ANALYSIS:")
        print("=" * 60)
        
        # Analyze results for login problem
        registration_success = any(r["test"] == "Specific User Registration" and r["success"] for r in self.test_results)
        login_success = any(r["test"] == "Specific User Login" and r["success"] for r in self.test_results)
        password_verification = any(r["test"] == "Password Hashing Verification" and r["success"] for r in self.test_results)
        jwt_validation = any(r["test"] == "JWT Token Validation" and r["success"] for r in self.test_results)
        protected_access = any(r["test"] == "Protected Endpoint Access" and r["success"] for r in self.test_results)
        
        if registration_success and login_success and password_verification and jwt_validation and protected_access:
            print("✅ LOGIN SYSTEM IS WORKING CORRECTLY")
            print("   • User registration: ✅")
            print("   • User login: ✅")
            print("   • Password hashing: ✅")
            print("   • JWT token generation: ✅")
            print("   • Protected endpoint access: ✅")
            print("\n💡 The login problem may be on the frontend side or network connectivity.")
        else:
            print("❌ LOGIN SYSTEM HAS ISSUES:")
            if not registration_success:
                print("   • User registration: ❌")
            if not login_success:
                print("   • User login: ❌")
            if not password_verification:
                print("   • Password hashing: ❌")
            if not jwt_validation:
                print("   • JWT token validation: ❌")
            if not protected_access:
                print("   • Protected endpoint access: ❌")
        
        return failed == 0

if __name__ == "__main__":
    tester = AuthLoginTester()
    success = tester.run_focused_auth_tests()
    sys.exit(0 if success else 1)