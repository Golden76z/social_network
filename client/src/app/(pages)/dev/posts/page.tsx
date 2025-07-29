"use client"
import { apiClient } from '@/lib/api';
import { postApi } from '@/lib/api/post';
import { useState } from 'react';
import { CreatePostRequest, UpdatePostRequest } from '@/lib/types';

const PostDebugPanel = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [testPostId, setTestPostId] = useState<number>(1);
  const [testUserId, setTestUserId] = useState<number>(1);

  const addResult = (endpoint: string, status: 'success' | 'error', data?: unknown, error?: string) => {
    const result = {
      endpoint,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log(`${status === 'success' ? '✅' : '❌'} ${endpoint}:`, result);
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testEndpoint = async (endpoint: string, apiCall: () => Promise<unknown>) => {
    try {
      console.log(`🧪 Testing ${endpoint}...`);
      const data = await apiCall();
      addResult(endpoint, 'success', data);
    } catch (error) {
      addResult(endpoint, 'error', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Test data for creating posts (matches your backend validation)
  const testPostData: CreatePostRequest = {
    title: "Test Post Title",
    body: "This is a test post body content",
    visibility: "public",
    images: [] // Optional field
  };

  const testUpdateData: UpdatePostRequest = {
    title: "Updated Test Title",
    body: "Updated test post content"
  };

  const testCookies = () => {
    console.log('🍪 Current cookies:', document.cookie);
    console.log('🔍 Has jwt_token:', apiClient.isAuthenticated());
    console.log('👤 User from token:', apiClient.getUserFromToken());
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-2xl z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-3 text-lg">Posts API Debug Panel</h3>
      
      {/* Input controls */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Post ID:</label>
          <input
            type="number"
            value={testPostId}
            onChange={(e) => setTestPostId(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20 text-sm"
          />
          <label className="text-sm font-medium ml-4">User ID:</label>
          <input
            type="number"
            value={testUserId}
            onChange={(e) => setTestUserId(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20 text-sm"
          />
        </div>
      </div>

      {/* GET Methods */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">GET Methods</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* <button
            onClick={() => testEndpoint('GET /api/post (feed)', postApi.getUserFeed)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            User Feed
          </button> */}
          <button
            onClick={() => testEndpoint(`GET /api/post?id=${testPostId}`, () => postApi.getPostById(testPostId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Post by ID
          </button>
          {/* <button
            onClick={() => testEndpoint('GET /api/post?limit=5', () => postApi.getUserFeed(5))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Feed (limit 5)
          </button>
          <button
            onClick={() => testEndpoint('GET /api/post?limit=10&offset=5', () => postApi.getUserFeed(10, 5))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Feed (paginated)
          </button> */}
        </div>
      </div>

      {/* POST/PUT/DELETE Methods */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Modify Methods</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => testEndpoint('POST /api/post', () => postApi.createPost(testPostData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Create Post
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/post/${testPostId}`, () => postApi.updatePost(testPostId, testUpdateData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Post
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/post/${testPostId}`, () => postApi.deletePost(testPostId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Delete Post
          </button>
        </div>
      </div>

      {/* Utility Methods */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Utilities</h4>
        <div className="flex gap-2">
          <button
            onClick={testCookies}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
          >
            Check Auth
          </button>
          <button
            onClick={() => setResults([])}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div className="text-xs max-h-40 overflow-y-auto border-t pt-2">
        <h4 className="font-semibold mb-2">Results:</h4>
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet. Click a button to test an endpoint.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className={`mb-2 p-2 rounded ${
              result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-mono">
                <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {result.status === 'success' ? '✅' : '❌'} {result.endpoint}
                </span>
                <span className="text-gray-500 ml-2">{result.timestamp}</span>
              </div>
              <div className="text-gray-600 mt-1 break-all">
                {result.status === 'success'
                  ? `Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}${JSON.stringify(result.data).length > 200 ? '...' : ''}`
                  : `Error: ${result.error}`
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostDebugPanel;