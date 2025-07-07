export default function CreatePostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create a New Post</h1>
      
      <div className="max-w-2xl">
        <div className="p-6 border border-border rounded-lg bg-card">
          <form className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                What&apos;s on your mind?
              </label>
              <textarea
                id="content"
                placeholder="Share your thoughts..."
                className="w-full min-h-32 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
              >
                📷 Photo
              </button>
              
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
              >
                👥 Tag Friends
              </button>
              
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
              >
                🌍 Visibility
              </button>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Save Draft
              </button>
              
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
