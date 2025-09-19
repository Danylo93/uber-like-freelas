#!/usr/bin/env python3
"""
Focused Role Switch Endpoint Test
Tests the GET /api/users/role-switch endpoint with specific user credentials
"""

import requests
import json
import sys

# Backend URL from frontend environment
BACKEND_URL = "https://fastride-2.preview.emergentagent.com/api"

class RoleSwitchTester:
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
    
    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "running":
                    self.log_result("API Health Check", True, "Backend API is running")
                    return True
                else:
                    self.log_result("API Health Check", False, "API status not running", {"response": data})
            else:
                self.log_result("API Health Check", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_specific_user_login(self):
        """Test login with specific user credentials: test@login.com / TestPassword123!"""
        try:
            login_data = {
                "email": "test@login.com",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    self.current_role = user.get("role")
                    self.user_id = user.get("id")
                    self.log_result("Specific User Login", True, f"Login successful - User: {user.get('name')}, Role: {self.current_role}, ID: {self.user_id}")
                    return True
                else:
                    self.log_result("Specific User Login", False, "Missing token or user in response", {"response": data})
            else:
                self.log_result("Specific User Login", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Specific User Login", False, f"Request error: {str(e)}")
        return False
    
    def test_role_switch_endpoint(self):
        """Test the role switch endpoint GET /api/users/role-switch"""
        if not self.auth_token:
            self.log_result("Role Switch Endpoint", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/users/role-switch", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                new_role = data.get("new_role")
                previous_role = data.get("previous_role")
                message = data.get("message")
                
                if new_role and previous_role and message:
                    self.log_result("Role Switch Endpoint", True, f"Role switched successfully: {previous_role} → {new_role}")
                    self.new_role = new_role
                    return True
                else:
                    self.log_result("Role Switch Endpoint", False, "Incomplete response data", {"response": data})
            else:
                self.log_result("Role Switch Endpoint", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Role Switch Endpoint", False, f"Request error: {str(e)}")
        return False
    
    def test_role_persisted_in_database(self):
        """Test that the role change was persisted in the database"""
        if not self.auth_token:
            self.log_result("Role Persistence Check", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                current_role = data.get("role")
                
                if hasattr(self, 'new_role') and current_role == self.new_role:
                    self.log_result("Role Persistence Check", True, f"Role change persisted in database: {current_role}")
                    return True
                else:
                    self.log_result("Role Persistence Check", False, f"Role not persisted correctly. Expected: {getattr(self, 'new_role', 'unknown')}, Got: {current_role}", {"user": data})
            else:
                self.log_result("Role Persistence Check", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Role Persistence Check", False, f"Request error: {str(e)}")
        return False
    
    def test_role_switch_back(self):
        """Test switching role back to original"""
        if not self.auth_token:
            self.log_result("Role Switch Back", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/users/role-switch", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                new_role = data.get("new_role")
                previous_role = data.get("previous_role")
                
                if new_role == self.current_role:
                    self.log_result("Role Switch Back", True, f"Role switched back successfully: {previous_role} → {new_role}")
                    return True
                else:
                    self.log_result("Role Switch Back", False, f"Role not switched back correctly. Expected: {self.current_role}, Got: {new_role}", {"response": data})
            else:
                self.log_result("Role Switch Back", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Role Switch Back", False, f"Request error: {str(e)}")
        return False
    
    def test_role_switch_without_auth(self):
        """Test role switch endpoint without authentication should fail"""
        try:
            response = self.session.get(f"{self.base_url}/users/role-switch")
            
            if response.status_code == 403:
                self.log_result("Role Switch (No Auth)", True, "Correctly rejected unauthenticated request")
                return True
            else:
                self.log_result("Role Switch (No Auth)", False, f"Should return 403, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Role Switch (No Auth)", False, f"Request error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all role switch tests"""
        print("🔄 STARTING ROLE SWITCH ENDPOINT TESTING")
        print("=" * 60)
        
        tests = [
            self.test_health_check,
            self.test_specific_user_login,
            self.test_role_switch_endpoint,
            self.test_role_persisted_in_database,
            self.test_role_switch_back,
            self.test_role_switch_without_auth
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"🏁 ROLE SWITCH TESTING COMPLETED: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL TESTS PASSED - Role switch functionality is working correctly!")
        else:
            print("❌ SOME TESTS FAILED - Role switch functionality has issues")
        
        return passed == total

if __name__ == "__main__":
    tester = RoleSwitchTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)