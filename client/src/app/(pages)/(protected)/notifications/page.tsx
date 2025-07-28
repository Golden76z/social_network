export default function NotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      <div className="space-y-4">
        {/* Notification filters */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            All
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Mentions
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Likes
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Comments
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Follows
          </button>
        </div>

        {/* Sample notifications */}
        <div className="space-y-3">
          <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                👤
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">John Doe</span> liked your post
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                💬
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">Jane Smith</span> commented on your post
                </p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm">
                ➕
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">Mike Johnson</span> started following you
                </p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when no real notifications */}
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-4">🔔</div>
          <p>Your notifications will appear here</p>
        </div>
      </div>
    </div>
  );
}
