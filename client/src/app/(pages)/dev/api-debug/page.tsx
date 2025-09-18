'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { apiClient } from '@/lib/api';
import { postApi } from '@/lib/api/post';

interface DebugResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

const ApiDebugPage = () => {
  const { user, isAuthenticated, isLoading, hasCheckedAuth } = useAuth();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = new Date().toISOString();
    try {
      console.log(`🧪 Running test: ${testName}`);
      const data = await testFn();
      addResult({
        success: true,
        data,
        timestamp: startTime
      });
      console.log(`✅ Test passed: ${testName}`, data);
    } catch (error: any) {
      addResult({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: startTime
      });
      console.error(`❌ Test failed: ${testName}`, error);
    }
  };

  const testAuthStatus = () => runTest('Auth Status Check', async () => {
    return {
      isAuthenticated: apiClient.isAuthenticated(),
      hasCheckedAuth,
      isLoading,
      user: user ? {
        id: user.id,
        nickname: user.nickname,
        email: user.email
      } : null
    };
  });

  const testJWTToken = () => runTest('JWT Token Parsing', async () => {
    const tokenInfo = apiClient.getUserFromToken();
    return {
      tokenExists: !!tokenInfo,
      tokenInfo,
      cookies: document.cookie.split(';').map(c => c.trim())
    };
  });

  const testPublicPosts = () => runTest('Public Posts API', async () => {
    return await postApi.getPublicPosts();
  });

  const testUserFeed = () => runTest('User Feed API', async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await postApi.getUserFeed();
  });

  const testCSRFToken = () => runTest('CSRF Token Fetch', async () => {
    // Make a simple GET request to trigger CSRF token fetch
    const response = await fetch('http://localhost:8080/api/posts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    const csrfToken = response.headers.get('X-CSRF-Token');
    return {
      status: response.status,
      csrfToken: csrfToken ? `${csrfToken.substring(0, 10)}...` : 'Not found',
      headers: Object.fromEntries(response.headers.entries())
    };
  });

  const testBackendConnection = () => runTest('Backend Connection', async () => {
    // First test if backend is running
    const healthResponse = await fetch('http://localhost:8080/', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Backend not responding: HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }
    
    // Then test the public posts endpoint
    const response = await fetch('http://localhost:8080/api/posts/public', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      backendStatus: healthResponse.status,
      postsStatus: response.status,
      dataLength: Array.isArray(data) ? data.length : 'Not an array',
      sampleData: Array.isArray(data) && data.length > 0 ? data[0] : data
    };
  });

  const testRegister = () => runTest('Test Register', async () => {
    // Try to register a test user with a strong password
    const registerData = {
      email: 'newuser@example.com',
      password: 'Password123!',
      nickname: 'newuser',
      first_name: 'New',
      last_name: 'User',
      date_of_birth: '1990-01-01'
    };
    
    const response = await fetch('http://localhost:8080/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(registerData)
    });
    
    const data = await response.text();
    
    return {
      status: response.status,
      success: response.ok,
      response: data,
      cookiesAfterRegister: document.cookie.split(';').map(c => c.trim())
    };
  });

  const testLogin = () => runTest('Test Login', async () => {
    // Try to login with the existing user
    const loginData = {
      email: 'ckent@example.com',
      password: 'password123'
    };
    
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(loginData)
    });
    
    const data = await response.text();
    
    return {
      status: response.status,
      success: response.ok,
      response: data,
      cookiesAfterLogin: document.cookie.split(';').map(c => c.trim())
    };
  });

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      await testAuthStatus();
      await testJWTToken();
      await testCSRFToken();
      await testBackendConnection();
      await testRegister(); // Try to register first
      await testLogin(); // Then try to login
      await testPublicPosts();
      
      if (isAuthenticated) {
        await testUserFeed();
      }
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">🔧 API Debug Panel</h1>
          <p className="text-gray-600">
            Debug authentication, API calls, and token issues. Check the browser console for detailed logs.
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={testAuthStatus}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Auth Status
            </button>
            
            <button
              onClick={testJWTToken}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test JWT Token
            </button>
            
            <button
              onClick={testCSRFToken}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test CSRF Token
            </button>
            
            <button
              onClick={testBackendConnection}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Backend
            </button>
            
            <button
              onClick={testRegister}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Register
            </button>
            
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              Test Login
            </button>
            
            <button
              onClick={testPublicPosts}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Test Public Posts
            </button>
            
            {isAuthenticated && (
              <button
                onClick={testUserFeed}
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Test User Feed
              </button>
            )}
            
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700">Authentication</h3>
              <p className={`text-lg font-bold ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700">Auth Check</h3>
              <p className={`text-lg font-bold ${hasCheckedAuth ? 'text-green-600' : 'text-yellow-600'}`}>
                {hasCheckedAuth ? '✅ Checked' : '⏳ Checking...'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700">Loading</h3>
              <p className={`text-lg font-bold ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                {isLoading ? '⏳ Loading...' : '✅ Ready'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700">User</h3>
              <p className="text-lg font-bold text-gray-600">
                {user ? `👤 ${user.nickname || user.first_name}` : '❌ No User'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tests run yet. Click "Run All Tests" to start debugging.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '✅ Success' : '❌ Error'}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="mb-2">
                      <p className="text-red-700 font-medium">Error:</p>
                      <p className="text-red-600 text-sm">{result.error}</p>
                    </div>
                  )}
                  
                  {result.data && (
                    <div>
                      <p className={`font-medium ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Data:
                      </p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 Debug Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Run All Tests</strong> - Executes all available tests in sequence</li>
            <li>• <strong>Individual Tests</strong> - Run specific tests to isolate issues</li>
            <li>• <strong>Check Console</strong> - Open browser dev tools to see detailed logs</li>
            <li>• <strong>Check Network</strong> - Monitor API calls in the Network tab</li>
            <li>• <strong>Check Cookies</strong> - Verify JWT token in Application/Storage tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugPage;
