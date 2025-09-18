/**
 * API Debug Runner - Run this to debug API issues
 * 
 * This script helps identify what's causing the API error you're seeing.
 * Run this in your browser console or as a test to get detailed information.
 */

import { ApiClient } from '@/lib/api';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { commentApi } from '@/lib/api/comment';

export class ApiDebugRunner {
  private apiClient: ApiClient;
  private results: any[] = [];

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.apiClient = new ApiClient(baseUrl);
  }

  /**
   * Test basic connectivity to the server
   */
  async testServerConnectivity(): Promise<void> {
    console.log('🔍 Testing server connectivity...');
    
    try {
      const response = await fetch(`${this.apiClient['baseUrl']}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        console.log('✅ Server is responding');
        this.results.push({ test: 'server_connectivity', status: 'success', response: await response.text() });
      } else {
        console.log(`❌ Server responded with status: ${response.status}`);
        this.results.push({ test: 'server_connectivity', status: 'error', status: response.status, statusText: response.statusText });
      }
    } catch (error) {
      console.log(`❌ Server connection failed: ${error.message}`);
      this.results.push({ test: 'server_connectivity', status: 'error', error: error.message });
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthenticationEndpoints(): Promise<void> {
    console.log('🔍 Testing authentication endpoints...');
    
    const endpoints = [
      { name: 'login', method: 'POST', url: '/api/auth/login', data: { username: 'test', password: 'test' } },
      { name: 'register', method: 'POST', url: '/api/auth/register', data: { username: 'test', email: 'test@test.com', password: 'test' } },
      { name: 'logout', method: 'POST', url: '/api/auth/logout', data: {} },
    ];

    for (const endpoint of endpoints) {
      try {
        let response;
        if (endpoint.method === 'POST') {
          response = await this.apiClient.post(endpoint.url, endpoint.data);
        } else {
          response = await this.apiClient.get(endpoint.url);
        }
        
        console.log(`✅ ${endpoint.name} endpoint working`);
        this.results.push({ test: `auth_${endpoint.name}`, status: 'success', response });
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint error: ${error.message}`);
        this.results.push({ test: `auth_${endpoint.name}`, status: 'error', error: error.message });
      }
    }
  }

  /**
   * Test user API endpoints
   */
  async testUserEndpoints(): Promise<void> {
    console.log('🔍 Testing user endpoints...');
    
    const endpoints = [
      { name: 'getProfile', test: () => userApi.getProfile() },
      { name: 'getUserById', test: () => userApi.getUserById(1) },
      { name: 'getFollowers', test: () => userApi.getFollowers(1) },
      { name: 'getFollowing', test: () => userApi.getFollowing(1) },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await endpoint.test();
        console.log(`✅ ${endpoint.name} endpoint working`);
        this.results.push({ test: `user_${endpoint.name}`, status: 'success', response });
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint error: ${error.message}`);
        this.results.push({ test: `user_${endpoint.name}`, status: 'error', error: error.message });
      }
    }
  }

  /**
   * Test post API endpoints
   */
  async testPostEndpoints(): Promise<void> {
    console.log('🔍 Testing post endpoints...');
    
    const endpoints = [
      { name: 'getPosts', test: () => postApi.getPosts() },
      { name: 'getPostsByUser', test: () => postApi.getPostsByUser(1) },
      { name: 'getLikedPosts', test: () => postApi.getLikedPosts() },
      { name: 'getCommentedPosts', test: () => postApi.getCommentedPosts() },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await endpoint.test();
        console.log(`✅ ${endpoint.name} endpoint working`);
        this.results.push({ test: `post_${endpoint.name}`, status: 'success', response });
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint error: ${error.message}`);
        this.results.push({ test: `post_${endpoint.name}`, status: 'error', error: error.message });
      }
    }
  }

  /**
   * Test comment API endpoints
   */
  async testCommentEndpoints(): Promise<void> {
    console.log('🔍 Testing comment endpoints...');
    
    const endpoints = [
      { name: 'getComments', test: () => commentApi.getComments(1) },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await endpoint.test();
        console.log(`✅ ${endpoint.name} endpoint working`);
        this.results.push({ test: `comment_${endpoint.name}`, status: 'success', response });
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint error: ${error.message}`);
        this.results.push({ test: `comment_${endpoint.name}`, status: 'error', error: error.message });
      }
    }
  }

  /**
   * Test CSRF token handling
   */
  async testCSRFTokenHandling(): Promise<void> {
    console.log('🔍 Testing CSRF token handling...');
    
    try {
      // First, try to get a CSRF token
      const csrfResponse = await fetch(`${this.apiClient['baseUrl']}/api/posts`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const csrfToken = csrfResponse.headers.get('X-CSRF-Token');
      
      if (csrfToken) {
        console.log(`✅ CSRF token received: ${csrfToken}`);
        this.results.push({ test: 'csrf_token', status: 'success', token: csrfToken });
      } else {
        console.log('❌ No CSRF token received');
        this.results.push({ test: 'csrf_token', status: 'error', error: 'No CSRF token received' });
      }
    } catch (error) {
      console.log(`❌ CSRF token test failed: ${error.message}`);
      this.results.push({ test: 'csrf_token', status: 'error', error: error.message });
    }
  }

  /**
   * Test authentication status
   */
  async testAuthenticationStatus(): Promise<void> {
    console.log('🔍 Testing authentication status...');
    
    try {
      const isAuthenticated = this.apiClient.isAuthenticated();
      const userFromToken = this.apiClient.getUserFromToken();
      
      console.log(`Authentication status: ${isAuthenticated}`);
      console.log(`User from token:`, userFromToken);
      
      this.results.push({ 
        test: 'auth_status', 
        status: 'success', 
        isAuthenticated, 
        userFromToken 
      });
    } catch (error) {
      console.log(`❌ Authentication status test failed: ${error.message}`);
      this.results.push({ test: 'auth_status', status: 'error', error: error.message });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting API Debug Runner...');
    this.results = [];
    
    await this.testServerConnectivity();
    await this.testAuthenticationStatus();
    await this.testCSRFTokenHandling();
    await this.testAuthenticationEndpoints();
    await this.testUserEndpoints();
    await this.testPostEndpoints();
    await this.testCommentEndpoints();
    
    console.log('📊 Test Results Summary:');
    console.table(this.results);
    
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const successCount = this.results.filter(r => r.status === 'success').length;
    
    console.log(`✅ Successful tests: ${successCount}`);
    console.log(`❌ Failed tests: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('🔍 Failed tests details:');
      this.results.filter(r => r.status === 'error').forEach(result => {
        console.log(`- ${result.test}: ${result.error}`);
      });
    }
  }

  /**
   * Get test results
   */
  getResults(): any[] {
    return this.results;
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }
}

// Usage example:
// const debugRunner = new ApiDebugRunner();
// await debugRunner.runAllTests();
