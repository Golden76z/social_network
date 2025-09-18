/**
 * Quick Debug Script
 * 
 * Run this script to quickly identify the specific API issue you're experiencing.
 * This script tests the most common scenarios that cause empty response errors.
 */

import { ApiClient } from '@/lib/api';
import { enhancedApiClient } from '@/lib/api/enhancedApiClient';

export async function quickDebugScript(): Promise<void> {
  console.log('🚀 Quick Debug Script Starting...');
  console.log('This script will help identify the specific API issue you\'re experiencing.\n');

  const apiClient = new ApiClient('http://localhost:8080');
  const enhancedClient = enhancedApiClient;

  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic server connectivity...');
  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      credentials: 'include',
    });
    console.log(`   ✅ Server responding: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`   ❌ Server connection failed: ${error.message}`);
    console.log('   💡 Solution: Make sure the server is running on port 8080');
    return;
  }

  // Test 2: Test the exact endpoint that's failing
  console.log('\n2️⃣ Testing the problematic endpoint...');
  try {
    const result = await apiClient.get('/api/post');
    console.log('   ✅ API endpoint working:', result);
  } catch (error) {
    console.log(`   ❌ API endpoint error: ${error.message}`);
    
    // Test 3: Test with enhanced client
    console.log('\n3️⃣ Testing with enhanced error handling...');
    try {
      const enhancedResult = await enhancedClient.get('/api/post');
      console.log('   ✅ Enhanced client working:', enhancedResult);
    } catch (enhancedError) {
      console.log(`   ❌ Enhanced client error: ${enhancedError.message}`);
    }
  }

  // Test 4: Test authentication status
  console.log('\n4️⃣ Testing authentication status...');
  const isAuth = apiClient.isAuthenticated();
  const user = apiClient.getUserFromToken();
  console.log(`   Authentication status: ${isAuth}`);
  console.log(`   User from token:`, user);

  // Test 5: Test different endpoints
  console.log('\n5️⃣ Testing different API endpoints...');
  const endpoints = [
    '/api/post',
    '/api/user/profile',
    '/api/comment',
    '/api/posts/public',
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
      
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`     Response body: "${text}"`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ${error.message}`);
    }
  }

  // Test 6: Test CSRF token
  console.log('\n6️⃣ Testing CSRF token...');
  try {
    const response = await fetch('http://localhost:8080/api/post', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    const csrfToken = response.headers.get('X-CSRF-Token');
    console.log(`   CSRF token: ${csrfToken || 'Not found'}`);
  } catch (error) {
    console.log(`   CSRF token test failed: ${error.message}`);
  }

  // Test 7: Test with authentication
  console.log('\n7️⃣ Testing with authentication...');
  if (isAuth) {
    try {
      const result = await apiClient.get('/api/post');
      console.log('   ✅ Authenticated request working:', result);
    } catch (error) {
      console.log(`   ❌ Authenticated request error: ${error.message}`);
    }
  } else {
    console.log('   ⚠️ Not authenticated - skipping authenticated tests');
  }

  // Test 8: Test public endpoints
  console.log('\n8️⃣ Testing public endpoints...');
  try {
    const response = await fetch('http://localhost:8080/api/posts/public', {
      method: 'GET',
      credentials: 'include',
    });
    
    console.log(`   Public posts: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Public posts data:`, data);
    } else {
      const text = await response.text();
      console.log(`   Public posts error: "${text}"`);
    }
  } catch (error) {
    console.log(`   Public posts test failed: ${error.message}`);
  }

  console.log('\n🏁 Quick Debug Script completed!');
  console.log('\n📋 Summary:');
  console.log('- If you see empty response bodies, the issue is likely server-side');
  console.log('- If you see proper error messages, the issue is likely client-side');
  console.log('- If you see 401 errors, check authentication');
  console.log('- If you see 404 errors, check API routes');
  console.log('- If you see 500 errors, check server logs');
}

// Run the script if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).quickDebugScript = quickDebugScript;
  console.log('Quick Debug Script loaded. Run quickDebugScript() in console to start.');
} else {
  // Node environment
  quickDebugScript().catch(console.error);
}
