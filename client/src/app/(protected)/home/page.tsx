export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Feed!</h1>
      <p className="text-muted-foreground">
        This is your home page for connected users. Everything works 🎉
      </p>

      <div className="mt-8 grid gap-4">
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Recent Posts</h3>
          <p className="text-sm text-muted-foreground">
            Your personalized feed will appear here
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Friend Activity</h3>
          <p className="text-sm text-muted-foreground">
            See what your friends are up to
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            Discover new people to follow
          </p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Trending Topics</h3>
          <p className="text-sm text-muted-foreground">What's hot right now</p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Latest News</h3>
          <p className="text-sm text-muted-foreground">
            Stay updated with the latest news
          </p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Upcoming Events</h3>
          <p className="text-sm text-muted-foreground">
            Don't miss out on these events
          </p>
        </div>
      </div>
    </div>
  );
}
