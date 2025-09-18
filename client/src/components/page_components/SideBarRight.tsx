'use client';

export const SideBarRight: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Suggestions */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          Suggestions for you
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              S
            </div>
            <div className="flex-1">
              <p className="text-base font-medium">Suggested User</p>
              <p className="text-sm text-gray-500">Follow</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              F
            </div>
            <div className="flex-1">
              <p className="text-base font-medium">Friend Request</p>
              <p className="text-sm text-gray-500">Follow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Trending</h3>
        <div className="space-y-3">
          <p className="text-base text-gray-700 hover:text-purple-500 cursor-pointer">
            #photography
          </p>
          <p className="text-base text-gray-700 hover:text-purple-500 cursor-pointer">
            #travel
          </p>
          <p className="text-base text-gray-700 hover:text-purple-500 cursor-pointer">
            #food
          </p>
          <p className="text-base text-gray-700 hover:text-purple-500 cursor-pointer">
            #nature
          </p>
        </div>
      </div>
    </div>
  );
};
