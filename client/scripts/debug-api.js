#!/usr/bin/env node

/**
 * API Debug Script
 * 
 * Run this script to debug API issues:
 * node scripts/debug-api.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8080';

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    console.log(`\n${method} ${endpoint}:`);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`  Body: "${text}"`);
    
    if (response.ok) {
      console.log(`  ✅ Success`);
    } else {
      console.log(`  ❌ Error`);
    }
    
    return { success: response.ok, status: response.status, body: text };
  } catch (error) {
    console.log(`\n${method} ${endpoint}:`);
    console.log(`  ❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDebugTests() {
  console.log('🔍 API Debug Script Starting...');
  console.log(`Testing server at: ${BASE_URL}`);
  
  // Test 1: Basic connectivity
  console.log('\n1. Testing basic connectivity...');
  await testEndpoint('GET', '/health');
  
  // Test 2: Authentication endpoints
  console.log('\n2. Testing authentication endpoints...');
  await testEndpoint('POST', '/api/auth/login', { username: 'test', password: 'test' });
  await testEndpoint('POST', '/api/auth/register', { username: 'test', email: 'test@test.com', password: 'test' });
  
  // Test 3: User endpoints
  console.log('\n3. Testing user endpoints...');
  await testEndpoint('GET', '/api/users/profile');
  await testEndpoint('GET', '/api/users/1');
  await testEndpoint('GET', '/api/users/1/followers');
  await testEndpoint('GET', '/api/users/1/following');
  
  // Test 4: Post endpoints
  console.log('\n4. Testing post endpoints...');
  await testEndpoint('GET', '/api/posts');
  await testEndpoint('GET', '/api/posts/user/1');
  
  // Test 5: Comment endpoints
  console.log('\n5. Testing comment endpoints...');
  await testEndpoint('GET', '/api/comments/1');
  
  // Test 6: CSRF token
  console.log('\n6. Testing CSRF token...');
  const csrfResponse = await testEndpoint('GET', '/api/posts');
  
  if (csrfResponse.success) {
    console.log('✅ CSRF token test passed');
  } else {
    console.log('❌ CSRF token test failed');
  }
  
  console.log('\n🏁 API Debug Script completed!');
}

// Run the tests
runDebugTests().catch(console.error);
