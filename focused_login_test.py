#!/usr/bin/env python3
"""
Focused Login Test for Service Marketplace
Tests ONLY the specific login scenario requested: test@login.com, TestPassword123!
"""

import requests
import json
import sys

# Backend URL from request
BACKEND_URL = "https://providerapp-1.preview.emergentagent.com/api"

class FocusedLoginTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
        # Specific credentials from request
        self.test_email = "test@login.com"
        self.test_password = "TestPassword123!"
        
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
    
    def test_user_exists_or_create(self):
        """Check if user exists, if not create it first"""
        try:
            # First try to login to see if user exists
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                # User exists and login successful
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Exists Check", True, "User already exists and login successful")
                    return True
                else:
                    self.log_result("User Exists Check", False, "Login response missing token or user", {"response": data})
                    return False
            elif response.status_code == 401:
                # User might exist but wrong password, or user doesn't exist
                # Try to register the user
                user_data = {
                    "email": self.test_email,
                    "name": "Test User",
                    "role": "client",
                    "phone": "+5511999999999",
                    "password": self.test_password
                }
                
                register_response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
                
                if register_response.status_code == 200:
                    reg_data = register_response.json()
                    if "access_token" in reg_data and "user" in reg_data:
                        self.auth_token = reg_data["access_token"]
                        self.log_result("User Exists Check", True, "User created successfully")
                        return True
                    else:
                        self.log_result("User Exists Check", False, "Registration response missing token or user", {"response": reg_data})
                        return False
                elif register_response.status_code == 400:
                    # User already exists but login failed - password issue
                    reg_data = register_response.json()
                    if "already registered" in reg_data.get("detail", "").lower():
                        self.log_result("User Exists Check", False, "User exists but login failed - password mismatch", {"login_response": response.text, "register_response": reg_data})
                        return False
                    else:
                        self.log_result("User Exists Check", False, "Registration failed with unexpected error", {"response": reg_data})
                        return False
                else:
                    self.log_result("User Exists Check", False, f"Registration failed with HTTP {register_response.status_code}", {"response": register_response.text})
                    return False
            else:
                self.log_result("User Exists Check", False, f"Login attempt failed with HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("User Exists Check", False, f"Request error: {str(e)}")
            return False
    
    def test_specific_login(self):
        """Test login with specific credentials: test@login.com, TestPassword123!"""
        try:
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    if user["email"] == self.test_email:
                        self.log_result("Specific Login Test", True, f"Login successful for {self.test_email}")
                        print(f"   JWT Token received: {self.auth_token[:50]}...")
                        print(f"   User ID: {user.get('id')}")
                        print(f"   User Role: {user.get('role')}")
                        return True
                    else:
                        self.log_result("Specific Login Test", False, "User email mismatch in response", {"expected": self.test_email, "received": user.get("email")})
                else:
                    self.log_result("Specific Login Test", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("Specific Login Test", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Specific Login Test", False, f"Request error: {str(e)}")
        return False
    
    def test_jwt_token_validation(self):
        """Test that the JWT token allows access to protected endpoints"""
        if not self.auth_token:
            self.log_result("JWT Token Validation", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == self.test_email:
                    self.log_result("JWT Token Validation", True, "JWT token allows access to protected endpoint /users/me")
                    print(f"   Protected endpoint returned user: {data.get('name')} ({data.get('email')})")
                    return True
                else:
                    self.log_result("JWT Token Validation", False, "Protected endpoint returned wrong user", {"expected": self.test_email, "received": data.get("email")})
            else:
                self.log_result("JWT Token Validation", False, f"Protected endpoint returned HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("JWT Token Validation", False, f"Request error: {str(e)}")
        return False
    
    def test_invalid_token(self):
        """Test that invalid tokens are rejected"""
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 401:
                self.log_result("Invalid Token Test", True, "Invalid token correctly rejected")
                return True
            else:
                self.log_result("Invalid Token Test", False, f"Should return 401, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Invalid Token Test", False, f"Request error: {str(e)}")
        return False
    
    def run_focused_tests(self):
        """Run the focused login tests"""
        print("=" * 80)
        print("FOCUSED LOGIN TEST - SPECIFIC CREDENTIALS")
        print(f"Testing login for: {self.test_email}")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        tests = [
            self.test_health_check,
            self.test_user_exists_or_create,
            self.test_specific_login,
            self.test_jwt_token_validation,
            self.test_invalid_token
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests
        
        print("=" * 80)
        print(f"FOCUSED LOGIN TEST RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Login functionality is working correctly!")
        else:
            print("⚠️  SOME TESTS FAILED - Login functionality has issues")
        
        print("=" * 80)
        
        return passed == total

def main():
    tester = FocusedLoginTester()
    success = tester.run_focused_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()