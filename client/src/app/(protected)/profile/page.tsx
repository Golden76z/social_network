export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid gap-6">
        {/* Profile Header */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Your Name</h2>
              <p className="text-muted-foreground">@username</p>
              <p className="mt-2 text-sm">Your bio will appear here</p>
            </div>
            <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Groups</div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Your Recent Posts</h3>
          <p className="text-sm text-muted-foreground">Your posts will appear here</p>
        </div>
      </div>
    </div>
  );
}
