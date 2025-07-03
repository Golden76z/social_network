export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to your Feed!</h1>
      <p className="text-muted-foreground">This is your home page for connected users. Everything works 🎉</p>
      
      <div className="mt-8 grid gap-4">
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Recent Posts</h3>
          <p className="text-sm text-muted-foreground">Your personalized feed will appear here</p>
        </div>
        
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Friend Activity</h3>
          <p className="text-sm text-muted-foreground">See what your friends are up to</p>
        </div>
      </div>
    </div>
  );
}
