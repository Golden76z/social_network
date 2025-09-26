"use client"
import Link from 'next/link';

const DevPage = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Development Debug Panels</h1>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDevelopment 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isDevelopment ? '✅ Development' : '❌ Production'}
            </div>
            <div className="text-sm text-gray-500">
              ENV: {process.env.NODE_ENV || 'unknown'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Groups Panel */}
          <Link href="/dev/groups" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Groups</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Debug panel for group management, posts, comments, events, and membership features.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Groups</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Posts</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Events</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Members</span>
              </div>
            </div>
          </Link>

          {/* Posts Panel */}
          <Link href="/dev/posts" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Posts & Comments</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Debug panel for regular posts and their comments functionality.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Posts</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Comments</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">CRUD</span>
              </div>
            </div>
          </Link>

          {/* Profile Panel */}
          <Link href="/dev/profile" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Debug panel for user profile management and settings.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Profile</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Settings</span>
              </div>
            </div>
          </Link>

          {/* Palette Panel */}
          <Link href="/dev/palette" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Color Palette</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Visual color palette and theme testing interface.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">Colors</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Theme</span>
              </div>
            </div>
          </Link>

          {/* WebSockets Panel */}
          <Link href="/dev/websockets" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔌</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">WebSockets</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Real-time communication testing and debugging tools.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">WebSocket</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Real-time</span>
              </div>
            </div>
          </Link>

          {/* API Debug Panel */}
          <Link href="/dev/api-debug" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔧</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">API Debug</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Debug authentication, API calls, and token issues.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Auth</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">API</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Debug</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Usage Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each panel provides real-time API testing capabilities</li>
            <li>• Use the input fields to specify IDs for testing specific resources</li>
            <li>• Results are displayed in real-time with success/error indicators</li>
            <li>• All API calls include proper authentication and error handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DevPage;
