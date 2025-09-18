/**
 * Quick API Test - Run this to quickly identify the API error
 * 
 * This is a simple test that reproduces the exact error you're seeing
 * and helps identify what's going wrong.
 */

import { ApiClient } from '@/lib/api';

export async function quickApiTest(): Promise<void> {
  console.log('🔍 Quick API Test - Identifying the error...');
  
  const apiClient = new ApiClient('http://localhost:8080');
  
  // Test 1: Basic connectivity
  console.log('\n1. Testing basic connectivity...');
  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      credentials: 'include',
    });
    console.log(`✅ Server responding with status: ${response.status}`);
  } catch (error) {
    console.log(`❌ Server connection failed: ${error.message}`);
    return;
  }
  
  // Test 2: Test the exact API call that's failing
  console.log('\n2. Testing API client request...');
  try {
    const result = await apiClient.get('/test');
    console.log('✅ API client working:', result);
  } catch (error) {
    console.log(`❌ API client error: ${error.message}`);
    
    // Test 3: Test with different endpoints
    console.log('\n3. Testing different endpoints...');
    const endpoints = [
      '/api/auth/login',
      '/api/posts',
      '/api/users/profile',
      '/api/users/1',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:8080${endpoint}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
        
        console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.log(`   Response body: "${text}"`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
  
  // Test 4: Test authentication
  console.log('\n4. Testing authentication...');
  try {
    const isAuth = apiClient.isAuthenticated();
    const user = apiClient.getUserFromToken();
    console.log(`Authentication status: ${isAuth}`);
    console.log(`User from token:`, user);
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
  }
  
  // Test 5: Test CSRF token
  console.log('\n5. Testing CSRF token...');
  try {
    const response = await fetch('http://localhost:8080/api/posts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    const csrfToken = response.headers.get('X-CSRF-Token');
    console.log(`CSRF token: ${csrfToken || 'Not found'}`);
  } catch (error) {
    console.log(`❌ CSRF token test failed: ${error.message}`);
  }
  
  console.log('\n🏁 Quick API Test completed!');
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).quickApiTest = quickApiTest;
  console.log('Quick API Test loaded. Run quickApiTest() in console to start.');
} else {
  // Node environment
  quickApiTest().catch(console.error);
}
