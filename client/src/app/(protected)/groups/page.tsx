export default function GroupsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Create Group
        </button>
      </div>
      
      <div className="grid gap-6">
        {/* Groups tabs */}
        <div className="flex gap-2 mb-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            My Groups
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Discover
          </button>
          <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            Invitations
          </button>
        </div>

        {/* Groups grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mb-4 flex items-center justify-center text-white text-2xl">
              📚
            </div>
            <h3 className="font-semibold mb-2">Book Club</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A community for book lovers to discuss and share recommendations
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">247 members</span>
              <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors">
                View
              </button>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="w-full h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mb-4 flex items-center justify-center text-white text-2xl">
              💻
            </div>
            <h3 className="font-semibold mb-2">Tech Enthusiasts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discuss the latest in technology, programming, and innovation
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">1.2k members</span>
              <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors">
                View
              </button>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="w-full h-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mb-4 flex items-center justify-center text-white text-2xl">
              🍳
            </div>
            <h3 className="font-semibold mb-2">Cooking Corner</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share recipes, cooking tips, and culinary adventures
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">892 members</span>
              <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors">
                View
              </button>
            </div>
          </div>
        </div>

        {/* Empty state when no groups */}
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-4">👥</div>
          <p className="mb-4">You haven't joined any groups yet</p>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Discover Groups
          </button>
        </div>
      </div>
    </div>
  );
}
