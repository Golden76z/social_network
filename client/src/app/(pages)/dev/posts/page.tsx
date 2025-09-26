"use client"
import { postApi } from '@/lib/api/post';
import { commentApi } from '@/lib/api/comment';
import { useState } from 'react';
import { 
  CreatePostRequest, UpdatePostRequest,
  CreateCommentRequest, UpdateCommentRequest
} from '@/lib/types';

type PanelResult = {
  endpoint: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  timestamp: string;
};

const PostsDebugPanel = () => {
  const [results, setResults] = useState<PanelResult[]>([]);
  const [testPostId, setTestPostId] = useState("1");
  const [testCommentId, setTestCommentId] = useState("1");

  const addResult = (endpoint: string, status: 'success' | 'error', data?: unknown, error?: string) => {
    const result = {
      endpoint,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log(`${status === 'success' ? '✅' : '❌'} ${endpoint}:`, result);
    setResults(prev => [result, ...prev.slice(0, 14)]);
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

  // --- Sample Data ---
  const testPostData: CreatePostRequest = {
    title: "Test Post",
    body: "This is a test post content",
    visibility: "public"
  };

  const testUpdatePostData: UpdatePostRequest = {
    title: "Updated Post Title",
    body: "Updated post content",
    visibility: "private"
  };

  const testCommentData: CreateCommentRequest = {
    post_id: Number(testPostId),
    body: "This is a test comment"
  };

  const testUpdateCommentData: UpdateCommentRequest = {
    body: "Updated comment content"
  };

  const testCookies = () => console.log('🍪 Cookies:', document.cookie);

  return (
    <div className="fixed bottom-4 left-4 bg-white border rounded-lg p-4 shadow-lg max-w-4xl z-50 max-h-[1200px] overflow-y-auto">
      <h3 className="font-bold mb-3 text-lg">Posts & Comments API Debug Panel</h3>

      {/* Inputs */}
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block font-medium">Post ID:</label>
          <input 
            type="text" 
            value={testPostId}
            onChange={e => setTestPostId(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Comment ID:</label>
          <input 
            type="text" 
            value={testCommentId}
            onChange={e => setTestCommentId(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      {/* Posts */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Posts</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getAllPosts',()=>postApi.getAllPosts())} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">All Posts</button>
          <button onClick={()=>testEndpoint('getPostById',()=>postApi.getPostById(testPostId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createPost',()=>postApi.createPost(testPostData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updatePost',()=>postApi.updatePost(testPostId,testUpdatePostData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deletePost',()=>postApi.deletePost(testPostId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          <p>• <strong>All Posts:</strong> Get all posts with pagination</p>
          <p>• <strong>By ID:</strong> Get specific post by ID</p>
          <p>• <strong>Create:</strong> Create new post (title, body, visibility)</p>
          <p>• <strong>Update:</strong> Update post by ID</p>
          <p>• <strong>Delete:</strong> Delete post by ID</p>
        </div>
      </div>

      {/* Comments */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Comments</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getComments',()=>commentApi.getComments(testPostId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Post Comments</button>
          <button onClick={()=>testEndpoint('getCommentById',()=>commentApi.getCommentById(testCommentId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createComment',()=>commentApi.createComment(testCommentData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updateComment',()=>commentApi.updateComment(testCommentId,testUpdateCommentData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deleteComment',()=>commentApi.deleteComment(testCommentId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          <p>• <strong>Post Comments:</strong> Get all comments for a post (use Post ID)</p>
          <p>• <strong>By ID:</strong> Get specific comment by Comment ID</p>
          <p>• <strong>Create:</strong> Create comment on a post (uses Post ID)</p>
          <p>• <strong>Update:</strong> Update comment by Comment ID</p>
          <p>• <strong>Delete:</strong> Delete comment by Comment ID</p>
        </div>
      </div>

      {/* Utilities */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Utilities</h4>
        <div className="flex gap-2">
          <button onClick={testCookies} className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Check Cookies</button>
          <button onClick={()=>setResults([])} className="bg-gray-500 text-white px-2 py-1 rounded text-xs">Clear Results</button>
        </div>
      </div>

      {/* Results */}
      <div className="text-xs max-h-80 overflow-y-auto border-t pt-2">
        <h4 className="font-semibold mb-2">Results:</h4>
        {results.length===0 ? <p className="text-gray-500">No results yet</p> : results.map((r,i)=>(
          <div key={i} className={`mb-2 p-2 rounded ${r.status==='success'?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
            <div className="font-mono">
              <span className={r.status==='success'?'text-green-600':'text-red-600'}>
                {r.status==='success'?'✅':'❌'} {r.endpoint}
              </span>
              <span className="text-gray-500 ml-2">{r.timestamp}</span>
            </div>
            <div className="text-gray-600 mt-1 break-all">
              {r.status==='success'?`Data: ${JSON.stringify(r.data).substring(0,200)}${JSON.stringify(r.data).length>200?'...':''}`:`Error: ${r.error}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsDebugPanel;