'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { apiClient } from '@/lib/api';

export default function AuthTestPage() {
  const { user, isLoading, isAuthenticated, hasCheckedAuth } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<unknown>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Get token info
    const token = apiClient.getUserFromToken();
    setTokenInfo(token);
    
    // Get all cookies
    setCookies(document.cookie);
  }, []);

  const testTokenDetection = () => {
    const token = apiClient.getUserFromToken();
    setTokenInfo(token);
    console.log('Token detection test:', token);
    
    // Debug cookie parsing
    const cookies = document.cookie.split(';');
    console.log('All cookies:', cookies);
    const jwtCookie = cookies.find(c => c.trim().startsWith('jwt_token='));
    console.log('JWT cookie found:', jwtCookie);
    
    if (jwtCookie) {
      const tokenValue = jwtCookie.split('=')[1];
      console.log('Token value:', tokenValue);
      
      try {
        const parts = tokenValue.split('.');
        console.log('Token parts:', parts.length);
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          console.log('Token payload:', payload);
        }
      } catch (err) {
        console.error('Token parsing error:', err);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="space-y-6">
        {/* Auth State */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
          <div className="space-y-2">
            <p><strong>isLoading:</strong> {isLoading ? 'true' : 'false'}</p>
            <p><strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
            <p><strong>hasCheckedAuth:</strong> {hasCheckedAuth ? 'true' : 'false'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          </div>
        </div>

        {/* Token Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Token Information</h2>
          <div className="space-y-2">
            <p><strong>Token Info:</strong></p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {tokenInfo ? JSON.stringify(tokenInfo, null, 2) : 'No token found'}
            </pre>
            <button 
              onClick={testTokenDetection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Test Token Detection
            </button>
            <button 
              onClick={() => {
                // Force refresh cookies
                setCookies(document.cookie);
                testTokenDetection();
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Refresh & Test
            </button>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="space-y-2">
            <p><strong>All Cookies:</strong></p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {cookies || 'No cookies found'}
            </pre>
          </div>
        </div>

        {/* Manual Token Test */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Token Test</h2>
          <div className="space-y-4">
            <button 
              onClick={() => {
                // Set a test token
                document.cookie = 'jwt_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciIsIm5pY2tuYW1lIjoidGVzdHVzZXIiLCJpc19wcml2YXRlIjpmYWxzZSwiZXhwIjoxNzM0NTY3MjAwfQ.test; path=/';
                testTokenDetection();
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
            >
              Set Test Token
            </button>
            <button 
              onClick={() => {
                // Clear token
                document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                testTokenDetection();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
