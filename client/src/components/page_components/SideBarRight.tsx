'use client';

export const SideBarRight: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Suggestions */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">
          Suggestions for you
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              S
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Suggested User</p>
              <p className="text-xs text-gray-500">Follow</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              F
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Friend Request</p>
              <p className="text-xs text-gray-500">Follow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Trending</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700 hover:text-blue-500 cursor-pointer">
            #photography
          </p>
          <p className="text-sm text-gray-700 hover:text-blue-500 cursor-pointer">
            #travel
          </p>
          <p className="text-sm text-gray-700 hover:text-blue-500 cursor-pointer">
            #food
          </p>
          <p className="text-sm text-gray-700 hover:text-blue-500 cursor-pointer">
            #nature
          </p>
        </div>
      </div>
    </div>
  );
};
