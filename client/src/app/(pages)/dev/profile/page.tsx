// Add this component temporarily to your app to debug API calls
"use client"

import { apiClient } from '@/lib/api';
import { useState } from 'react';

const DebugApi = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);

  const testEndpoint = async (endpoint: string) => {
    try {
      console.log(`🧪 Testing ${endpoint}...`);
      const data = await apiClient.get(endpoint);
      
      const result = {
        endpoint,
        status: 'success',
        data,
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log(`✅ ${endpoint}:`, result);
      setResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    } catch (error) {
      const result = {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log(`❌ ${endpoint}:`, result);
      setResults(prev => [result, ...prev.slice(0, 4)]);
    }
  };

  const testCookies = () => {
    console.log('🍪 Current cookies:', document.cookie);
    console.log('🔍 Has jwt_token:', apiClient.isAuthenticated());
    console.log('👤 User from token:', apiClient.getUserFromToken());
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">API Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={() => testEndpoint('/api/user/profile')}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2"
        >
          Test Profile
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/user/me')}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
        >
          Test /me
        </button>
        
        <button 
          onClick={testCookies}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
        >
          Check Cookies
        </button>
      </div>

      <div className="text-xs max-h-40 overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className={`mb-2 p-2 rounded ${
            result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="font-mono">
              <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                {result.status === 'success' ? '✅' : '❌'} {result.endpoint}
              </span>
              <span className="text-gray-500 ml-2">{result.timestamp}</span>
            </div>
            <div className="text-gray-600 mt-1">
              {result.status === 'success' 
                ? `Data: ${JSON.stringify(result.data).substring(0, 100)}...`
                : `Error: ${result.error}`
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugApi;