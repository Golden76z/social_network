import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <div className="flex flex-col ">
        <div className="flex items-center justify-center w-full max-w-md mx-auto mt-8 mb-3">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button className="px-4 py-2 bg-primary text-white font-semibold rounded-r-md hover:bg-primary/80 transition-colors">
            Search
          </button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-4">Welcome to your Feed!</h1>
            <p className="text-muted-foreground">
              This is your home page for connected users. Everything works 🎉
            </p>
          </div>

          <Link
            href="/posts/create"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Post
          </Link>
        </div>

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
            <p className="text-sm text-muted-foreground">
              What&apos;s hot right now
            </p>
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
              Dont miss out on these events
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
